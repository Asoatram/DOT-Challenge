import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsUUID } from 'class-validator';

export class CreateTicketDto {
  @ApiProperty({
    example: 'Cannot login to dashboard',
    description: 'Ticket title',
  })
  @IsString()
  title: string;

  @ApiProperty({
    format: 'uuid',
    example: '6dcf0bb9-17f4-4f67-b4e5-f64d1a18b333',
    description: 'User ID assigned to this ticket',
  })
  @IsUUID()
  assigneeId: string;

  @ApiProperty({
    example: 'I receive an invalid token error on every login attempt.',
    description: 'Detailed description of the issue',
  })
  @IsString()
  description: string;

  @ApiProperty({
    format: 'uuid',
    example: '5b670b57-4389-45e0-becb-3c8f33df5935',
    description: 'Category ID for this ticket',
  })
  @IsUUID()
  categoryId: string;

  @ApiProperty({
    enum: ['LOW', 'MEDIUM', 'HIGH'],
    example: 'MEDIUM',
    description: 'Ticket priority',
  })
  @IsEnum(['LOW', 'MEDIUM', 'HIGH'])
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
}
