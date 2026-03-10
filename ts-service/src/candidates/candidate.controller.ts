import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';

import { AuthUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/auth-user.decorator';
import { FakeAuthGuard } from '../auth/fake-auth.guard';
import { CandidateService } from './candidate.service';
import { CreateDocumentDto } from './dto/create-document.dto';

@ApiTags('Candidates')
@ApiHeader({ name: 'x-user-id', required: true, description: 'Simulated User ID' })
@ApiHeader({ name: 'x-workspace-id', required: true, description: 'Simulated Workspace ID' })
@Controller('candidates')
@UseGuards(FakeAuthGuard)
export class CandidateController {
  constructor(private readonly candidateService: CandidateService) {}

  @Post(':candidateId/documents')
  @ApiOperation({ summary: 'Upload a candidate document' })
  async uploadDocument(
    @CurrentUser() user: AuthUser,
    @Param('candidateId') candidateId: string,
    @Body() dto: CreateDocumentDto,
  ) {
    return this.candidateService.uploadDocument(
      user.workspaceId,
      candidateId,
      dto,
    );
  }

  @Post(':candidateId/summaries/generate')
  @ApiOperation({ summary: 'Queue summary generation for a candidate' })
  async generateSummary(
    @CurrentUser() user: AuthUser,
    @Param('candidateId') candidateId: string,
  ) {
    return this.candidateService.queueSummaryGeneration(
      user.workspaceId,
      candidateId,
    );
  }

  @Get(':candidateId/summaries')
  @ApiOperation({ summary: 'List all summaries for a candidate' })
  async listSummaries(
    @CurrentUser() user: AuthUser,
    @Param('candidateId') candidateId: string,
  ) {
    return this.candidateService.listSummaries(
      user.workspaceId,
      candidateId,
    );
  }

  @Get(':candidateId/summaries/:summaryId')
  @ApiOperation({ summary: 'Retrieve a specific candidate summary' })
  async getSummary(
    @CurrentUser() user: AuthUser,
    @Param('candidateId') candidateId: string,
    @Param('summaryId') summaryId: string,
  ) {
    return this.candidateService.getSummary(
      user.workspaceId,
      candidateId,
      summaryId,
    );
  }
}
