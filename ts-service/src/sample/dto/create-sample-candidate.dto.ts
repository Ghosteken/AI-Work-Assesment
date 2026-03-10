import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateSampleCandidateDto {
  @ApiProperty({ description: 'The full name of the candidate', example: 'John Doe' })
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  fullName!: string;

  @ApiProperty({ description: 'The email address of the candidate', example: 'john@example.com', required: false })
  @IsOptional()
  @IsEmail()
  @MaxLength(160)
  email?: string;
}
