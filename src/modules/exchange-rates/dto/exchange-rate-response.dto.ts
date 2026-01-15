import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CurrencyType } from '../../../common/enums';
import { ExchangeRate } from '../entities/exchange-rate.entity';

export class ExchangeRateResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ enum: CurrencyType, example: CurrencyType.CLP })
  fromCurrency: CurrencyType;

  @ApiProperty({ enum: CurrencyType, example: CurrencyType.PEN })
  toCurrency: CurrencyType;

  @ApiProperty({ example: '0.0045000000' })
  rate: string;

  @ApiProperty({ example: '222.2222222222' })
  inverseRate: string;

  @ApiProperty({ example: 'manual' })
  source: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '2024-01-14T00:00:00Z' })
  validFrom: Date;

  @ApiPropertyOptional({ example: '2024-01-15T00:00:00Z' })
  validUntil?: Date;

  @ApiProperty({ example: '2024-01-14T10:30:00Z' })
  createdAt: Date;

  static fromEntity(exchangeRate: ExchangeRate): ExchangeRateResponseDto {
    const dto = new ExchangeRateResponseDto();
    dto.id = exchangeRate.id;
    dto.fromCurrency = exchangeRate.fromCurrency;
    dto.toCurrency = exchangeRate.toCurrency;
    dto.rate = exchangeRate.rate;
    dto.inverseRate = exchangeRate.inverseRate;
    dto.source = exchangeRate.source;
    dto.isActive = exchangeRate.isActive;
    dto.validFrom = exchangeRate.validFrom;
    dto.validUntil = exchangeRate.validUntil;
    dto.createdAt = exchangeRate.createdAt;
    return dto;
  }
}
