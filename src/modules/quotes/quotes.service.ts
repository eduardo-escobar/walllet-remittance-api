import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import Decimal from 'decimal.js';
import { Quote } from './entities/quote.entity';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { ExchangeRatesService } from '../exchange-rates/exchange-rates.service';
import { QuoteStatus } from '../../common/enums';

@Injectable()
export class QuotesService {
  private readonly QUOTE_VALIDITY_MINUTES = 5;
  private readonly FEE_PERCENTAGE = new Decimal('2.5'); // 2.5%

  constructor(
    @InjectRepository(Quote)
    private readonly quoteRepository: Repository<Quote>,
    private readonly exchangeRatesService: ExchangeRatesService,
  ) {}

  async create(createQuoteDto: CreateQuoteDto): Promise<Quote> {
    const { userId, fromCurrency, toCurrency, sendAmount } = createQuoteDto;

    // Validar que las monedas sean diferentes
    if (fromCurrency === toCurrency) {
      throw new BadRequestException('Source and destination currencies must be different');
    }

    // Validar monto
    const amount = new Decimal(sendAmount);
    if (amount.lte(0)) {
      throw new BadRequestException('Send amount must be greater than zero');
    }

    // Obtener tasa de cambio activa
    const exchangeRate = await this.exchangeRatesService.getActiveRate(
      fromCurrency,
      toCurrency,
    );

    // Calcular montos
    const rate = new Decimal(exchangeRate.rate);
    const feeAmount = amount.times(this.FEE_PERCENTAGE).dividedBy(100);
    const totalAmount = amount.plus(feeAmount);
    const receiveAmount = amount.times(rate);

    // Calcular fecha de expiración
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + this.QUOTE_VALIDITY_MINUTES);

    // Crear cotización
    const quote = this.quoteRepository.create({
      userId,
      fromCurrency,
      toCurrency,
      sendAmount: amount.toFixed(4),
      exchangeRate: rate.toFixed(10),
      feePercentage: this.FEE_PERCENTAGE.toFixed(2),
      feeAmount: feeAmount.toFixed(4),
      receiveAmount: receiveAmount.toFixed(4),
      totalAmount: totalAmount.toFixed(4),
      status: QuoteStatus.ACTIVE,
      expiresAt,
    });

    return await this.quoteRepository.save(quote);
  }

  async findOne(id: string): Promise<Quote> {
    const quote = await this.quoteRepository.findOne({
      where: { id },
    });

    if (!quote) {
      throw new NotFoundException(`Quote with ID ${id} not found`);
    }

    return quote;
  }

  async findActiveQuote(id: string): Promise<Quote> {
    const quote = await this.findOne(id);

    // Verificar si la cotización está activa
    if (quote.status !== QuoteStatus.ACTIVE) {
      throw new BadRequestException(`Quote ${id} is not active (status: ${quote.status})`);
    }

    // Verificar si la cotización ha expirado
    if (new Date() > quote.expiresAt) {
      quote.status = QuoteStatus.EXPIRED;
      await this.quoteRepository.save(quote);
      throw new BadRequestException(`Quote ${id} has expired`);
    }

    return quote;
  }

  async markAsUsed(quoteId: string, manager?: any): Promise<void> {
    const repository = manager
      ? manager.getRepository(Quote)
      : this.quoteRepository;

    await repository.update(quoteId, {
      status: QuoteStatus.USED,
      usedAt: new Date(),
    });
  }

  async findByUser(userId: string, limit: number = 20): Promise<Quote[]> {
    return await this.quoteRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async findActiveByUser(userId: string): Promise<Quote[]> {
    return await this.quoteRepository.find({
      where: {
        userId,
        status: QuoteStatus.ACTIVE,
        expiresAt: MoreThan(new Date()),
      },
      order: { createdAt: 'DESC' },
    });
  }
}
