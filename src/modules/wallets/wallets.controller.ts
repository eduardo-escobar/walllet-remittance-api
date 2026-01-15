import { Controller, Get, Post, Body, Param, Query, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { WalletsService } from './wallets.service';
import { DepositDto } from './dto/deposit.dto';
import { WalletResponseDto } from './dto/wallet-response.dto';
import { BalanceResponseDto } from './dto/balance-response.dto';
import { BaseResponseDto } from '../../common/dto/base-response.dto';
import { CurrencyType } from '../../common/enums';
import { IdempotencyKey } from '../../common/decorators/idempotency-key.decorator';

@ApiTags('Wallets')
@Controller('wallets')
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Post('deposit')
  @ApiOperation({ summary: 'Deposit funds to wallet' })
  @ApiHeader({ name: 'X-Idempotency-Key', required: true, description: 'Unique idempotency key' })
  @ApiResponse({ status: 200, description: 'Deposit successful', type: WalletResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid deposit amount' })
  async deposit(
    @Body() depositDto: DepositDto,
    @IdempotencyKey() idempotencyKey: string,
  ): Promise<BaseResponseDto<WalletResponseDto>> {
    const wallet = await this.walletsService.deposit(depositDto, idempotencyKey);
    return BaseResponseDto.success(
      WalletResponseDto.fromEntity(wallet),
      'Deposit successful',
    );
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get all wallets for a user' })
  @ApiResponse({ status: 200, description: 'Wallets retrieved successfully', type: [WalletResponseDto] })
  async findByUser(@Param('userId') userId: string): Promise<BaseResponseDto<WalletResponseDto[]>> {
    const wallets = await this.walletsService.findAllByUser(userId);
    return BaseResponseDto.success(
      wallets.map((wallet) => WalletResponseDto.fromEntity(wallet)),
      'Wallets retrieved successfully',
    );
  }

  @Get('user/:userId/balance')
  @ApiOperation({ summary: 'Get balance for user by currency' })
  @ApiResponse({ status: 200, description: 'Balance retrieved successfully', type: BalanceResponseDto })
  @ApiResponse({ status: 404, description: 'Wallet not found' })
  async getBalance(
    @Param('userId') userId: string,
    @Query('currency') currency: CurrencyType,
  ): Promise<BaseResponseDto<BalanceResponseDto>> {
    const wallet = await this.walletsService.findByUserAndCurrency(userId, currency);
    return BaseResponseDto.success(
      BalanceResponseDto.fromEntity(wallet),
      'Balance retrieved successfully',
    );
  }
}
