import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { defaultDatabaseUrl, getTypeOrmOptions } from './config/typeorm.options';
import { HealthModule } from './health/health.module';
import { LlmModule } from './llm/llm.module';
import { QueueModule } from './queue/queue.module';
import { SampleModule } from './sample/sample.module';
import { CandidateModule } from './candidates/candidate.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        getTypeOrmOptions(configService.get<string>('DATABASE_URL') ?? defaultDatabaseUrl),
    }),
    AuthModule,
    HealthModule,
    QueueModule,
    LlmModule,
    SampleModule,
    CandidateModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
