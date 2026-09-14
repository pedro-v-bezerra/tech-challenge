import { Module } from '@nestjs/common';

import { EventsModule } from '../events/events.module';
import { TransactionStatusController } from './transaction-status.controller';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';

@Module({
  imports: [EventsModule],
  controllers: [TransactionsController, TransactionStatusController],
  providers: [TransactionsService],
})
export class TransactionsModule {}
