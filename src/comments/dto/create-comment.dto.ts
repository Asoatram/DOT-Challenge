import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({
    format: 'uuid',
    example: 'ebf87c5e-9eb3-4091-a940-fb85f5eb395a',
    description: 'Ticket ID associated with the comment',
  })
  @IsUUID()
  ticketId: string;

  @ApiProperty({
    example: 'We are currently investigating this issue.',
    minLength: 1,
    maxLength: 2000,
    description: 'Comment content',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  body: string;
}
