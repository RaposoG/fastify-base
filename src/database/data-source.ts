import { env } from '@/config/env';
import 'reflect-metadata';
import { DataSource, type DataSourceOptions } from 'typeorm';

/**
 * Bun roda .ts diretamente — não há separação dev/prod nos globs.
 */
const entitiesGlob = ['src/modules/**/*.entity.ts'];
const migrationsGlob = ['src/database/migrations/*.ts'];

const sslOption = env.DB_SSL ? { ssl: { rejectUnauthorized: false } } : {};

const connection: Partial<DataSourceOptions> =
  env.db.kind === 'url'
    ? { url: env.db.url }
    : {
        host: env.db.host,
        port: env.db.port,
        username: env.db.username,
        password: env.db.password,
        database: env.db.database,
      };

export const AppDataSource = new DataSource({
  type: 'postgres',
  ...connection,
  ...sslOption,
  synchronize: env.DB_SYNCHRONIZE,
  logging: env.DB_LOGGING,
  entities: entitiesGlob,
  migrations: migrationsGlob,
  migrationsRun: false,
} as DataSourceOptions);
