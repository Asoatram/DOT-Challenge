import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { TicketPriority, TicketStatus } from '../../../generated/prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTicketDto {
  @ApiPropertyOptional({
    example: 'Cannot login to dashboard',
    description: 'Updated ticket title',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    example: 'Issue still occurs after clearing browser cache.',
    description: 'Updated ticket description',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    enum: TicketStatus,
    example: 'OPEN',
    description: 'Updated ticket status',
  })
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @ApiPropertyOptional({
    enum: TicketPriority,
    example: 'HIGH',
    description: 'Updated ticket priority',
  })
  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @ApiPropertyOptional({
    format: 'uuid',
    example: '6dcf0bb9-17f4-4f67-b4e5-f64d1a18b333',
    description: 'Updated assignee user ID',
  })
  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    example: '5b670b57-4389-45e0-becb-3c8f33df5935',
    description: 'Updated category ID',
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string;
}
