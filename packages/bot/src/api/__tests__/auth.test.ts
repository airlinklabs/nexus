import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';

vi.mock('../../env.js', () => ({
  env: {
    NODE_ENV: 'test',
    DISCORD_TOKEN: 'test-token',
    DISCORD_CLIENT_ID: 'test-client-id',
    DISCORD_CLIENT_SECRET: 'test-client-secret',
    API_SECRET: 'test-api-secret',
    API_BASE_URL: 'http://localhost:3001',
    PORT: 3001,
  },
}));

const { createServer } = await import('../server.js');
import type { FastifyInstance } from 'fastify';

let app: FastifyInstance;

beforeAll(async () => {
  app = await createServer();
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toMatchObject({ status: 'ok' });
  });
});

describe('GET /auth/me', () => {
  it('returns 401 when no session cookie is present', async () => {
    const res = await app.inject({ method: 'GET', url: '/auth/me' });
    expect(res.statusCode).toBe(401);
    const body = JSON.parse(res.body) as { error: { code: string } };
    expect(body.error.code).toBe('UNAUTHORIZED');
  });
});

describe('GET /api/guilds', () => {
  it('returns 401 when not authenticated', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/guilds' });
    expect(res.statusCode).toBe(401);
  });
});
