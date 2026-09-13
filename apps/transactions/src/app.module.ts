import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    // Configuração vem do ambiente; usamos o .env único na raiz do monorepo.
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env'],
    }),
    PrismaModule,
  ],
})
export class AppModule {}
