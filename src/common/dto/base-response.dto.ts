import { ApiProperty } from '@nestjs/swagger';

export class BaseResponseDto<T = any> {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty()
  data?: T;

  @ApiProperty({ example: 'Operation completed successfully' })
  message?: string;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  timestamp: string;

  constructor(
    data?: T,
    message?: string,
    statusCode: number = 200,
    success: boolean = true,
  ) {
    this.success = success;
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.timestamp = new Date().toISOString();
  }

  static success<T>(data: T, message?: string, statusCode: number = 200) {
    return new BaseResponseDto<T>(data, message, statusCode, true);
  }

  static error(message: string, statusCode: number = 500) {
    return new BaseResponseDto(null, message, statusCode, false);
  }
}
