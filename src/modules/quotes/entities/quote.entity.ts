import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Wallet } from '../../wallets/entities/wallet.entity';
import { Remittance } from '../../remittances/entities/remittance.entity';
import { QuoteStatus } from '../../../common/enums/quote-status.enum';
import { CurrencyType } from '../../../common/enums/currency.enum';

@Entity('quotes')
export class Quote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'source_wallet_id' })
  sourceWalletId: string;

  @Column({ type: 'enum', enum: CurrencyType, name: 'from_currency' })
  fromCurrency: CurrencyType;

  @Column({ type: 'enum', enum: CurrencyType, name: 'to_currency' })
  toCurrency: CurrencyType;

  @Column({ type: 'decimal', precision: 20, scale: 4, name: 'send_amount' })
  sendAmount: string;

  @Column({ type: 'decimal', precision: 10, scale: 6, name: 'exchange_rate' })
  exchangeRate: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'fee_percentage' })
  feePercentage: string;

  @Column({ type: 'decimal', precision: 20, scale: 4, name: 'fee_amount' })
  feeAmount: string;

  @Column({ type: 'decimal', precision: 20, scale: 4, name: 'receive_amount' })
  receiveAmount: string;

  @Column({ type: 'decimal', precision: 20, scale: 4, name: 'total_amount' })
  totalAmount: string;

  @Column({ type: 'enum', enum: QuoteStatus, default: QuoteStatus.ACTIVE })
  status: QuoteStatus;

  @Column({ name: 'expires_at' })
  expiresAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // ✅ RELACIONES
  @ManyToOne(() => User, (user) => user.quotes)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Wallet, (wallet) => wallet.quotes)
  @JoinColumn({ name: 'source_wallet_id' })
  sourceWallet: Wallet;

  @OneToMany(() => Remittance, (remittance) => remittance.quote)
  remittances: Remittance[];
}