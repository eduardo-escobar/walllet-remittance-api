import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ExchangeRatesService } from './exchange-rates.service';
import { ExchangeRateResponseDto } from './dto/exchange-rate-response.dto';
import { BaseResponseDto } from '../../common/dto/base-response.dto';
import { CurrencyType } from '../../common/enums';

@ApiTags('Exchange Rates')
@Controller('exchange-rates')
export class ExchangeRatesController {
  constructor(private readonly exchangeRatesService: ExchangeRatesService) {}

  @Get('active')
  @ApiOperation({ summary: 'Get all active exchange rates' })
  @ApiResponse({ status: 200, description: 'Active rates retrieved successfully', type: [ExchangeRateResponseDto] })
  async getActiveRates(): Promise<BaseResponseDto<ExchangeRateResponseDto[]>> {
    const rates = await this.exchangeRatesService.getAllActiveRates();
    return BaseResponseDto.success(
      rates.map((rate) => ExchangeRateResponseDto.fromEntity(rate)),
      'Active exchange rates retrieved successfully',
    );
  }

  @Get('rate')
  @ApiOperation({ summary: 'Get active rate for currency pair' })
  @ApiQuery({ name: 'from', enum: CurrencyType, required: true })
  @ApiQuery({ name: 'to', enum: CurrencyType, required: true })
  @ApiResponse({ status: 200, description: 'Rate retrieved successfully', type: ExchangeRateResponseDto })
  @ApiResponse({ status: 404, description: 'No active rate found' })
  async getRate(
    @Query('from') fromCurrency: CurrencyType,
    @Query('to') toCurrency: CurrencyType,
  ): Promise<BaseResponseDto<ExchangeRateResponseDto>> {
    const rate = await this.exchangeRatesService.getActiveRate(fromCurrency, toCurrency);
    return BaseResponseDto.success(
      ExchangeRateResponseDto.fromEntity(rate),
      'Exchange rate retrieved successfully',
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all exchange rates (including inactive)' })
  @ApiResponse({ status: 200, description: 'All rates retrieved successfully', type: [ExchangeRateResponseDto] })
  async findAll(): Promise<BaseResponseDto<ExchangeRateResponseDto[]>> {
    const rates = await this.exchangeRatesService.findAll();
    return BaseResponseDto.success(
      rates.map((rate) => ExchangeRateResponseDto.fromEntity(rate)),
      'All exchange rates retrieved successfully',
    );
  }
}
