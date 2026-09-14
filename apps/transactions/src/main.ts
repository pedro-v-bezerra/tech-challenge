import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { type MicroserviceOptions, Transport } from '@nestjs/microservices';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
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
  // Silencia o aviso informativo do kafkajs sobre a troca do partitioner padrão (v2).
  process.env.KAFKAJS_NO_PARTITIONER_WARNING = '1';

  const clientId = process.env.KAFKA_CLIENT_ID ?? 'transactions';
  const brokers = (process.env.KAFKA_BROKERS ?? 'localhost:9092').split(',');

  await ensureTopics(clientId, brokers);

  const app = await NestFactory.create(AppModule);

  // Libera o dashboard (outra origem) a chamar a API e a consumir o SSE.
  app.enableCors({ origin: process.env.WEB_ORIGIN ?? true });

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Transactions API')
    .setDescription('Criação, consulta e listagem de transações financeiras.')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  // Consome transaction.status.updated para atualizar o status no banco.
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: { clientId, brokers },
      consumer: {
        groupId: process.env.KAFKA_GROUP_ID_TRANSACTIONS ?? 'transactions-consumer',
      },
    },
  });
  await app.startAllMicroservices();

  const configService = app.get(ConfigService);
  const port = configService.get<number>('TRANSACTIONS_PORT') ?? 3001;

  await app.listen(port);
}

void bootstrap();
