import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDTO } from './dto/login.dto';
import { RegisterDTO } from './dto/register.dto';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { ApiBody, ApiSecurity, ApiTags } from '@nestjs/swagger';

type RefreshRequestUser = {
  userId: string;
  sid: string;
  refreshToken: string;
};

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Post('login')
  @ApiBody({ type: LoginDTO })
  login(@Body() loginRequest: LoginDTO) {
    return this.service.loginUser(loginRequest);
  }

  @Post('register')
  @ApiBody({ type: RegisterDTO })
  register(@Body() registerRequest: RegisterDTO) {
    return this.service.registerUser(registerRequest);
  }

  @Post('refresh')
  @UseGuards(AuthGuard('jwt-refresh'))
  @ApiSecurity('Bearer')
  refresh(@Req() req: Request & { user: RefreshRequestUser }) {
    const { userId, sid, refreshToken } = req.user;
    return this.service.refreshTokens(userId, sid, refreshToken);
  }

  @Post('logout')
  @UseGuards(AuthGuard('jwt-refresh'))
  @ApiSecurity('Bearer')
  logout(@Req() req: Request & { user: RefreshRequestUser }) {
    const { userId, sid } = req.user;
    return this.service.logout(userId, sid);
  }
}
