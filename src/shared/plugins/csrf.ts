import { ForbiddenError } from '@/shared/errors/app-error';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { COOKIE_NAMES } from './cookies';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
export const CSRF_HEADER = 'x-csrf-token';

export const generateCsrfToken = (): string => randomBytes(32).toString('base64url');

const safeEqual = (a: string, b: string): boolean => {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
};

/**
 * Decora `app.csrfGuard` — usado em rotas protegidas que usam cookie HttpOnly.
 * Aplica double-submit cookie: o cliente lê o cookie `csrf_token` e envia o
 * mesmo valor no header `X-CSRF-Token`. Atacantes em outros origins não
 * conseguem ler o cookie, então não conseguem forjar o header.
 */
export async function registerCsrf(app: FastifyInstance): Promise<void> {
  app.decorate('csrfGuard', async (request: FastifyRequest, _reply: FastifyReply) => {
    if (SAFE_METHODS.has(request.method)) return;

    const cookieToken = request.cookies[COOKIE_NAMES.csrf];
    const headerValue = request.headers[CSRF_HEADER];
    const headerToken = Array.isArray(headerValue) ? headerValue[0] : headerValue;

    if (!cookieToken || !headerToken || !safeEqual(cookieToken, headerToken)) {
      throw new ForbiddenError('CSRF token missing or invalid');
    }
  });
}
