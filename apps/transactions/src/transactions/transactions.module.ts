import { Module } from '@nestjs/common';

import { EventsModule } from '../events/events.module';
import { TransactionStatusController } from './transaction-status.controller';
import { TransactionStreamService } from './transaction-stream.service';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';

@Module({
  imports: [EventsModule],
  controllers: [TransactionsController, TransactionStatusController],
  providers: [TransactionsService, TransactionStreamService],
})
export class TransactionsModule {}
