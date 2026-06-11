// Imports RELATIVOS (sem alias `@/`) de propósito: este arquivo é carregado
// pelo CLI do TypeORM (migration:*), que não resolve os paths do tsconfig.
import 'reflect-metadata';
import { DataSource, type DataSourceOptions } from 'typeorm';
import { env } from '../config/env';
import { entities } from './entities';

/**
 * Entities são registradas explicitamente em `entities.ts` (não via glob),
 * para funcionar igual sob Bun, Vitest e bundlers.
 *
 * Migrations seguem com glob — rodam via CLI (Bun strip de types). Em teste
 * usamos `synchronize` (não migrations); deixamos a lista vazia para o TypeORM
 * não importar os arquivos de migration sob o Vitest (onde o import de tipos
 * `MigrationInterface` quebraria).
 */
const migrationsGlob = env.NODE_ENV === 'test' ? [] : ['src/database/migrations/*.ts'];

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
  // Usa `gen_random_uuid()` (core do Postgres 13+) em vez de
  // `uuid_generate_v4()` (extensão uuid-ossp). Zero extensões num DB novo.
  uuidExtension: 'pgcrypto',
  synchronize: env.DB_SYNCHRONIZE,
  logging: env.DB_LOGGING,
  entities,
  migrations: migrationsGlob,
  migrationsRun: false,
} as DataSourceOptions);
