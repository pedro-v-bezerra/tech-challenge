import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { type EventEnvelope, Topics, type TransactionCreatedData } from '@biud/contracts';

import { AntiFraudService } from './anti-fraud.service';

@Controller()
export class AntiFraudController {
  constructor(private readonly antiFraudService: AntiFraudService) {}

  @EventPattern(Topics.TransactionCreated)
  async handleTransactionCreated(
    @Payload() event: EventEnvelope<TransactionCreatedData>,
  ): Promise<void> {
    await this.antiFraudService.evaluate(event);
  }
}
