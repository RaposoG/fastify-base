import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { UserEntity } from '../users/user.entity';
import { RefreshTokenEntity } from './refresh-token.entity';
import { AuthService, type AuthContext, type TokenPair } from './auth.service';
import {
  authResponseSchema,
  loginSchema,
  registerSchema,
  userPublicSchema,
} from './auth.schema';
import {
  COOKIE_NAMES,
  clearAuthCookies,
  setAccessCookie,
  setCsrfCookie,
  setRefreshCookie,
} from '@/shared/plugins/cookies';
import { generateCsrfToken } from '@/shared/plugins/csrf';
import { UnauthorizedError } from '@/shared/errors/app-error';

const authContextOf = (req: FastifyRequest): AuthContext => ({
  userAgent: req.headers['user-agent']?.slice(0, 64) ?? null,
  ipAddress: req.ip?.slice(0, 64) ?? null,
});

/**
 * Lê o refresh token vindo do cookie HttpOnly assinado.
 * Refresh nunca é aceito via body — assim mesmo que algum atacante consiga
 * fazer o navegador da vítima emitir uma request, ele não consegue ler o
 * cookie para forjá-lo.
 */
const readRefreshCookie = (req: FastifyRequest): string => {
  const raw = req.cookies[COOKIE_NAMES.refresh];
  if (!raw) throw new UnauthorizedError('Missing refresh cookie');
  const unsigned = req.unsignCookie(raw);
  if (!unsigned.valid || !unsigned.value) {
    throw new UnauthorizedError('Invalid refresh cookie signature');
  }
  return unsigned.value;
};

const writeAuthCookies = (reply: FastifyReply, tokens: TokenPair): string => {
  setAccessCookie(reply, tokens.accessToken, tokens.expiresIn);
  setRefreshCookie(reply, tokens.refreshToken, tokens.refreshExpiresIn);

  const csrfToken = generateCsrfToken();
  // O cookie CSRF compartilha a vida útil do refresh — assim o frontend
  // sempre consegue ler um token válido enquanto a sessão estiver ativa.
  setCsrfCookie(reply, csrfToken, tokens.refreshExpiresIn);
  return csrfToken;
};

export async function authRoutes(app: FastifyInstance): Promise<void> {
  const service = new AuthService(
    app,
    app.db.getRepository(UserEntity),
    app.db.getRepository(RefreshTokenEntity),
  );
  const r = app.withTypeProvider<ZodTypeProvider>();

  r.post(
    '/auth/register',
    {
      schema: {
        tags: ['auth'],
        summary: 'Register a new user (sets HttpOnly auth cookies)',
        body: registerSchema,
        response: { 201: authResponseSchema },
      },
    },
    async (req, reply) => {
      const { user, tokens } = await service.register(req.body, authContextOf(req));
      const csrfToken = writeAuthCookies(reply, tokens);
      return reply.status(201).send({
        user: { id: user.id, name: user.name, email: user.email },
        csrfToken,
      });
    },
  );

  r.post(
    '/auth/login',
    {
      schema: {
        tags: ['auth'],
        summary: 'Login (sets HttpOnly auth cookies)',
        body: loginSchema,
        response: { 200: authResponseSchema },
      },
    },
    async (req, reply) => {
      const { user, tokens } = await service.login(req.body, authContextOf(req));
      const csrfToken = writeAuthCookies(reply, tokens);
      return reply.send({
        user: { id: user.id, name: user.name, email: user.email },
        csrfToken,
      });
    },
  );

  /**
   * Refresh — não exige access token válido, mas exige cookie de refresh
   * válido. Não exige CSRF token porque o cookie de refresh é
   * SameSite=Strict e path-scoped.
   */
  r.post(
    '/auth/refresh',
    {
      schema: {
        tags: ['auth'],
        summary: 'Rotate refresh token via cookie',
        response: {
          200: z.object({ csrfToken: z.string() }),
        },
      },
    },
    async (req, reply) => {
      const raw = readRefreshCookie(req);
      const tokens = await service.refresh(raw, authContextOf(req));
      const csrfToken = writeAuthCookies(reply, tokens);
      return { csrfToken };
    },
  );

  r.post(
    '/auth/logout',
    {
      schema: {
        tags: ['auth'],
        summary: 'Revoke current refresh token and clear cookies',
        response: { 204: z.null() },
      },
    },
    async (req, reply) => {
      const raw = req.cookies[COOKIE_NAMES.refresh];
      if (raw) {
        const unsigned = req.unsignCookie(raw);
        if (unsigned.valid && unsigned.value) {
          await service.logout(unsigned.value);
        }
      }
      clearAuthCookies(reply);
      return reply.status(204).send(null);
    },
  );

  r.post(
    '/auth/logout-all',
    {
      onRequest: [app.authenticate, app.csrfGuard],
      schema: {
        tags: ['auth'],
        summary: 'Revoke all refresh tokens of the current user',
        response: { 204: z.null() },
      },
    },
    async (req, reply) => {
      await service.logoutAll(req.user.sub);
      clearAuthCookies(reply);
      return reply.status(204).send(null);
    },
  );

  r.get(
    '/auth/me',
    {
      onRequest: [app.authenticate],
      schema: {
        tags: ['auth'],
        summary: 'Current authenticated user',
        response: { 200: userPublicSchema },
      },
    },
    async (req) => {
      const user = await app.db.getRepository(UserEntity).findOneOrFail({
        where: { id: req.user.sub },
      });
      return { id: user.id, name: user.name, email: user.email };
    },
  );
}
