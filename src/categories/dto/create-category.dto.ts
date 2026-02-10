import { Transform } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({
    example: 'example category',
    minLength: 2,
    maxLength: 100,
    description: 'Category name',
  })
    @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;
}
