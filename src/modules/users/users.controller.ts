import { Controller, Get, Post, Body, Param, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { BaseResponseDto } from '../../common/dto/base-response.dto';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully', type: UserResponseDto })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async create(@Body() createUserDto: CreateUserDto): Promise<BaseResponseDto<UserResponseDto>> {
    const user = await this.usersService.create(createUserDto);
    return BaseResponseDto.success(
      UserResponseDto.fromEntity(user),
      'User created successfully',
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all active users' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully', type: [UserResponseDto] })
  async findAll(): Promise<BaseResponseDto<UserResponseDto[]>> {
    const users = await this.usersService.findAll();
    return BaseResponseDto.success(
      users.map((user) => UserResponseDto.fromEntity(user)),
      'Users retrieved successfully',
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully', type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('id') id: string): Promise<BaseResponseDto<UserResponseDto>> {
    const user = await this.usersService.findOne(id);
    return BaseResponseDto.success(
      UserResponseDto.fromEntity(user),
      'User retrieved successfully',
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate user' })
  @ApiResponse({ status: 200, description: 'User deactivated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async deactivate(@Param('id') id: string): Promise<BaseResponseDto<UserResponseDto>> {
    const user = await this.usersService.deactivate(id);
    return BaseResponseDto.success(
      UserResponseDto.fromEntity(user),
      'User deactivated successfully',
    );
  }
}
