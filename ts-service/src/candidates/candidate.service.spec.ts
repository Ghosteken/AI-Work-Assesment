import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { CandidateService } from './candidate.service';
import { SampleCandidate } from '../entities/sample-candidate.entity';
import { CandidateDocument } from '../entities/candidate-document.entity';
import { CandidateSummary, SummaryStatus } from '../entities/candidate-summary.entity';
import { QueueService } from '../queue/queue.service';
import { SUMMARIZATION_PROVIDER } from '../llm/summarization-provider.interface';

describe('CandidateService', () => {
  let service: CandidateService;
  let candidateRepo: Repository<SampleCandidate>;
  let docRepo: Repository<CandidateDocument>;
  let summaryRepo: Repository<CandidateSummary>;

  const mockCandidate = { id: 'cand-1', workspaceId: 'ws-1' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CandidateService,
        {
          provide: getRepositoryToken(SampleCandidate),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(CandidateDocument),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(CandidateSummary),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: QueueService,
          useValue: {
            enqueue: jest.fn(),
          },
        },
        {
          provide: SUMMARIZATION_PROVIDER,
          useValue: {
            generateCandidateSummary: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CandidateService>(CandidateService);
    candidateRepo = module.get<Repository<SampleCandidate>>(getRepositoryToken(SampleCandidate));
    docRepo = module.get<Repository<CandidateDocument>>(getRepositoryToken(CandidateDocument));
    summaryRepo = module.get<Repository<CandidateSummary>>(getRepositoryToken(CandidateSummary));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('uploadDocument', () => {
    it('should throw NotFoundException if candidate not found', async () => {
      jest.spyOn(candidateRepo, 'findOne').mockResolvedValue(null);
      await expect(service.uploadDocument('ws-1', 'cand-1', {} as any)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if workspaceId does not match', async () => {
      jest.spyOn(candidateRepo, 'findOne').mockResolvedValue(mockCandidate as any);
      await expect(service.uploadDocument('ws-2', 'cand-1', {} as any)).rejects.toThrow(ForbiddenException);
    });

    it('should successfully upload a document', async () => {
      jest.spyOn(candidateRepo, 'findOne').mockResolvedValue(mockCandidate as any);
      jest.spyOn(docRepo, 'create').mockReturnValue({ id: 'doc-1' } as any);
      jest.spyOn(docRepo, 'save').mockResolvedValue({ id: 'doc-1' } as any);

      const result = await service.uploadDocument('ws-1', 'cand-1', {
        documentType: 'resume',
        fileName: 'resume.txt',
        rawText: 'content',
      });

      expect(result.id).toBe('doc-1');
      expect(docRepo.save).toHaveBeenCalled();
    });
  });

  describe('queueSummaryGeneration', () => {
    it('should successfully queue a summary', async () => {
      jest.spyOn(candidateRepo, 'findOne').mockResolvedValue(mockCandidate as any);
      jest.spyOn(summaryRepo, 'create').mockReturnValue({ id: 'sum-1' } as any);
      jest.spyOn(summaryRepo, 'save').mockResolvedValue({ id: 'sum-1', status: SummaryStatus.PENDING } as any);

      const result = await service.queueSummaryGeneration('ws-1', 'cand-1');

      expect(result.id).toBe('sum-1');
      expect(summaryRepo.save).toHaveBeenCalled();
    });
  });
});
