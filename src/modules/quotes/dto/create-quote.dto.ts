import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, Matches } from 'class-validator';
import { CurrencyType } from '../../../common/enums';

export class CreateQuoteDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ enum: CurrencyType, example: CurrencyType.CLP })
  @IsEnum(CurrencyType)
  @IsNotEmpty()
  fromCurrency: CurrencyType;

  @ApiProperty({ enum: CurrencyType, example: CurrencyType.PEN })
  @IsEnum(CurrencyType)
  @IsNotEmpty()
  toCurrency: CurrencyType;

  @ApiProperty({ example: '100000.00', description: 'Amount to send (decimal string)' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d+(\.\d{1,4})?$/, {
    message: 'Amount must be a valid decimal number with up to 4 decimal places',
  })
  sendAmount: string;
}
