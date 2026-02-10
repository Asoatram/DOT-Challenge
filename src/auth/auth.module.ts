import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { UsersModule } from 'src/users/users.module';
import { RtStrategy } from './rt.strategy';


@Module({
  imports: [UsersModule, PassportModule, JwtModule.registerAsync({
    inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        signOptions: { expiresIn: '3600s' },
      })
    })
  ],
  providers: [AuthService, JwtStrategy, RtStrategy],
  controllers: [AuthController]
})
export class AuthModule {}
