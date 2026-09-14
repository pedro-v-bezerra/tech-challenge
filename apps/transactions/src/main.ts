import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  // Silencia o aviso informativo do kafkajs sobre a troca do partitioner padrão (v2).
  process.env.KAFKAJS_NO_PARTITIONER_WARNING = '1';

  const app = await NestFactory.create(AppModule);

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

  const configService = app.get(ConfigService);
  const port = configService.get<number>('TRANSACTIONS_PORT') ?? 3001;

  await app.listen(port);
}

void bootstrap();
