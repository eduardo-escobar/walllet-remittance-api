import { Controller, Get, Post, Body, Param, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiHeader } from '@nestjs/swagger';
import { RemittancesService } from './remittances.service';
import { SendRemittanceDto } from './dto/send-remittance.dto';
import { RemittanceResponseDto } from './dto/remittance-response.dto';
import { BaseResponseDto } from '../../common/dto/base-response.dto';
import { IdempotencyKey } from '../../common/decorators/idempotency-key.decorator';

@ApiTags('Remittances')
@Controller('remittances')
export class RemittancesController {
  constructor(private readonly remittancesService: RemittancesService) {}

  @Post('send')
  @ApiOperation({ summary: 'Send a remittance' })
  @ApiHeader({ name: 'X-Idempotency-Key', required: true, description: 'Unique idempotency key' })
  @ApiResponse({ status: 201, description: 'Remittance sent successfully', type: RemittanceResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid remittance parameters or insufficient balance' })
  @ApiResponse({ status: 404, description: 'Quote not found or expired' })
  async send(
    @Body() sendRemittanceDto: SendRemittanceDto,
    @IdempotencyKey() idempotencyKey: string,
  ): Promise<BaseResponseDto<RemittanceResponseDto>> {
    const remittance = await this.remittancesService.send(sendRemittanceDto, idempotencyKey);
    return BaseResponseDto.success(
      RemittanceResponseDto.fromEntity(remittance),
      'Remittance processed successfully',
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get remittance by ID' })
  @ApiResponse({ status: 200, description: 'Remittance retrieved successfully', type: RemittanceResponseDto })
  @ApiResponse({ status: 404, description: 'Remittance not found' })
  async findOne(@Param('id') id: string): Promise<BaseResponseDto<RemittanceResponseDto>> {
    const remittance = await this.remittancesService.findOne(id);
    return BaseResponseDto.success(
      RemittanceResponseDto.fromEntity(remittance),
      'Remittance retrieved successfully',
    );
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get remittances by user' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of remittances to retrieve' })
  @ApiResponse({ status: 200, description: 'Remittances retrieved successfully', type: [RemittanceResponseDto] })
  async findByUser(
    @Param('userId') userId: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ): Promise<BaseResponseDto<RemittanceResponseDto[]>> {
    const remittances = await this.remittancesService.findByUser(userId, limit || 20);
    return BaseResponseDto.success(
      remittances.map((remittance) => RemittanceResponseDto.fromEntity(remittance)),
      'Remittances retrieved successfully',
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all remittances (admin)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of remittances to retrieve' })
  @ApiResponse({ status: 200, description: 'All remittances retrieved successfully', type: [RemittanceResponseDto] })
  async findAll(
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ): Promise<BaseResponseDto<RemittanceResponseDto[]>> {
    const remittances = await this.remittancesService.findAll(limit || 50);
    return BaseResponseDto.success(
      remittances.map((remittance) => RemittanceResponseDto.fromEntity(remittance)),
      'All remittances retrieved successfully',
    );
  }
}
