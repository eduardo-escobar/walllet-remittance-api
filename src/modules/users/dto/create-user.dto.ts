import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, IsOptional, MaxLength, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'juan.perez@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'Juan', minLength: 2, maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ example: 'Pérez', minLength: 2, maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  lastName: string;

  @ApiPropertyOptional({ example: '+56912345678' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ example: 'CL', default: 'CL' })
  @IsString()
  @IsOptional()
  @MaxLength(3)
  countryCode?: string;

  @ApiPropertyOptional({ example: 'RUT' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  documentType?: string;

  @ApiPropertyOptional({ example: '12345678-9' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  documentNumber?: string;
}
