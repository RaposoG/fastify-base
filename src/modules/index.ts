import type { FastifyInstance } from 'fastify';
import { authRoutes } from './auth/auth.routes';
import { userRoutes } from './users/user.routes';

/**
 * Registry central de módulos. Para adicionar um novo módulo:
 *   1. Crie src/modules/<modulo>/ com entity/schema/service/routes
 *   2. Importe e registre aqui dentro de `registerModules`
 */
export async function registerModules(app: FastifyInstance): Promise<void> {
  await app.register(authRoutes, { prefix: '/api/v1' });
  await app.register(userRoutes, { prefix: '/api/v1' });
}
