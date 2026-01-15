import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual, IsNull } from 'typeorm';
import { ExchangeRate } from './entities/exchange-rate.entity';
import { CurrencyType } from '../../common/enums';

@Injectable()
export class ExchangeRatesService {
  constructor(
    @InjectRepository(ExchangeRate)
    private readonly exchangeRateRepository: Repository<ExchangeRate>,
  ) {}

  async getActiveRate(
    fromCurrency: CurrencyType,
    toCurrency: CurrencyType,
  ): Promise<ExchangeRate> {
    const now = new Date();

    const rate = await this.exchangeRateRepository.findOne({
      where: [
        {
          fromCurrency,
          toCurrency,
          isActive: true,
          validFrom: LessThanOrEqual(now),
          validUntil: MoreThanOrEqual(now),
        },
        {
          fromCurrency,
          toCurrency,
          isActive: true,
          validFrom: LessThanOrEqual(now),
          validUntil: IsNull(),
        },
      ],
      order: { validFrom: 'DESC' },
    });

    if (!rate) {
      throw new NotFoundException(
        `No active exchange rate found for ${fromCurrency} to ${toCurrency}`,
      );
    }

    return rate;
  }

  async getAllActiveRates(): Promise<ExchangeRate[]> {
    const now = new Date();

    return await this.exchangeRateRepository.find({
      where: [
        {
          isActive: true,
          validFrom: LessThanOrEqual(now),
          validUntil: MoreThanOrEqual(now),
        },
        {
          isActive: true,
          validFrom: LessThanOrEqual(now),
          validUntil: IsNull(),
        },
      ],
      order: { fromCurrency: 'ASC', toCurrency: 'ASC' },
    });
  }

  async findAll(): Promise<ExchangeRate[]> {
    return await this.exchangeRateRepository.find({
      order: { createdAt: 'DESC' },
    });
  }
}
