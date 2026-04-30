// Bun carrega .env automaticamente — não precisa de dotenv.
import { z } from 'zod';

const boolFromString = z
  .string()
  .default('false')
  .transform((v) => v === 'true');

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(3333),
    HOST: z.string().default('0.0.0.0'),
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

    // Banco — DATABASE_URL tem prioridade. Se ausente, usa as variáveis discretas abaixo.
    DATABASE_URL: z.string().url().optional(),
    DB_HOST: z.string().default('localhost'),
    DB_PORT: z.coerce.number().int().positive().default(5432),
    DB_USER: z.string().default('postgres'),
    DB_PASS: z.string().default('postgres'),
    DB_NAME: z.string().default('app_db'),
    DB_SSL: boolFromString,
    DB_SYNCHRONIZE: boolFromString,
    DB_LOGGING: boolFromString,

    JWT_SECRET: z.string().min(8).default('change-me-in-production'),
    JWT_EXPIRES_IN: z.string().default('15m'),
    JWT_REFRESH_SECRET: z.string().min(8).default('change-me-refresh-in-production'),
    JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

    // Cookies / CORS / CSRF
    COOKIE_SECRET: z.string().min(16).default('change-me-cookie-secret-please-32b'),
    COOKIE_DOMAIN: z.string().optional(),
    COOKIE_SECURE: boolFromString, // força true em produção independente do valor
    CORS_ORIGIN: z.string().default('http://localhost:3000'), // CSV — ex: "http://a.com,http://b.com"
  })
  .transform((cfg) => {
    // Resolve a configuração de conexão final, preferindo DATABASE_URL.
    const db = cfg.DATABASE_URL
      ? ({ kind: 'url', url: cfg.DATABASE_URL } as const)
      : ({
          kind: 'discrete',
          host: cfg.DB_HOST,
          port: cfg.DB_PORT,
          username: cfg.DB_USER,
          password: cfg.DB_PASS,
          database: cfg.DB_NAME,
        } as const);

    return { ...cfg, db };
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Variáveis de ambiente inválidas:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
