import { NestFactory } from '@nestjs/core';
import { type MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Kafka } from 'kafkajs';
import { Topics } from '@biud/contracts';

import { AppModule } from './app.module';

/** Cria os tópicos usados no fluxo, se ainda não existirem (evita corrida na primeira subida). */
async function ensureTopics(clientId: string, brokers: string[]): Promise<void> {
  const admin = new Kafka({ clientId, brokers }).admin();
  await admin.connect();
  await admin.createTopics({
    waitForLeaders: true,
    topics: [Topics.TransactionCreated, Topics.TransactionStatusUpdated].map((topic) => ({
      topic,
      numPartitions: 1,
    })),
  });
  await admin.disconnect();
}

async function bootstrap(): Promise<void> {
  const clientId = process.env.KAFKA_CLIENT_ID ?? 'anti-fraud';
  const brokers = (process.env.KAFKA_BROKERS ?? 'localhost:9092').split(',');

  await ensureTopics(clientId, brokers);

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.KAFKA,
    options: {
      client: { clientId, brokers },
      consumer: {
        groupId: process.env.KAFKA_GROUP_ID_ANTI_FRAUD ?? 'anti-fraud-consumer',
      },
    },
  });

  await app.listen();
}

void bootstrap();
