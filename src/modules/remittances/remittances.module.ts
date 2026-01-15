import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RemittancesController } from './remittances.controller';
import { RemittancesService } from './remittances.service';
import { ExternalProviderService } from './external-provider.service';
import { Remittance } from './entities/remittance.entity';
import { QuotesModule } from '../quotes/quotes.module';
import { WalletsModule } from '../wallets/wallets.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Remittance]),
    QuotesModule,
    WalletsModule,
    TransactionsModule,
    UsersModule,
  ],
  controllers: [RemittancesController],
  providers: [RemittancesService, ExternalProviderService],
  exports: [RemittancesService],
})
export class RemittancesModule {}
