import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CurrencyType, RemittanceStatus } from '../../../common/enums';
import { Remittance } from '../entities/remittance.entity';

export class RemittanceResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  quoteId: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  senderId: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  senderWalletId: string;

  @ApiProperty({ example: 'maria.garcia@example.com' })
  recipientEmail: string;

  @ApiProperty({ example: 'María García' })
  recipientName: string;

  @ApiPropertyOptional({ example: '+51987654321' })
  recipientPhone?: string;

  @ApiProperty({ enum: CurrencyType, example: CurrencyType.CLP })
  fromCurrency: CurrencyType;

  @ApiProperty({ enum: CurrencyType, example: CurrencyType.PEN })
  toCurrency: CurrencyType;

  @ApiProperty({ example: '100000.0000' })
  sendAmount: string;

  @ApiProperty({ example: '0.0045000000' })
  exchangeRate: string;

  @ApiProperty({ example: '2500.0000' })
  feeAmount: string;

  @ApiProperty({ example: '438.7500' })
  receiveAmount: string;

  @ApiProperty({ example: '102500.0000' })
  totalAmount: string;

  @ApiProperty({ enum: RemittanceStatus, example: RemittanceStatus.COMPLETED })
  status: RemittanceStatus;

  @ApiPropertyOptional({ example: 'EXT-123456' })
  externalProviderId?: string;

  @ApiPropertyOptional({ example: 'completed' })
  externalProviderStatus?: string;

  @ApiPropertyOptional()
  externalProviderResponse?: Record<string, any>;

  @ApiPropertyOptional({ example: 'Insufficient funds' })
  errorMessage?: string;

  @ApiProperty({ example: '2024-01-14T10:30:00Z' })
  createdAt: Date;

  @ApiPropertyOptional({ example: '2024-01-14T10:30:05Z' })
  processedAt?: Date;

  @ApiPropertyOptional({ example: '2024-01-14T10:30:10Z' })
  completedAt?: Date;

  static fromEntity(remittance: Remittance): RemittanceResponseDto {
    const dto = new RemittanceResponseDto();
    dto.id = remittance.id;
    dto.quoteId = remittance.quoteId;
    dto.senderId = remittance.senderId;
    dto.senderWalletId = remittance.senderWalletId;
    dto.recipientEmail = remittance.recipientEmail;
    dto.recipientName = remittance.recipientName;
    dto.recipientPhone = remittance.recipientPhone;
    dto.fromCurrency = remittance.fromCurrency;
    dto.toCurrency = remittance.toCurrency;
    dto.sendAmount = remittance.sendAmount;
    dto.exchangeRate = remittance.exchangeRate;
    dto.feeAmount = remittance.feeAmount;
    dto.receiveAmount = remittance.receiveAmount;
    dto.totalAmount = remittance.totalAmount;
    dto.status = remittance.status;
    dto.externalProviderId = remittance.externalProviderId;
    dto.externalProviderStatus = remittance.externalProviderStatus;
    dto.externalProviderResponse = remittance.externalProviderResponse;
    dto.errorMessage = remittance.errorMessage;
    dto.createdAt = remittance.createdAt;
    dto.processedAt = remittance.processedAt;
    dto.completedAt = remittance.completedAt;
    return dto;
  }
}
