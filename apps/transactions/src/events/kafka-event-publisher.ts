import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import type { EventEnvelope } from '@biud/contracts';

import { EventPublisher } from './event-publisher';
import { KAFKA_PRODUCER } from './kafka.constants';

/** Publica eventos no Kafka via ClientKafka do @nestjs/microservices. */
@Injectable()
export class KafkaEventPublisher extends EventPublisher implements OnModuleInit {
  constructor(@Inject(KAFKA_PRODUCER) private readonly client: ClientKafka) {
    super();
  }

  async onModuleInit(): Promise<void> {
    await this.client.connect();
  }

  async publish<TData>(topic: string, event: EventEnvelope<TData>): Promise<void> {
    await lastValueFrom(this.client.emit(topic, event));
  }
}
