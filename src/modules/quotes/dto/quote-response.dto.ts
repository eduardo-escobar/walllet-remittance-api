import { ApiProperty } from '@nestjs/swagger';
import { CurrencyType, QuoteStatus } from '../../../common/enums';
import { Quote } from '../entities/quote.entity';

export class QuoteResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  userId: string;

  @ApiProperty({ enum: CurrencyType, example: CurrencyType.CLP })
  fromCurrency: CurrencyType;

  @ApiProperty({ enum: CurrencyType, example: CurrencyType.PEN })
  toCurrency: CurrencyType;

  @ApiProperty({ example: '100000.0000' })
  sendAmount: string;

  @ApiProperty({ example: '0.0045000000' })
  exchangeRate: string;

  @ApiProperty({ example: '2.50' })
  feePercentage: string;

  @ApiProperty({ example: '2500.0000' })
  feeAmount: string;

  @ApiProperty({ example: '438.7500' })
  receiveAmount: string;

  @ApiProperty({ example: '102500.0000' })
  totalAmount: string;

  @ApiProperty({ enum: QuoteStatus, example: QuoteStatus.ACTIVE })
  status: QuoteStatus;

  @ApiProperty({ example: '2024-01-14T10:35:00Z' })
  expiresAt: Date;

  @ApiProperty({ example: '2024-01-14T10:30:00Z' })
  createdAt: Date;

  static fromEntity(quote: Quote): QuoteResponseDto {
    const dto = new QuoteResponseDto();
    dto.id = quote.id;
    dto.userId = quote.userId;
    dto.fromCurrency = quote.fromCurrency;
    dto.toCurrency = quote.toCurrency;
    dto.sendAmount = quote.sendAmount;
    dto.exchangeRate = quote.exchangeRate;
    dto.feePercentage = quote.feePercentage;
    dto.feeAmount = quote.feeAmount;
    dto.receiveAmount = quote.receiveAmount;
    dto.totalAmount = quote.totalAmount;
    dto.status = quote.status;
    dto.expiresAt = quote.expiresAt;
    dto.createdAt = quote.createdAt;
    return dto;
  }
}
