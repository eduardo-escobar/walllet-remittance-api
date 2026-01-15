import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IdempotencyKey } from './entities/idempotency-key.entity';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([IdempotencyKey])],
  exports: [TypeOrmModule],
})
export class IdempotencyModule {}
