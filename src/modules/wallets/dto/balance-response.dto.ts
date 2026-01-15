import { ApiProperty } from '@nestjs/swagger';
import { CurrencyType } from '../../../common/enums';
import { Wallet } from '../entities/wallet.entity';
import { Decimal } from 'decimal.js';

export class BalanceResponseDto {
  @ApiProperty({ enum: CurrencyType })
  currency: CurrencyType;

  @ApiProperty({ example: '1000.0000' })
  balance: string;

  @ApiProperty({ example: '50.0000' })
  heldBalance: string;

  @ApiProperty({ example: '950.0000' })
  availableBalance: string;

  static fromEntity(wallet: Wallet): BalanceResponseDto {
    const dto = new BalanceResponseDto();
    dto.currency = wallet.currency;
    dto.balance = wallet.balance;
    dto.heldBalance = wallet.heldBalance;
    dto.availableBalance = new Decimal(wallet.balance)
      .minus(wallet.heldBalance)
      .toFixed(4);
    return dto;
  }
}
