import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateDocumentDto {
  @ApiProperty({ description: 'The type of document (e.g., resume, cover_letter)', example: 'resume' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  documentType!: string;

  @ApiProperty({ description: 'The original name of the file', example: 'resume.txt' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fileName!: string;

  @ApiProperty({ description: 'The full text content of the document', example: 'Senior Software Engineer with 10 years experience...' })
  @IsString()
  @IsNotEmpty()
  rawText!: string;
}
