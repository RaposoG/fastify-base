import '@fastify/jwt';
import 'fastify';
import type { DataSource } from 'typeorm';

declare module 'fastify' {
  interface FastifyInstance {
    db: DataSource;
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    csrfGuard: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { sub: string; email: string };
    user: { sub: string; email: string };
  }
}
