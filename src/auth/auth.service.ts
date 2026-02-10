import {
    ConflictException,
    Injectable,
    NotFoundException,
    UnauthorizedException,
  } from '@nestjs/common';
  import { PrismaService } from 'src/prisma/prisma.service';
  import { RegisterDTO } from './dto/register.dto';
  import { LoginDTO } from './dto/login.dto';
  import { ConfigService } from '@nestjs/config';
  import { UsersService } from 'src/users/users.service';
  import { JwtService } from '@nestjs/jwt';
  import * as bcrypt from 'bcrypt';
  
  @Injectable()
  export class AuthService {
    constructor(
      private readonly userService: UsersService,
      private readonly jwtService: JwtService,
      private readonly config: ConfigService,
      private readonly prisma: PrismaService,
    ) {}
  
    async registerUser(registerDTO: RegisterDTO) {
      const existing = await this.userService.findUserByEmail(registerDTO.email);
      if (existing) throw new ConflictException('User with this email already exists');
  
      const user = await this.userService.createUser(registerDTO);
  
      const session = await this.createSession(user.id);
  
      const tokens = await this.issueTokens(user.id, user.email, user.role, session.id);
  
      await this.saveRefreshTokenHash(session.id, tokens.refresh_token);
  
      return tokens;
    }
  
    async loginUser(loginDTO: LoginDTO) {
      const user = await this.userService.findUserByEmail(loginDTO.email);
      if (!user) throw new UnauthorizedException('Invalid credentials');
  
      const ok = await bcrypt.compare(loginDTO.password, user.password);
      if (!ok) throw new UnauthorizedException('Invalid credentials');
  
      const session = await this.createSession(user.id);
  
      const tokens = await this.issueTokens(user.id, user.email, user.role, session.id);
      await this.saveRefreshTokenHash(session.id, tokens.refresh_token);
  
      return tokens;
    }

    async refreshTokens(userId: string, sid: string, refreshToken: string) {
      const user = await this.userService.findUserById(userId);
      if (!user) throw new NotFoundException('User not found');
  
      const session = await this.prisma.session.findUnique({
        where: { id: sid },
      });
  
      if (!session || session.userId !== userId) {
        throw new UnauthorizedException('Access denied');
      }
  
      if (session.revokedAt) throw new UnauthorizedException('Access denied');
      if (session.expiresAt.getTime() < Date.now()) throw new UnauthorizedException('Access denied');
      if (!session.refreshTokenHash) throw new UnauthorizedException('Access denied');

      const ok = await bcrypt.compare(refreshToken, session.refreshTokenHash);
      if (!ok) throw new UnauthorizedException('Access denied');
  
      const tokens = await this.issueTokens(userId, user.email, user.role, sid);
      await this.saveRefreshTokenHash(sid, tokens.refresh_token);
  
      return tokens;
    }
  
    async logout(userId: string, sid: string) {
      const session = await this.prisma.session.findUnique({ where: { id: sid } });
      if (!session || session.userId !== userId) throw new UnauthorizedException('Access denied');
  
      await this.prisma.session.update({
        where: { id: sid },
        data: { revokedAt: new Date() },
      });
  
      return { ok: true };
    }
  
  
    private async createSession(userId: string) {
      const refreshDays = 7;
      const expiresAt = new Date(Date.now() + refreshDays * 24 * 60 * 60 * 1000);
  
      return this.prisma.session.create({
        data: {
          userId,
          refreshTokenHash: '',
          expiresAt,
        },
      });
    }
  
    private async saveRefreshTokenHash(sessionId: string, refreshToken: string) {
      const newHash = await bcrypt.hash(refreshToken, 10);
      await this.prisma.session.update({
        where: { id: sessionId },
        data: { refreshTokenHash: newHash },
      });
    }
  
    private async issueTokens(userId: string, email: string, role: string, sid: string) {
      const accessPayload = { sub: userId, email, role };
      const refreshPayload = { sub: userId, sid };
  
      const [access_token, refresh_token] = await Promise.all([
        this.jwtService.signAsync(accessPayload, {
          secret: this.config.get<string>('JWT_ACCESS_SECRET'),
          expiresIn: '60m',
        }),
        this.jwtService.signAsync(refreshPayload, {
          secret: this.config.get<string>('JWT_REFRESH_SECRET'),
          expiresIn: '7d',
        }),
      ]);
  
      return { access_token, refresh_token };
    }
  }
  
