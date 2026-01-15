import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Wallet } from '../../wallets/entities/wallet.entity';
import { Quote } from '../../quotes/entities/quote.entity';
import { RemittanceStatus } from '../../../common/enums/remittance-status.enum';
import { CurrencyType } from '../../../common/enums/currency.enum';

@Entity('remittances')
export class Remittance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'quote_id' })
  quoteId: string;

  @Column({ name: 'sender_id' })
  senderId: string;

  @Column({ name: 'sender_wallet_id' })
  senderWalletId: string;

  @Column({ name: 'recipient_email' })
  recipientEmail: string;

  @Column({ name: 'recipient_name' })
  recipientName: string;

  @Column({ name: 'recipient_phone', nullable: true })
  recipientPhone: string;

  @Column({ type: 'enum', enum: CurrencyType, name: 'from_currency' })
  fromCurrency: CurrencyType;

  @Column({ type: 'enum', enum: CurrencyType, name: 'to_currency' })
  toCurrency: CurrencyType;

  @Column({ type: 'decimal', precision: 20, scale: 4, name: 'send_amount' })
  sendAmount: string;

  @Column({ type: 'decimal', precision: 10, scale: 6, name: 'exchange_rate' })
  exchangeRate: string;

  @Column({ type: 'decimal', precision: 20, scale: 4, name: 'fee_amount' })
  feeAmount: string;

  @Column({ type: 'decimal', precision: 20, scale: 4, name: 'receive_amount' })
  receiveAmount: string;

  @Column({ type: 'decimal', precision: 20, scale: 4, name: 'total_amount' })
  totalAmount: string;

  @Column({ type: 'enum', enum: RemittanceStatus, default: RemittanceStatus.PENDING })
  status: RemittanceStatus;

  @Column({ nullable: true, name: 'external_provider_id' })
  externalProviderId: string;

  @Column({ nullable: true, name: 'external_provider_status' })
  externalProviderStatus: string;

  @Column({ type: 'jsonb', nullable: true, name: 'external_provider_response' })
  externalProviderResponse: any;

  @Column({ nullable: true, name: 'error_message' })
  errorMessage: string;

  @Column({ nullable: true, name: 'idempotency_key' })
  idempotencyKey: string;

  @Column({ nullable: true, name: 'processed_at' })
  processedAt: Date;

  @Column({ nullable: true, name: 'completed_at' })
  completedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // ✅ RELACIONES
  @ManyToOne(() => Quote, (quote) => quote.remittances)
  @JoinColumn({ name: 'quote_id' })
  quote: Quote;

  @ManyToOne(() => User, (user) => user.remittances)
  @JoinColumn({ name: 'sender_id' })
  sender: User;

  @ManyToOne(() => Wallet)
  @JoinColumn({ name: 'sender_wallet_id' })
  senderWallet: Wallet;
}