import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import {
  CandidateSummaryInput,
  CandidateSummaryResult,
  SummarizationProvider,
} from './summarization-provider.interface';

@Injectable()
export class GeminiSummarizationProvider implements SummarizationProvider {
  private readonly genAI: GoogleGenerativeAI;
  private readonly model: any;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    
    // Using the latest Gemini 3 Flash model for high-efficiency summarization
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-3-flash-preview',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            score: { type: SchemaType.NUMBER },
            strengths: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
            concerns: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
            summary: { type: SchemaType.STRING },
            recommendedDecision: { 
              type: SchemaType.STRING,
              enum: ['advance', 'hold', 'reject'],
              format: 'enum',
            },
          },
          required: ['score', 'strengths', 'concerns', 'summary', 'recommendedDecision'],
        },
      },
    });
  }

  async generateCandidateSummary(
    input: CandidateSummaryInput,
  ): Promise<CandidateSummaryResult> {
    const prompt = `
      You are an expert technical recruiter. Analyze the following candidate documents and provide a structured summary.
      
      Candidate ID: ${input.candidateId}
      
      Documents:
      ${input.documents.join('\n\n---\n\n')}
      
      Provide your response in JSON format matching the requested schema.
      - score: A number from 0 to 100 representing the candidate's fit.
      - strengths: A list of key strengths.
      - concerns: A list of potential risks or concerns.
      - summary: A 2-3 paragraph professional summary of the candidate.
      - recommendedDecision: One of 'advance', 'hold', or 'reject'.
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      return JSON.parse(text) as CandidateSummaryResult;
    } catch (error: any) {
      console.error('Gemini API Error:', error);
      throw new Error(`Failed to generate candidate summary: ${error.message}`);
    }
  }
}
