import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDTO {
  @ApiProperty({
    example: 'johndoe',
    description: 'Public display username',
  })
  @IsString()
  username: string;

  @ApiProperty({
    example: 'john@example.com',
    description: 'Unique account email',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'secret123',
    minLength: 6,
    description: 'Account password',
  })
  @IsString()
  @MinLength(6)
  password: string;
}
