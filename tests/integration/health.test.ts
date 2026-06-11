import { buildApp } from '@/app';
import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

// Integração precisa de um Postgres real — defina TEST_DATABASE_URL para rodar.
const dbConfigured = Boolean(process.env.TEST_DATABASE_URL);

describe.skipIf(!dbConfigured)('GET /health', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.db.synchronize(true);
  });

  afterAll(async () => {
    await app?.close();
  });

  it('returns ok with uptime', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe('ok');
    expect(typeof body.uptime).toBe('number');
  });
});
