import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import Decimal from 'decimal.js';
import { Remittance } from './entities/remittance.entity';
import { SendRemittanceDto } from './dto/send-remittance.dto';
import { QuotesService } from '../quotes/quotes.service';
import { WalletsService } from '../wallets/wallets.service';
import { TransactionsService } from '../transactions/transactions.service';
import { UsersService } from '../users/users.service';
import { ExternalProviderService } from './external-provider.service';
import { RemittanceStatus, TransactionType, TransactionStatus } from '../../common/enums';
import { Wallet } from '../wallets/entities/wallet.entity';

@Injectable()
export class RemittancesService {
  constructor(
    @InjectRepository(Remittance)
    private readonly remittanceRepository: Repository<Remittance>,
    private readonly quotesService: QuotesService,
    private readonly walletsService: WalletsService,
    private readonly transactionsService: TransactionsService,
    private readonly usersService: UsersService,
    private readonly externalProviderService: ExternalProviderService,
    private readonly dataSource: DataSource,
  ) { }

  async send(
    sendRemittanceDto: SendRemittanceDto,
    idempotencyKey: string,
  ): Promise<Remittance> {
    const { quoteId, recipientEmail, recipientName, recipientPhone } = sendRemittanceDto;

    // Validar y obtener cotización activa
    const quote = await this.quotesService.findActiveQuote(quoteId);

    // Obtener información del usuario
    const sender = await this.usersService.findOne(quote.userId);

    // Obtener wallet del sender
    const senderWallet = await this.walletsService.findByUserAndCurrency(
      quote.userId,
      quote.fromCurrency,
    );

    // Validar balance disponible
    const totalAmount = new Decimal(quote.totalAmount);
    const availableBalance = new Decimal(senderWallet.availableBalance);

    if (availableBalance.lt(totalAmount)) {
      throw new BadRequestException(
        `Insufficient balance. Required: ${totalAmount.toFixed(4)}, Available: ${availableBalance.toFixed(4)}`,
      );
    }

    // Ejecutar remesa en transacción
    return await this.dataSource.transaction(async (manager) => {
      // 1. Crear registro de remesa
      let remittance = manager.create(Remittance, {
        quoteId: quote.id,
        senderId: sender.id,
        senderWalletId: senderWallet.id,
        recipientEmail,
        recipientName,
        recipientPhone,
        fromCurrency: quote.fromCurrency,
        toCurrency: quote.toCurrency,
        sendAmount: quote.sendAmount,
        exchangeRate: quote.exchangeRate,
        feeAmount: quote.feeAmount,
        receiveAmount: quote.receiveAmount,
        totalAmount: quote.totalAmount,
        status: RemittanceStatus.PENDING,
        idempotencyKey,
      });

      remittance = await manager.save(Remittance, remittance);

      // 2. Retener balance (hold)
      await this.walletsService.holdBalance(
        senderWallet.id,
        quote.totalAmount,
        manager,
      );

      // 3. Marcar cotización como usada
      await this.quotesService.markAsUsed(quote.id, manager);

      // 4. Actualizar estado a PROCESSING
      remittance.status = RemittanceStatus.PROCESSING;
      remittance.processedAt = new Date();
      remittance = await manager.save(Remittance, remittance);

      // 5. Enviar a proveedor externo
      try {
        const providerResponse = await this.externalProviderService.sendRemittance({
          recipientEmail,
          recipientName,
          recipientPhone,
          amount: quote.receiveAmount,
          currency: quote.toCurrency,
          senderName: `${sender.firstName} ${sender.lastName}`,
          senderEmail: sender.email,
        });

        if (providerResponse.success) {
          // 6a. Éxito: Deducir balance y completar
          await this.walletsService.deductBalance(
            senderWallet.id,
            quote.totalAmount,
            manager,
          );

          // Crear transacciones
          const walletAfterDeduction = await manager.findOne(Wallet, {
            where: { id: senderWallet.id },
          });

          // ✅ VERIFICAR QUE NO SEA NULL
          if (!walletAfterDeduction) {
            throw new Error('Failed to retrieve wallet after deduction');
          }

          // Calcular balance antes de la deducción
          const balanceBefore = new Decimal(walletAfterDeduction.balance)
            .plus(quote.totalAmount)
            .toFixed(4);

          // Transacción de envío
          await this.transactionsService.createTransaction(
            {
              walletId: senderWallet.id,
              type: TransactionType.REMITTANCE_SEND,
              amount: quote.sendAmount,
              currency: quote.fromCurrency,
              balanceBefore: balanceBefore,
              balanceAfter: walletAfterDeduction.balance,
              status: TransactionStatus.COMPLETED,
              description: `Remittance to ${recipientName}`,
              metadata: {
                remittanceId: remittance.id,
                recipientEmail,
                receiveAmount: quote.receiveAmount,
                receiveCurrency: quote.toCurrency,
              },
              referenceId: remittance.id,
              idempotencyKey: `${idempotencyKey}-send`,
            },
            manager,
          );

          // Transacción de fee
          await this.transactionsService.createTransaction(
            {
              walletId: senderWallet.id,
              type: TransactionType.FEE,
              amount: quote.feeAmount,
              currency: quote.fromCurrency,
              balanceBefore: walletAfterDeduction.balance,
              balanceAfter: walletAfterDeduction.balance,
              status: TransactionStatus.COMPLETED,
              description: 'Remittance fee',
              metadata: {
                remittanceId: remittance.id,
                feePercentage: quote.feePercentage,
              },
              referenceId: remittance.id,
              idempotencyKey: `${idempotencyKey}-fee`,
            },
            manager,
          );

          // Actualizar remesa
          remittance.status = RemittanceStatus.COMPLETED;
          remittance.completedAt = new Date();
          remittance.externalProviderId = providerResponse.externalId;
          remittance.externalProviderStatus = providerResponse.status;
          remittance.externalProviderResponse = providerResponse as any;
        } else {
          // 6b. Fallo: Liberar balance y marcar como fallida
          await this.walletsService.releaseBalance(
            senderWallet.id,
            quote.totalAmount,
            manager,
          );

          remittance.status = RemittanceStatus.FAILED;
          remittance.errorMessage = providerResponse.message;
          remittance.externalProviderStatus = providerResponse.status;
          remittance.externalProviderResponse = providerResponse as any;
        }
      } catch (error) {
        // 6c. Error: Liberar balance y marcar como fallida
        await this.walletsService.releaseBalance(
          senderWallet.id,
          quote.totalAmount,
          manager,
        );

        remittance.status = RemittanceStatus.FAILED;
        remittance.errorMessage = error.message || 'Unknown error';
      }

      return await manager.save(Remittance, remittance);
    });
  }

  async findOne(id: string): Promise<Remittance> {
    const remittance = await this.remittanceRepository.findOne({
      where: { id },
    });

    if (!remittance) {
      throw new NotFoundException(`Remittance with ID ${id} not found`);
    }

    return remittance;
  }

  async findByUser(userId: string, limit: number = 20): Promise<Remittance[]> {
    return await this.remittanceRepository.find({
      where: { senderId: userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async findAll(limit: number = 50): Promise<Remittance[]> {
    return await this.remittanceRepository.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}

