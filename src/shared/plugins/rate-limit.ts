import { env } from '@/config/env';
import rateLimit from '@fastify/rate-limit';
import type { FastifyInstance } from 'fastify';

/**
 * Rate limit global (defesa básica contra abuso). Rotas sensíveis podem
 * apertar o limite via `config: { rateLimit: authRateLimit }` na definição
 * da rota — ver auth.routes.ts.
 *
 * `trustProxy: true` (em app.ts) garante que `request.ip` reflita o IP real
 * do cliente quando atrás de proxy/CDN, então a chave do rate limit é correta.
 */
export async function registerRateLimit(app: FastifyInstance): Promise<void> {
  await app.register(rateLimit, {
    global: true,
    max: 100,
    timeWindow: '1 minute',
    // Em teste, não queremos esbarrar no limite durante a suíte.
    enableDraftSpec: false,
    ...(env.NODE_ENV === 'test' && { max: 10_000 }),
  });
}

/**
 * Limite estrito para rotas de autenticação (login/register/refresh) —
 * mitiga brute-force e credential stuffing.
 */
export const authRateLimit = {
  max: env.NODE_ENV === 'test' ? 10_000 : 10,
  timeWindow: '1 minute',
} as const;
