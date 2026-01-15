import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from '../modules/users/entities/user.entity';
import { Wallet } from '../modules/wallets/entities/wallet.entity';
import { Transaction } from '../modules/transactions/entities/transaction.entity';
import { Quote } from '../modules/quotes/entities/quote.entity';
import { Remittance } from '../modules/remittances/entities/remittance.entity';
import { ExchangeRate } from '../modules/exchange-rates/entities/exchange-rate.entity';
import { IdempotencyKey } from '../modules/idempotency/entities/idempotency-key.entity';

export const databaseConfig = (): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: Number.parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USER || 'wallet_user',
  password: process.env.DATABASE_PASSWORD || 'wallet_pass_2024',
  database: process.env.DATABASE_NAME || 'wallet_db',
  entities: [
    User,
    Wallet,
    Transaction,
    Quote,
    Remittance,
    ExchangeRate,
    IdempotencyKey,
  ],
  synchronize: false,
  logging: process.env.DATABASE_LOGGING === 'true',
  extra: {
    max: 20,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
  },
  poolSize: 10,
});