import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TransactionResponseDto } from './dto/transaction-response.dto';
import { BaseResponseDto } from '../../common/dto/base-response.dto';
import { TransactionsService } from './transactions.service';

@ApiTags('transactions')
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get transaction by ID' })
  @ApiResponse({ status: 200, type: TransactionResponseDto })
  async findOne(@Param('id') id: string): Promise<BaseResponseDto<TransactionResponseDto>> {
    const transaction = await this.transactionsService.findOne(id);
    return BaseResponseDto.success(
      TransactionResponseDto.fromEntity(transaction as any),
      'Transaction retrieved successfully',
    );
  }

  @Get('wallet/:walletId')
  @ApiOperation({ summary: 'Get transactions by wallet' })
  @ApiResponse({ status: 200, type: [TransactionResponseDto] })
  async findByWallet(
    @Param('walletId') walletId: string,
  ): Promise<BaseResponseDto<TransactionResponseDto[]>> {
    const transactions = await this.transactionsService.findByWallet(walletId);
    return BaseResponseDto.success(
      transactions.map(t => TransactionResponseDto.fromEntity(t)),
      'Transactions retrieved successfully',
    );
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get transactions by user' })
  @ApiResponse({ status: 200, type: [TransactionResponseDto] })
  async findByUser(
    @Param('userId') userId: string,
  ): Promise<BaseResponseDto<TransactionResponseDto[]>> {
    const transactions = await this.transactionsService.findByUser(userId);
    return BaseResponseDto.success(
      transactions.map(t => TransactionResponseDto.fromEntity(t)),
      'Transactions retrieved successfully',
    );
  }
}
