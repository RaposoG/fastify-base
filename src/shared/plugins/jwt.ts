import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fastifyJwt from '@fastify/jwt';
import { env } from '@/config/env';
import { UnauthorizedError } from '@/shared/errors/app-error';
import { COOKIE_NAMES } from './cookies';

export async function registerJwt(app: FastifyInstance): Promise<void> {
  await app.register(fastifyJwt, {
    secret: env.JWT_SECRET,
    sign: { expiresIn: env.JWT_EXPIRES_IN },
    // O token vem do cookie HttpOnly assinado — nunca lemos o header
    // Authorization. Isso é o que impede o frontend de armazenar o token
    // em local/sessionStorage (proteção contra XSS exfiltrar a sessão).
    cookie: {
      cookieName: COOKIE_NAMES.access,
      signed: true,
    },
  });

  app.decorate(
    'authenticate',
    async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
      try {
        // `onlyCookie: true` força a leitura do cookie e ignora qualquer
        // header Authorization que possa vir junto.
        await request.jwtVerify({ onlyCookie: true });
      } catch {
        throw new UnauthorizedError('Invalid or expired access token');
      }
    },
  );
}
