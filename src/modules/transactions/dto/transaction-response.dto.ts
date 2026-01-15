import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CurrencyType, TransactionType, TransactionStatus } from '../../../common/enums';
import { Transaction } from '../entities/transaction.entity';

export class TransactionResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  walletId: string;

  @ApiProperty({ enum: TransactionType, example: TransactionType.DEPOSIT })
  type: TransactionType;

  @ApiProperty({ example: '100000.5000' })
  amount: string;

  @ApiProperty({ enum: CurrencyType, example: CurrencyType.CLP })
  currency: CurrencyType;

  @ApiProperty({ example: '50000.0000' })
  balanceBefore: string;

  @ApiProperty({ example: '150000.5000' })
  balanceAfter: string;

  @ApiProperty({ enum: TransactionStatus, example: TransactionStatus.COMPLETED })
  status: TransactionStatus;

  @ApiPropertyOptional({ example: 'Deposit from bank account' })
  description?: string;

  @ApiPropertyOptional()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000' })
  referenceId?: string;

  @ApiProperty({ example: '2024-01-14T10:30:00Z' })
  createdAt: Date;

  @ApiPropertyOptional({ example: '2024-01-14T10:30:05Z' })
  completedAt?: Date;

  static fromEntity(transaction: Transaction): TransactionResponseDto {
    const dto = new TransactionResponseDto();
    dto.id = transaction.id;
    dto.walletId = transaction.walletId;
    dto.type = transaction.type;
    dto.amount = transaction.amount;
    dto.currency = transaction.currency;
    dto.balanceBefore = transaction.balanceBefore;
    dto.balanceAfter = transaction.balanceAfter;
    dto.status = transaction.status;
    dto.description = transaction.description;
    dto.metadata = transaction.metadata;
    dto.referenceId = transaction.referenceId;
    dto.createdAt = transaction.createdAt;
    return dto;
  }
}
