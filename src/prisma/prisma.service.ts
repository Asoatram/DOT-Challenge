import { Injectable } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor(configService: ConfigService) {
    const databaseUrl = configService.getOrThrow<string>('DATABASE_URL');
    const parsedUrl = new URL(databaseUrl);

    const adapter = new PrismaPg({
      host: parsedUrl.hostname,
      port: parsedUrl.port ? Number(parsedUrl.port) : 5432,
      database: parsedUrl.pathname.replace(/^\//, ''),
      user: decodeURIComponent(parsedUrl.username),
      password: decodeURIComponent(parsedUrl.password ?? ''),
    });
    super({ adapter });
  }
}
