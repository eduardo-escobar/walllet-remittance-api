import { Controller, Get, Post, Body, Param, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { QuotesService } from './quotes.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { QuoteResponseDto } from './dto/quote-response.dto';
import { BaseResponseDto } from '../../common/dto/base-response.dto';

@ApiTags('Quotes')
@Controller('quotes')
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new quote' })
  @ApiResponse({ status: 201, description: 'Quote created successfully', type: QuoteResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid quote parameters' })
  async create(@Body() createQuoteDto: CreateQuoteDto): Promise<BaseResponseDto<QuoteResponseDto>> {
    const quote = await this.quotesService.create(createQuoteDto);
    return BaseResponseDto.success(
      QuoteResponseDto.fromEntity(quote),
      'Quote created successfully',
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get quote by ID' })
  @ApiResponse({ status: 200, description: 'Quote retrieved successfully', type: QuoteResponseDto })
  @ApiResponse({ status: 404, description: 'Quote not found' })
  async findOne(@Param('id') id: string): Promise<BaseResponseDto<QuoteResponseDto>> {
    const quote = await this.quotesService.findOne(id);
    return BaseResponseDto.success(
      QuoteResponseDto.fromEntity(quote),
      'Quote retrieved successfully',
    );
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get quotes by user' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of quotes to retrieve' })
  @ApiResponse({ status: 200, description: 'Quotes retrieved successfully', type: [QuoteResponseDto] })
  async findByUser(
    @Param('userId') userId: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ): Promise<BaseResponseDto<QuoteResponseDto[]>> {
    const quotes = await this.quotesService.findByUser(userId, limit || 20);
    return BaseResponseDto.success(
      quotes.map((quote) => QuoteResponseDto.fromEntity(quote)),
      'Quotes retrieved successfully',
    );
  }

  @Get('user/:userId/active')
  @ApiOperation({ summary: 'Get active quotes by user' })
  @ApiResponse({ status: 200, description: 'Active quotes retrieved successfully', type: [QuoteResponseDto] })
  async findActiveByUser(@Param('userId') userId: string): Promise<BaseResponseDto<QuoteResponseDto[]>> {
    const quotes = await this.quotesService.findActiveByUser(userId);
    return BaseResponseDto.success(
      quotes.map((quote) => QuoteResponseDto.fromEntity(quote)),
      'Active quotes retrieved successfully',
    );
  }
}
