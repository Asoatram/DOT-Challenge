import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { SEED_PASSWORD } from './seed-accounts.e2e-helper';

export type TokenPair = {
  access_token: string;
  refresh_token: string;
};

export async function loginAs(
  app: INestApplication,
  email: string,
  password = SEED_PASSWORD,
) {
  return request(app.getHttpServer()).post('/auth/login').send({
    email,
    password,
  });
}

export async function loginAsOrFail(
  app: INestApplication,
  email: string,
  password = SEED_PASSWORD,
): Promise<TokenPair> {
  const response = await loginAs(app, email, password);
  if (response.status !== 201) {
    throw new Error(
      `Login failed for ${email}. Status=${response.status}, body=${JSON.stringify(response.body)}`,
    );
  }
  return response.body as TokenPair;
}

export function authHeader(token: string) {
  return `Bearer ${token}`;
}
