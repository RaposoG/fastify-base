import { buildApp } from '@/app';
import type { InjectOptions } from 'fastify';
import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const dbConfigured = Boolean(process.env.TEST_DATABASE_URL);

/** Monta o header Cookie a partir dos cookies devolvidos por uma resposta inject. */
type InjectResponse = Awaited<ReturnType<FastifyInstance['inject']>>;
const cookieHeader = (res: InjectResponse): string =>
  res.cookies.map((c) => `${c.name}=${c.value}`).join('; ');

describe.skipIf(!dbConfigured)('auth flow', () => {
  let app: FastifyInstance;

  const credentials = {
    name: 'Test User',
    email: 'test.user@example.com',
    password: 'super-secret-pw',
  };

  beforeAll(async () => {
    app = await buildApp();
    await app.db.synchronize(true); // schema limpo a cada execução
  });

  afterAll(async () => {
    await app?.close();
  });

  const post = (url: string, opts: Partial<InjectOptions> = {}): Promise<InjectResponse> =>
    app.inject({ method: 'POST', url, ...opts });

  it('registers a new user and sets auth cookies', async () => {
    const res = await post('/api/v1/auth/register', { payload: credentials });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.user.email).toBe(credentials.email);
    expect(typeof body.csrfToken).toBe('string');

    const names = res.cookies.map((c) => c.name);
    expect(names).toContain('access_token');
    expect(names).toContain('refresh_token');
    expect(names).toContain('csrf_token');
  });

  it('rejects duplicate registration with 409', async () => {
    const res = await post('/api/v1/auth/register', { payload: credentials });
    expect(res.statusCode).toBe(409);
  });

  it('logs in and exposes the current user via /me', async () => {
    const login = await post('/api/v1/auth/login', {
      payload: { email: credentials.email, password: credentials.password },
    });
    expect(login.statusCode).toBe(200);

    const me = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
      headers: { cookie: cookieHeader(login) },
    });
    expect(me.statusCode).toBe(200);
    expect(me.json().email).toBe(credentials.email);
  });

  it('rejects bad credentials with 401', async () => {
    const res = await post('/api/v1/auth/login', {
      payload: { email: credentials.email, password: 'wrong-password' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('rotates the refresh token', async () => {
    const login = await post('/api/v1/auth/login', {
      payload: { email: credentials.email, password: credentials.password },
    });

    const refresh = await post('/api/v1/auth/refresh', {
      headers: { cookie: cookieHeader(login) },
    });
    expect(refresh.statusCode).toBe(200);
    expect(typeof refresh.json().csrfToken).toBe('string');
    expect(refresh.cookies.map((c) => c.name)).toContain('refresh_token');
  });

  it('requires authentication for protected routes', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/users' });
    expect(res.statusCode).toBe(401);
  });

  it('logs out and clears cookies', async () => {
    const login = await post('/api/v1/auth/login', {
      payload: { email: credentials.email, password: credentials.password },
    });

    const res = await post('/api/v1/auth/logout', {
      headers: { cookie: cookieHeader(login) },
    });
    expect(res.statusCode).toBe(204);
  });
});
