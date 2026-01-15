import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from './entities/transaction.entity';
import { TransactionType, TransactionStatus, CurrencyType } from '../../common/enums';

export interface CreateTransactionDto {
  walletId: string;
  type: TransactionType;
  amount: string;
  currency: CurrencyType;
  balanceBefore: string;
  balanceAfter: string;
  status: TransactionStatus;
  description?: string;
  metadata?: Record<string, any>;
  referenceId?: string;
  idempotencyKey?: string;
}

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
  ) {}

  async createTransaction(
    createTransactionDto: CreateTransactionDto,
    manager?: any,
  ): Promise<Transaction> {
    const repository = manager
      ? manager.getRepository(Transaction)
      : this.transactionRepository;

    const transaction = repository.create({
      ...createTransactionDto,
      completedAt:
        createTransactionDto.status === TransactionStatus.COMPLETED
          ? new Date()
          : null,
    });

    return await repository.save(transaction);
  }

  async findByWallet(walletId: string, limit: number = 50): Promise<Transaction[]> {
    return await this.transactionRepository.find({
      where: { walletId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async findByUser(userId: string, limit: number = 50): Promise<Transaction[]> {
    return await this.transactionRepository
      .createQueryBuilder('transaction')
      .innerJoin('transaction.wallet', 'wallet')
      .where('wallet.userId = :userId', { userId })
      .orderBy('transaction.createdAt', 'DESC')
      .take(limit)
      .getMany();
  }

  async findOne(id: string): Promise<Transaction | null> {
    return await this.transactionRepository.findOne({
      where: { id },
    });
  }
}
