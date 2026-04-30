import { env } from '@/config/env';
import fastifyCookie from '@fastify/cookie';
import type { FastifyInstance, FastifyReply } from 'fastify';

/**
 * Nomes dos cookies usados pelo módulo auth.
 * - `access_token` e `refresh_token` são HttpOnly: o JS do frontend não enxerga.
 * - `csrf_token` é legível por JS (precisa ser ecoado no header `X-CSRF-Token`)
 *   para implementar o padrão double-submit cookie.
 */
export const COOKIE_NAMES = {
  access: 'access_token',
  refresh: 'refresh_token',
  csrf: 'csrf_token',
} as const;

const isProd = env.NODE_ENV === 'production';
const useSecure = env.COOKIE_SECURE || isProd;

/** Opções comuns aos cookies do módulo de auth. */
const baseOptions = {
  httpOnly: true,
  secure: useSecure,
  domain: env.COOKIE_DOMAIN,
  signed: true,
} as const;

export interface SetCookieDurations {
  accessMaxAgeSec: number;
  refreshMaxAgeSec: number;
}

export function setAccessCookie(reply: FastifyReply, token: string, maxAgeSec: number): void {
  reply.setCookie(COOKIE_NAMES.access, token, {
    ...baseOptions,
    sameSite: 'lax',
    path: '/',
    maxAge: maxAgeSec,
  });
}

/**
 * Refresh token só é enviado nas rotas em `/api/v1/auth/*` (path-scoped),
 * com SameSite=strict para minimizar superfície de CSRF.
 */
export function setRefreshCookie(reply: FastifyReply, token: string, maxAgeSec: number): void {
  reply.setCookie(COOKIE_NAMES.refresh, token, {
    ...baseOptions,
    sameSite: 'strict',
    path: '/api/v1/auth',
    maxAge: maxAgeSec,
  });
}

export function setCsrfCookie(reply: FastifyReply, token: string, maxAgeSec: number): void {
  reply.setCookie(COOKIE_NAMES.csrf, token, {
    httpOnly: false, // o frontend precisa ler para colocar no header
    secure: useSecure,
    domain: env.COOKIE_DOMAIN,
    signed: false,
    sameSite: 'lax',
    path: '/',
    maxAge: maxAgeSec,
  });
}

export function clearAuthCookies(reply: FastifyReply): void {
  const common = {
    secure: useSecure,
    domain: env.COOKIE_DOMAIN,
    sameSite: 'lax' as const,
  };
  reply.clearCookie(COOKIE_NAMES.access, { ...common, path: '/' });
  reply.clearCookie(COOKIE_NAMES.refresh, { ...common, sameSite: 'strict', path: '/api/v1/auth' });
  reply.clearCookie(COOKIE_NAMES.csrf, { ...common, path: '/' });
}

export async function registerCookies(app: FastifyInstance): Promise<void> {
  await app.register(fastifyCookie, {
    secret: env.COOKIE_SECRET,
    parseOptions: {},
  });
}
