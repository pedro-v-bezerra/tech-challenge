import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { type EventEnvelope, Topics, type TransactionStatusUpdatedData } from '@biud/contracts';

import { TransactionsService } from './transactions.service';

/** Consome o resultado do antifraude e atualiza o status da transação no banco. */
@Controller()
export class TransactionStatusController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @EventPattern(Topics.TransactionStatusUpdated)
  async handleStatusUpdated(
    @Payload() event: EventEnvelope<TransactionStatusUpdatedData>,
  ): Promise<void> {
    await this.transactionsService.applyStatusUpdate(
      event.data.transactionExternalId,
      event.data.status,
    );
  }
}
