import { randomUUID } from 'node:crypto';

import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import {
  type EventEnvelope,
  Topics,
  type TransactionCreatedData,
  type TransactionStatusUpdatedData,
} from '@biud/contracts';

import { evaluateFraud } from './fraud-rule';
import { KAFKA_PRODUCER } from './kafka.constants';

@Injectable()
export class AntiFraudService implements OnModuleInit {
  private readonly logger = new Logger(AntiFraudService.name);

  constructor(@Inject(KAFKA_PRODUCER) private readonly kafka: ClientKafka) {}

  async onModuleInit(): Promise<void> {
    await this.kafka.connect();
  }

  /** Avalia uma transação recém-criada e publica o resultado do status. */
  async evaluate(event: EventEnvelope<TransactionCreatedData>): Promise<void> {
    const status = evaluateFraud(event.data.value);

    const result: EventEnvelope<TransactionStatusUpdatedData> = {
      eventId: randomUUID(),
      occurredAt: new Date().toISOString(),
      data: { transactionExternalId: event.data.transactionExternalId, status },
    };

    await lastValueFrom(this.kafka.emit(Topics.TransactionStatusUpdated, result));
    this.logger.log(`transação ${event.data.transactionExternalId} avaliada como ${status}`);
  }
}
