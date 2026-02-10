import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createE2EApplication } from './helpers/app.e2e-helper';
import { authHeader, loginAsOrFail, TokenPair } from './helpers/auth.e2e-helper';
import {
  cleanupE2EArtifacts,
  cleanupSessionsForUsers,
  createRunPrefix,
} from './helpers/cleanup.e2e-helper';
import { ensureSeedAccounts, SeedAccounts } from './helpers/seed-accounts.e2e-helper';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Auth + RBAC (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accounts: SeedAccounts;
  let adminTokens: TokenPair;
  let agentTokens: TokenPair;
  let requesterTokens: TokenPair;
  const runPrefix = createRunPrefix();

  beforeAll(async () => {
    const setup = await createE2EApplication();
    app = setup.app;
    prisma = setup.prisma;

    accounts = await ensureSeedAccounts(prisma);
    adminTokens = await loginAsOrFail(app, accounts.admin.email);
    agentTokens = await loginAsOrFail(app, accounts.agent.email);
    requesterTokens = await loginAsOrFail(app, accounts.requester.email);
  });

  afterAll(async () => {
    if (prisma) {
      await cleanupE2EArtifacts(prisma, runPrefix);
    }

    if (prisma && accounts) {
      await cleanupSessionsForUsers(prisma, [
        accounts.admin.id,
        accounts.agent.id,
        accounts.requester.id,
      ]);
    }

    if (app) {
      await app.close();
    }
  });

  it('GET /api/v1/users/me returns 401 without token', async () => {
    await request(app.getHttpServer()).get('/api/v1/users/me').expect(401);
  });

  it('GET /api/v1/users/me returns requester profile with token', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/users/me')
      .set('Authorization', authHeader(requesterTokens.access_token))
      .expect(200);

    expect(response.body).toMatchObject({
      id: accounts.requester.id,
      email: accounts.requester.email,
      role: 'REQUESTER',
    });
  });

  it('GET /api/v1/tickets/all allows ADMIN', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/tickets/all')
      .set('Authorization', authHeader(adminTokens.access_token))
      .expect(200);

    expect(response.body).toHaveProperty('items');
    expect(response.body).toHaveProperty('meta');
  });

  it('GET /api/v1/tickets/all forbids AGENT', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/tickets/all')
      .set('Authorization', authHeader(agentTokens.access_token))
      .expect(403);
  });

  it('GET /api/v1/tickets/all forbids REQUESTER', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/tickets/all')
      .set('Authorization', authHeader(requesterTokens.access_token))
      .expect(403);
  });

  it('GET /api/v1/tickets/assigned allows ADMIN', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/tickets/assigned')
      .set('Authorization', authHeader(adminTokens.access_token))
      .expect(200);

    expect(response.body).toHaveProperty('items');
    expect(response.body).toHaveProperty('meta');
  });

  it('GET /api/v1/tickets/assigned allows AGENT', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/tickets/assigned')
      .set('Authorization', authHeader(agentTokens.access_token))
      .expect(200);

    expect(response.body).toHaveProperty('items');
    expect(response.body).toHaveProperty('meta');
  });

  it('GET /api/v1/tickets/assigned forbids REQUESTER', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/tickets/assigned')
      .set('Authorization', authHeader(requesterTokens.access_token))
      .expect(403);
  });

  it('POST /api/v1/categories forbids REQUESTER', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/categories')
      .set('Authorization', authHeader(requesterTokens.access_token))
      .send({ name: `${runPrefix} denied` })
      .expect(403);
  });

  it('POST /api/v1/categories allows ADMIN', async () => {
    const categoryName = `${runPrefix} admin category`;
    const response = await request(app.getHttpServer())
      .post('/api/v1/categories')
      .set('Authorization', authHeader(adminTokens.access_token))
      .send({ name: categoryName })
      .expect(201);

    expect(response.body).toMatchObject({
      name: categoryName,
      ticketCount: 0,
    });
    expect(response.body.id).toEqual(expect.any(String));
  });
});
