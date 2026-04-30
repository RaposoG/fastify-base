import { AppDataSource } from './data-source';

/**
 * Script standalone para rodar migrations no startup do container de produção.
 * Usado pelo CMD do Dockerfile.
 */
async function run(): Promise<void> {
  try {
    await AppDataSource.initialize();
    const pending = await AppDataSource.showMigrations();
    if (pending) {
      console.log('🚚 Executando migrations pendentes...');
      await AppDataSource.runMigrations({ transaction: 'all' });
      console.log('✅ Migrations aplicadas.');
    } else {
      console.log('✅ Nenhuma migration pendente.');
    }
    await AppDataSource.destroy();
    process.exit(0);
  } catch (err) {
    console.error('❌ Falha ao rodar migrations:', err);
    process.exit(1);
  }
}

run();
