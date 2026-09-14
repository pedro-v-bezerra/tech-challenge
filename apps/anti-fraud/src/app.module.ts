import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AntiFraudModule } from './anti-fraud/anti-fraud.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true, envFilePath: ['../../.env'] }), AntiFraudModule],
})
export class AppModule {}
