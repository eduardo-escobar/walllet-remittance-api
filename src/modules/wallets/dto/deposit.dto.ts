import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, Matches } from 'class-validator';
import { CurrencyType } from '../../../common/enums';

export class DepositDto {
  @ApiProperty({ example: '100000.50', description: 'Amount to deposit (decimal string)' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d+(\.\d{1,4})?$/, {
    message: 'Amount must be a valid decimal number with up to 4 decimal places',
  })
  amount: string;

  @ApiProperty({ enum: CurrencyType, example: CurrencyType.CLP })
  @IsEnum(CurrencyType)
  @IsNotEmpty()
  currency: CurrencyType;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsString()
  @IsNotEmpty()
  userId: string;
}
