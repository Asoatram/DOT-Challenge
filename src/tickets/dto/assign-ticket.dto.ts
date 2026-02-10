import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class assignTicketDto {
  @ApiProperty({
    format: 'uuid',
    example: 'ebf87c5e-9eb3-4091-a940-fb85f5eb395a',
    description: 'Ticket ID to assign',
  })
  @IsUUID()
  ticketId: string;

  @ApiProperty({
    format: 'uuid',
    example: '6dcf0bb9-17f4-4f67-b4e5-f64d1a18b333',
    description: 'User ID who will be assigned',
  })
  @IsUUID()
  assigneeId: string;
}
