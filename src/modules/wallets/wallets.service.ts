import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import Decimal from 'decimal.js';
import { Wallet } from './entities/wallet.entity';
import { CurrencyType } from '../../common/enums';
import { DepositDto } from './dto/deposit.dto';
import { TransactionsService } from '../transactions/transactions.service';
import { TransactionType, TransactionStatus } from '../../common/enums';

@Injectable()
export class WalletsService {
  constructor(
    @InjectRepository(Wallet)
    private readonly walletRepository: Repository<Wallet>,
    private readonly transactionsService: TransactionsService,
    private readonly dataSource: DataSource,
  ) {}

  async findOrCreateWallet(userId: string, currency: CurrencyType): Promise<Wallet> {
    let wallet = await this.walletRepository.findOne({
      where: { userId, currency, isActive: true },
    });

    if (!wallet) {
      wallet = this.walletRepository.create({
        userId,
        currency,
        balance: '0',
        availableBalance: '0',
        heldBalance: '0',
      });
      wallet = await this.walletRepository.save(wallet);
    }

    return wallet;
  }

  async findByUserAndCurrency(userId: string, currency: CurrencyType): Promise<Wallet> {
    const wallet = await this.walletRepository.findOne({
      where: { userId, currency, isActive: true },
    });

    if (!wallet) {
      throw new NotFoundException(
        `Wallet not found for user ${userId} and currency ${currency}`,
      );
    }

    return wallet;
  }

  async findAllByUser(userId: string): Promise<Wallet[]> {
    return await this.walletRepository.find({
      where: { userId, isActive: true },
      order: { currency: 'ASC' },
    });
  }

  async deposit(depositDto: DepositDto, idempotencyKey: string): Promise<Wallet> {
    const { userId, currency, amount } = depositDto;

    // Validar monto
    const depositAmount = new Decimal(amount);
    if (depositAmount.lte(0)) {
      throw new BadRequestException('Deposit amount must be greater than zero');
    }

    // Usar transacción con pessimistic locking
    return await this.dataSource.transaction(async (manager) => {
      // Buscar o crear wallet con lock
      let wallet = await manager.findOne(Wallet, {
        where: { userId, currency, isActive: true },
        lock: { mode: 'pessimistic_write' },
      });

      if (!wallet) {
        wallet = manager.create(Wallet, {
          userId,
          currency,
          balance: '0',
          availableBalance: '0',
          heldBalance: '0',
        });
        wallet = await manager.save(wallet);
      }

      // Calcular nuevos balances
      const currentBalance = new Decimal(wallet.balance);
      const newBalance = currentBalance.plus(depositAmount);

      const balanceBefore = wallet.balance;
      wallet.balance = newBalance.toFixed(4);
      wallet.availableBalance = newBalance.toFixed(4);

      // Guardar wallet
      wallet = await manager.save(Wallet, wallet);

      // Crear transacción
      await this.transactionsService.createTransaction(
        {
          walletId: wallet.id,
          type: TransactionType.DEPOSIT,
          amount: depositAmount.toFixed(4),
          currency,
          balanceBefore,
          balanceAfter: wallet.balance,
          status: TransactionStatus.COMPLETED,
          description: 'Deposit',
          idempotencyKey,
        },
        manager,
      );

      return wallet;
    });
  }

  async holdBalance(
    walletId: string,
    amount: string,
    manager: any,
  ): Promise<void> {
    const wallet = await manager.findOne(Wallet, {
      where: { id: walletId },
      lock: { mode: 'pessimistic_write' },
    });

    if (!wallet) {
      throw new NotFoundException(`Wallet ${walletId} not found`);
    }

    const holdAmount = new Decimal(amount);
    const availableBalance = new Decimal(wallet.availableBalance);

    if (availableBalance.lt(holdAmount)) {
      throw new BadRequestException('Insufficient available balance');
    }

    const newAvailableBalance = availableBalance.minus(holdAmount);
    const newHeldBalance = new Decimal(wallet.heldBalance).plus(holdAmount);

    wallet.availableBalance = newAvailableBalance.toFixed(4);
    wallet.heldBalance = newHeldBalance.toFixed(4);

    await manager.save(Wallet, wallet);
  }

  async releaseBalance(
    walletId: string,
    amount: string,
    manager: any,
  ): Promise<void> {
    const wallet = await manager.findOne(Wallet, {
      where: { id: walletId },
      lock: { mode: 'pessimistic_write' },
    });

    if (!wallet) {
      throw new NotFoundException(`Wallet ${walletId} not found`);
    }

    const releaseAmount = new Decimal(amount);
    const heldBalance = new Decimal(wallet.heldBalance);

    if (heldBalance.lt(releaseAmount)) {
      throw new BadRequestException('Insufficient held balance');
    }

    const newHeldBalance = heldBalance.minus(releaseAmount);
    const newAvailableBalance = new Decimal(wallet.availableBalance).plus(releaseAmount);

    wallet.heldBalance = newHeldBalance.toFixed(4);
    wallet.availableBalance = newAvailableBalance.toFixed(4);

    await manager.save(Wallet, wallet);
  }

  async deductBalance(
    walletId: string,
    amount: string,
    manager: any,
  ): Promise<void> {
    const wallet = await manager.findOne(Wallet, {
      where: { id: walletId },
      lock: { mode: 'pessimistic_write' },
    });

    if (!wallet) {
      throw new NotFoundException(`Wallet ${walletId} not found`);
    }

    const deductAmount = new Decimal(amount);
    const heldBalance = new Decimal(wallet.heldBalance);
    const totalBalance = new Decimal(wallet.balance);

    if (heldBalance.lt(deductAmount)) {
      throw new BadRequestException('Insufficient held balance');
    }

    const newHeldBalance = heldBalance.minus(deductAmount);
    const newTotalBalance = totalBalance.minus(deductAmount);

    wallet.heldBalance = newHeldBalance.toFixed(4);
    wallet.balance = newTotalBalance.toFixed(4);

    await manager.save(Wallet, wallet);
  }
}
