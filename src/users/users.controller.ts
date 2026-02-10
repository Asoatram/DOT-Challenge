import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';

type AuthenticatedRequestUser = {
  id: string;
  email: string;
  role: string;
};

@Controller('api/v1/users')
@ApiTags('Users')
@ApiSecurity('Bearer')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() req: Request & { user: AuthenticatedRequestUser }) {
    return this.usersService.findPublicUserById(req.user.id);
  }
}
