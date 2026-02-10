import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDTO {
  @ApiProperty({
    example: 'agent@example.com',
    description: 'Registered user email',
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
