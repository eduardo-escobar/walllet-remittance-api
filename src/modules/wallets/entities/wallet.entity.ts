import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Transaction } from '../../transactions/entities/transaction.entity';
import { Quote } from '../../quotes/entities/quote.entity';
import { CurrencyType } from '../../../common/enums/currency.enum';

@Entity('wallets')
export class Wallet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ type: 'enum', enum: CurrencyType })
  currency: CurrencyType;

  @Column({ type: 'decimal', precision: 20, scale: 4, default: '0.0000' })
  balance: string;

  @Column({ type: 'decimal', precision: 20, scale: 4, default: '0.0000', name: 'held_balance' })
  heldBalance: string;

  @Column({ type: 'decimal', precision: 20, scale: 4, default: '0.0000', name: 'available_balance' })
  availableBalance: string;

  @Column({ default: true, name: 'is_active' })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // ✅ RELACIONES
  @ManyToOne(() => User, (user) => user.wallets)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => Transaction, (transaction) => transaction.wallet)
  transactions: Transaction[];

  @OneToMany(() => Quote, (quote) => quote.sourceWallet)
  quotes: Quote[];
}