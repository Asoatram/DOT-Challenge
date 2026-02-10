import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { createE2EApplication } from './helpers/app.e2e-helper';
import { authHeader, loginAs, TokenPair } from './helpers/auth.e2e-helper';
import { cleanupSessionsForUsers } from './helpers/cleanup.e2e-helper';
import {
  ensureSeedAccounts,
  SEED_PASSWORD,
  SeedAccounts,
} from './helpers/seed-accounts.e2e-helper';

describe('Auth token lifecycle (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accounts: SeedAccounts;
  let requesterTokens: TokenPair;

  beforeAll(async () => {
    const setup = await createE2EApplication();
    app = setup.app;
    prisma = setup.prisma;
    accounts = await ensureSeedAccounts(prisma);
  });

  afterAll(async () => {
    if (prisma && accounts) {
      await cleanupSessionsForUsers(prisma, [accounts.requester.id]);
    }

    if (app) {
      await app.close();
    }
  });

  it('POST /auth/login returns access and refresh tokens', async () => {
    const response = await loginAs(app, accounts.requester.email, SEED_PASSWORD);
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('access_token');
    expect(response.body).toHaveProperty('refresh_token');
    expect(response.body.access_token).toEqual(expect.any(String));
    expect(response.body.refresh_token).toEqual(expect.any(String));

    requesterTokens = response.body as TokenPair;
  });

  it('POST /auth/refresh returns new valid token pair', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Authorization', authHeader(requesterTokens.refresh_token))
      .expect(201);

    expect(response.body).toHaveProperty('access_token');
    expect(response.body).toHaveProperty('refresh_token');
    expect(response.body.access_token).toEqual(expect.any(String));
    expect(response.body.refresh_token).toEqual(expect.any(String));

    requesterTokens = response.body as TokenPair;
  });

  it('POST /auth/logout revokes the current refresh session', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Authorization', authHeader(requesterTokens.refresh_token))
      .expect(201);

    expect(response.body).toEqual({ ok: true });
  });

  it('POST /auth/refresh fails after logout with the same token', async () => {
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Authorization', authHeader(requesterTokens.refresh_token))
      .expect(401);
  });
});
