import { Injectable, Logger } from '@nestjs/common';
import type { EventEnvelope } from '@biud/contracts';

import { EventPublisher } from './event-publisher';

/**
 * Implementação temporária: apenas registra o evento em log. A publicação real no Kafka
 * substitui este provider depois, sem tocar no serviço.
 */
@Injectable()
export class LoggingEventPublisher extends EventPublisher {
  private readonly logger = new Logger(LoggingEventPublisher.name);

  publish<TData>(topic: string, event: EventEnvelope<TData>): Promise<void> {
    this.logger.log(`evento "${topic}" publicado (stub): ${JSON.stringify(event)}`);
    return Promise.resolve();
  }
}
