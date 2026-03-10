import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { FakeSummarizationProvider } from './fake-summarization.provider';
import { GeminiSummarizationProvider } from './gemini-summarization.provider';
import { SUMMARIZATION_PROVIDER } from './summarization-provider.interface';

@Module({
  imports: [ConfigModule],
  providers: [
    FakeSummarizationProvider,
    {
      provide: GeminiSummarizationProvider,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const apiKey = configService.get<string>('GEMINI_API_KEY');
        if (apiKey) {
          return new GeminiSummarizationProvider(configService);
        }
        return null;
      },
    },
    {
      provide: SUMMARIZATION_PROVIDER,
      inject: [ConfigService, FakeSummarizationProvider, GeminiSummarizationProvider],
      useFactory: (
        configService: ConfigService,
        fake: FakeSummarizationProvider,
        gemini: GeminiSummarizationProvider | null,
      ) => {
        const apiKey = configService.get<string>('GEMINI_API_KEY');
        if (apiKey && gemini) {
          return gemini;
        }
        return fake;
      },
    },
  ],
  exports: [SUMMARIZATION_PROVIDER],
})
export class LlmModule {}
