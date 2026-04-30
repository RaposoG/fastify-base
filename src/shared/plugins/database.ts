import { AppDataSource } from '@/database/data-source';
import type { FastifyInstance } from 'fastify';

/**
 * Plugin que inicializa a conexão com o banco e expõe `app.db`.
 */
export async function registerDatabase(app: FastifyInstance): Promise<void> {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
    app.log.info('🗄️  Database connected');
  }

  app.decorate('db', AppDataSource);

  app.addHook('onClose', async () => {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      app.log.info('🗄️  Database connection closed');
    }
  });
}
