import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CandidateController } from './candidate.controller';
import { CandidateService } from './candidate.service';
import { SampleCandidate } from '../entities/sample-candidate.entity';
import { CandidateDocument } from '../entities/candidate-document.entity';
import { CandidateSummary } from '../entities/candidate-summary.entity';
import { QueueModule } from '../queue/queue.module';
import { LlmModule } from '../llm/llm.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SampleCandidate,
      CandidateDocument,
      CandidateSummary,
    ]),
    QueueModule,
    LlmModule,
  ],
  controllers: [CandidateController],
  providers: [CandidateService],
  exports: [CandidateService],
})
export class CandidateModule {}
