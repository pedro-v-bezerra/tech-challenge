import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';

import { EventPublisher } from './event-publisher';
import { KAFKA_PRODUCER } from './kafka.constants';
import { KafkaEventPublisher } from './kafka-event-publisher';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: KAFKA_PRODUCER,
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: config.get<string>('KAFKA_CLIENT_ID', 'transactions'),
              brokers: (config.get<string>('KAFKA_BROKERS') ?? 'localhost:9092').split(','),
            },
            // groupId próprio do produtor: evita colidir com o ClientKafka do outro serviço no
            // grupo padrão do Nest (nestjs-group-client), que causa rebalance ruidoso no startup.
            consumer: {
              groupId: config.get<string>('KAFKA_GROUP_ID_TRANSACTIONS', 'transactions-consumer'),
            },
          },
        }),
      },
    ]),
  ],
  providers: [{ provide: EventPublisher, useClass: KafkaEventPublisher }],
  exports: [EventPublisher],
})
export class EventsModule {}
