import { Module } from '@nestjs/common';

import { EventPublisher } from './event-publisher';
import { LoggingEventPublisher } from './logging-event-publisher';

/** Disponibiliza o EventPublisher. A implementação de Kafka substitui este provider depois. */
@Module({
  providers: [{ provide: EventPublisher, useClass: LoggingEventPublisher }],
  exports: [EventPublisher],
})
export class EventsModule {}
