import { IsOptional, IsUUID } from 'class-validator';
import { PaginationDto } from 'src/utils/dto/pagination.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ListCommentsDto extends PaginationDto {
  @ApiPropertyOptional({
    format: 'uuid',
    example: 'ebf87c5e-9eb3-4091-a940-fb85f5eb395a',
    description: 'Filter comments by ticket ID',
  })
  @IsOptional()
  @IsUUID()
  ticketId?: string;
}
