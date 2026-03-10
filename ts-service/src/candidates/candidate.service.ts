import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';

import { SampleCandidate } from '../entities/sample-candidate.entity';
import { CandidateDocument } from '../entities/candidate-document.entity';
import { CandidateSummary, SummaryStatus } from '../entities/candidate-summary.entity';
import { CreateDocumentDto } from './dto/create-document.dto';
import { QueueService } from '../queue/queue.service';
import { SUMMARIZATION_PROVIDER, SummarizationProvider } from '../llm/summarization-provider.interface';

@Injectable()
export class CandidateService {
  constructor(
    @InjectRepository(SampleCandidate)
    private readonly candidateRepo: Repository<SampleCandidate>,
    @InjectRepository(CandidateDocument)
    private readonly docRepo: Repository<CandidateDocument>,
    @InjectRepository(CandidateSummary)
    private readonly summaryRepo: Repository<CandidateSummary>,
    private readonly queueService: QueueService,
    @Inject(SUMMARIZATION_PROVIDER)
    private readonly summarizationProvider: SummarizationProvider,
  ) {}

  async uploadDocument(
    workspaceId: string,
    candidateId: string,
    dto: CreateDocumentDto,
  ): Promise<CandidateDocument> {
    const candidate = await this.findCandidate(workspaceId, candidateId);

    const doc = this.docRepo.create({
      id: randomUUID(),
      candidateId: candidate.id,
      documentType: dto.documentType,
      fileName: dto.fileName,
      rawText: dto.rawText,
      storageKey: `local://${candidate.id}/${dto.fileName}`, // Mock storage key
    });

    return this.docRepo.save(doc);
  }

  async queueSummaryGeneration(
    workspaceId: string,
    candidateId: string,
  ): Promise<CandidateSummary> {
    const candidate = await this.findCandidate(workspaceId, candidateId);

    const summary = this.summaryRepo.create({
      id: randomUUID(),
      candidateId: candidate.id,
      status: SummaryStatus.PENDING,
    });

    const savedSummary = await this.summaryRepo.save(summary);

    // Enqueue the job
    this.queueService.enqueue('generate-summary', {
      summaryId: savedSummary.id,
      candidateId: candidate.id,
    });

    // Start background processing "in the background"
    // In a real app, this would be a separate worker process.
    // Here we'll just fire and forget for the sake of the assessment.
    this.processJob(savedSummary.id, candidate.id).catch(console.error);

    return savedSummary;
  }

  async listSummaries(
    workspaceId: string,
    candidateId: string,
  ): Promise<CandidateSummary[]> {
    const candidate = await this.findCandidate(workspaceId, candidateId);

    return this.summaryRepo.find({
      where: { candidateId: candidate.id },
      order: { createdAt: 'DESC' },
    });
  }

  async getSummary(
    workspaceId: string,
    candidateId: string,
    summaryId: string,
  ): Promise<CandidateSummary> {
    const candidate = await this.findCandidate(workspaceId, candidateId);

    const summary = await this.summaryRepo.findOne({
      where: { id: summaryId, candidateId: candidate.id },
    });

    if (!summary) {
      throw new NotFoundException('Summary not found');
    }

    return summary;
  }

  private async findCandidate(
    workspaceId: string,
    candidateId: string,
  ): Promise<SampleCandidate> {
    const candidate = await this.candidateRepo.findOne({
      where: { id: candidateId },
    });

    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }

    if (candidate.workspaceId !== workspaceId) {
      throw new ForbiddenException('You do not have access to this candidate');
    }

    return candidate;
  }

  /**
   * Mock worker logic that processes the enqueued job.
   */
  private async processJob(summaryId: string, candidateId: string) {
    try {
      const summary = await this.summaryRepo.findOne({ where: { id: summaryId } });
      if (!summary) return;

      const documents = await this.docRepo.find({ where: { candidateId } });
      if (documents.length === 0) {
        summary.status = SummaryStatus.FAILED;
        summary.errorMessage = 'No documents found for candidate';
        await this.summaryRepo.save(summary);
        return;
      }

      const result = await this.summarizationProvider.generateCandidateSummary({
        candidateId,
        documents: documents.map((d) => d.rawText),
      });

      summary.status = SummaryStatus.COMPLETED;
      summary.score = result.score;
      summary.strengths = result.strengths.join('\n');
      summary.concerns = result.concerns.join('\n');
      summary.summary = result.summary;
      summary.recommendedDecision = result.recommendedDecision;
      summary.provider = 'gemini-3-flash-preview';
      summary.promptVersion = 'v1';

      await this.summaryRepo.save(summary);
    } catch (error: any) {
      const summary = await this.summaryRepo.findOne({ where: { id: summaryId } });
      if (summary) {
        summary.status = SummaryStatus.FAILED;
        summary.errorMessage = error.message;
        await this.summaryRepo.save(summary);
      }
    }
  }
}
