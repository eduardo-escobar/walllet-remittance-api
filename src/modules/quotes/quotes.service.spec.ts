import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuotesService } from './quotes.service';
import { Quote } from './entities/quote.entity';
import { ExchangeRatesService } from '../exchange-rates/exchange-rates.service';
import { WalletsService } from '../wallets/wallets.service';
import { CurrencyType, QuoteStatus } from '../../common/enums';

describe('QuotesService - Dynamic Fee (CLP to PEN)', () => {
  let service: QuotesService;

  const mockQuoteRepository = {
    create: jest.fn((data) => data),
    save: jest.fn((quote) => ({
      id: 'quote-abc-123',
      ...quote,
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
  };

  const mockExchangeRatesService = {
    getActiveRate: jest.fn().mockResolvedValue({
      id: 'rate-789',
      fromCurrency: CurrencyType.CLP,
      toCurrency: CurrencyType.PEN,
      rate: '0.0043',
      isActive: true,
    }),
  };

  const mockWalletsService = {
    findByUserAndCurrency: jest.fn().mockResolvedValue({
      id: 'wallet-456',
      userId: '11111111-1111-1111-1111-111111111111',
      currency: CurrencyType.CLP,
      balance: '5000000.0000',
      availableBalance: '5000000.0000',
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuotesService,
        {
          provide: getRepositoryToken(Quote),
          useValue: mockQuoteRepository,
        },
        {
          provide: ExchangeRatesService,
          useValue: mockExchangeRatesService,
        },
        {
          provide: WalletsService,
          useValue: mockWalletsService,
        },
      ],
    }).compile();

    service = module.get<QuotesService>(QuotesService);
    jest.clearAllMocks();
  });

  it('should apply 1% fee for amounts >= 1,000,000 CLP', async () => {
    const quote = await service.create({
      userId: '11111111-1111-1111-1111-111111111111',
      fromCurrency: CurrencyType.CLP,
      toCurrency: CurrencyType.PEN,
      sendAmount: '1000000.0000',
    });

    expect(quote.feeAmount).toBe('10000.0000');
    expect(quote.totalAmount).toBe('1010000.0000');
  });

  it('should apply 2.5% fee for amounts < 1,000,000 CLP', async () => {
    const quote = await service.create({
      userId: '11111111-1111-1111-1111-111111111111',
      fromCurrency: CurrencyType.CLP,
      toCurrency: CurrencyType.PEN,
      sendAmount: '500000.0000',
    });

    expect(quote.feeAmount).toBe('12500.0000');
    expect(quote.totalAmount).toBe('512500.0000');
  });

  it('should apply 2.5% fee for 999,999 CLP (just below threshold)', async () => {
    const quote = await service.create({
      userId: '11111111-1111-1111-1111-111111111111',
      fromCurrency: CurrencyType.CLP,
      toCurrency: CurrencyType.PEN,
      sendAmount: '999999.0000',
    });

    expect(quote.feeAmount).toBe('24999.9750');
    expect(quote.totalAmount).toBe('1024998.9750');
  });
});