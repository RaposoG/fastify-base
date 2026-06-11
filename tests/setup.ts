/**
 * Roda antes de cada arquivo de teste (vitest `setupFiles`).
 *
 * Define o ambiente de teste ANTES de qualquer import de `@/config/env`
 * (que parseia process.env no load). Secrets de teste são fixos; o banco só
 * é usado pelos testes de integração, que são pulados quando
 * `TEST_DATABASE_URL` não está definido.
 */
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL ||= 'fatal'; // silencia logs do Fastify durante os testes
process.env.JWT_SECRET ||= 'test-jwt-secret-0123456789';
process.env.JWT_REFRESH_SECRET ||= 'test-refresh-secret-0123456789';
process.env.COOKIE_SECRET ||= 'test-cookie-secret-0123456789';
process.env.JWT_EXPIRES_IN ||= '15m';
process.env.JWT_REFRESH_EXPIRES_IN ||= '30d';

if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
}
