import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { existsSync } from 'node:fs';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';

function assertE2EEnvironment() {
  if (!existsSync('.env.test')) {
    throw new Error(
      'Missing .env.test. Create it from .env.test.example before running e2e tests.',
    );
  }

  if (process.env.DOTENV_CONFIG_PATH !== '.env.test') {
    throw new Error('Use npm run test:e2e so .env.test is loaded.');
  }

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required for e2e tests.');
  }

  if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) {
    throw new Error('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET are required for e2e tests.');
  }
}

export async function createE2EApplication(): Promise<{
  app: INestApplication;
  prisma: PrismaService;
}> {
  assertE2EEnvironment();

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.init();

  return {
    app,
    prisma: app.get(PrismaService),
  };
}
