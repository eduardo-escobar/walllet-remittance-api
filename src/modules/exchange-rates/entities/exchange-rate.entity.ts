import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { CurrencyType } from '../../../common/enums';

@Entity('exchange_rates')
export class ExchangeRate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: CurrencyType,
    name: 'from_currency',
  })
  fromCurrency: CurrencyType;

  @Column({
    type: 'enum',
    enum: CurrencyType,
    name: 'to_currency',
  })
  toCurrency: CurrencyType;

  @Column({ type: 'decimal', precision: 20, scale: 10 })
  rate: string;

  @Column({ type: 'decimal', precision: 20, scale: 10, name: 'inverse_rate' })
  inverseRate: string;

  @Column({ type: 'varchar', length: 100, default: 'manual' })
  source: string;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ type: 'timestamp with time zone', name: 'valid_from' })
  validFrom: Date;

  @Column({ type: 'timestamp with time zone', nullable: true, name: 'valid_until' })
  validUntil: Date;

  @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at' })
  createdAt: Date;
}
