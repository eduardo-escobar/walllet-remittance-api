import { ApiProperty } from '@nestjs/swagger';
import { CurrencyType } from '../../../common/enums';
import { Wallet } from '../entities/wallet.entity';

export class WalletResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  userId: string;

  @ApiProperty({ enum: CurrencyType, example: CurrencyType.CLP })
  currency: CurrencyType;

  @ApiProperty({ example: '100000.5000' })
  balance: string;

  @ApiProperty({ example: '100000.5000' })
  availableBalance: string;

  @ApiProperty({ example: '0.0000' })
  heldBalance: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '2024-01-14T10:30:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-14T10:30:00Z' })
  updatedAt: Date;

  static fromEntity(wallet: Wallet): WalletResponseDto {
    const dto = new WalletResponseDto();
    dto.id = wallet.id;
    dto.userId = wallet.userId;
    dto.currency = wallet.currency;
    dto.balance = wallet.balance;
    dto.availableBalance = wallet.availableBalance;
    dto.heldBalance = wallet.heldBalance;
    dto.isActive = wallet.isActive;
    dto.createdAt = wallet.createdAt;
    dto.updatedAt = wallet.updatedAt;
    return dto;
  }
}
