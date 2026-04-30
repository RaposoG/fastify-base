import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import Fastify, { type FastifyInstance } from 'fastify';
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';
import 'reflect-metadata';

import { env } from '@/config/env';
import { registerModules } from '@/modules';
import { registerErrorHandler } from '@/shared/errors/error-handler';
import { registerCookies } from '@/shared/plugins/cookies';
import { registerCsrf } from '@/shared/plugins/csrf';
import { registerDatabase } from '@/shared/plugins/database';
import { registerJwt } from '@/shared/plugins/jwt';
import { registerSwagger } from '@/shared/plugins/swagger';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      ...(env.NODE_ENV !== 'production' && {
        transport: { target: 'pino-pretty', options: { colorize: true } },
      }),
    },
    disableRequestLogging: false,
    // Necessário p/ rate-limit e logs corretos quando atrás de proxy/CDN.
    trustProxy: true,
  }).withTypeProvider<ZodTypeProvider>();

  // Compilers do Zod
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // Origins permitidas (CSV no env). Com cookies + credentials, NÃO podemos
  // usar `origin: true` em produção: o browser exige um Access-Control-
  // Allow-Origin específico quando credentials: include.
  const allowedOrigins = env.CORS_ORIGIN.split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  // Plugins de segurança / infra
  await app.register(helmet, { global: true });
  await app.register(cors, {
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // mobile/curl/server-to-server
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error('Origin not allowed by CORS'), false);
    },
    credentials: true,
  });

  // Cookies (precisa estar registrado antes do JWT, que lê via cookie)
  await registerCookies(app);

  // Swagger antes das rotas
  await registerSwagger(app);

  // Banco
  await registerDatabase(app);

  // JWT (decora app.authenticate, lê o token do cookie HttpOnly)
  await registerJwt(app);

  // CSRF guard (decora app.csrfGuard) — usado em rotas mutáveis autenticadas
  await registerCsrf(app);

  // Healthcheck
  app.get('/health', async () => ({ status: 'ok', uptime: process.uptime() }));

  // Módulos de domínio
  await registerModules(app);

  // Handler global de erros (após rotas)
  registerErrorHandler(app);

  return app;
}
