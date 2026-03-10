import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/auth-user.decorator';
import { AuthUser } from '../auth/auth.types';
import { FakeAuthGuard } from '../auth/fake-auth.guard';
import { CreateSampleCandidateDto } from './dto/create-sample-candidate.dto';
import { SampleService } from './sample.service';

@ApiTags('Sample / Onboarding')
@ApiHeader({ name: 'x-user-id', required: true, description: 'Simulated User ID' })
@ApiHeader({ name: 'x-workspace-id', required: true, description: 'Simulated Workspace ID' })
@Controller('sample')
@UseGuards(FakeAuthGuard)
export class SampleController {
  constructor(private readonly sampleService: SampleService) {}

  @Post('candidates')
  @ApiOperation({ summary: 'Create a sample candidate for onboarding' })
  async createCandidate(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateSampleCandidateDto,
  ) {
    return this.sampleService.createCandidate(user, dto);
  }

  @Get('candidates')
  @ApiOperation({ summary: 'List sample candidates in the current workspace' })
  async listCandidates(@CurrentUser() user: AuthUser) {
    return this.sampleService.listCandidates(user);
  }
}
