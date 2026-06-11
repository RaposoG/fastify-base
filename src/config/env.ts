// Bun carrega .env automaticamente — não precisa de dotenv.
import { z } from 'zod';

const boolFromString = z
  .string()
  .default('false')
  .transform((v) => v === 'true');

// Variáveis ausentes em docker-compose/.env costumam chegar como string vazia
// (ex.: `${DATABASE_URL:-}`). Tratamos "" como não definido.
const emptyAsUndefined = (v: unknown): unknown => (v === '' ? undefined : v);

/**
 * Secrets default do template. São proibidos em produção — `parseEnv` recusa
 * subir o processo se algum deles ainda estiver em uso com NODE_ENV=production.
 */
const DEFAULT_SECRETS = {
  JWT_SECRET: 'change-me-in-production',
  JWT_REFRESH_SECRET: 'change-me-refresh-in-production',
  COOKIE_SECRET: 'change-me-cookie-secret-please-32b',
} as const;

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(3333),
    HOST: z.string().default('0.0.0.0'),
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

    // Banco — DATABASE_URL tem prioridade. Se ausente (ou ""), usa as discretas.
    DATABASE_URL: z.preprocess(emptyAsUndefined, z.url().optional()),
    DB_HOST: z.string().default('localhost'),
    DB_PORT: z.coerce.number().int().positive().default(5432),
    DB_USER: z.string().default('postgres'),
    DB_PASS: z.string().default('postgres'),
    DB_NAME: z.string().default('app_db'),
    DB_SSL: boolFromString,
    DB_SYNCHRONIZE: boolFromString,
    DB_LOGGING: boolFromString,

    JWT_SECRET: z.string().min(8).default(DEFAULT_SECRETS.JWT_SECRET),
    JWT_EXPIRES_IN: z.string().default('15m'),
    JWT_REFRESH_SECRET: z.string().min(8).default(DEFAULT_SECRETS.JWT_REFRESH_SECRET),
    JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

    // Cookies / CORS / CSRF
    COOKIE_SECRET: z.string().min(16).default(DEFAULT_SECRETS.COOKIE_SECRET),
    COOKIE_DOMAIN: z.preprocess(emptyAsUndefined, z.string().optional()),
    COOKIE_SECURE: boolFromString, // força true em produção via shared/plugins/cookies
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

export type Env = z.infer<typeof envSchema>;

/**
 * Em produção, lista quais secrets default ainda estão em uso. Vazio = ok.
 */
function insecureDefaultSecrets(cfg: Env): string[] {
  if (cfg.NODE_ENV !== 'production') return [];
  return Object.entries(DEFAULT_SECRETS)
    .filter(([key, def]) => cfg[key as keyof typeof DEFAULT_SECRETS] === def)
    .map(([key]) => key);
}

export type ParseEnvResult = { success: true; data: Env } | { success: false; error: string };

/**
 * Parse testável da configuração — nunca chama process.exit.
 * O bootstrap abaixo é quem decide encerrar em caso de erro.
 */
export function parseEnv(source: Record<string, string | undefined> = process.env): ParseEnvResult {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    return { success: false, error: JSON.stringify(z.treeifyError(parsed.error), null, 2) };
  }

  const insecure = insecureDefaultSecrets(parsed.data);
  if (insecure.length > 0) {
    return {
      success: false,
      error:
        `Secrets default do template proibidos em produção: ${insecure.join(', ')}. ` +
        `Defina valores próprios no ambiente.`,
    };
  }

  return { success: true, data: parsed.data };
}

const result = parseEnv();

if (!result.success) {
  console.error('❌ Configuração de ambiente inválida:\n' + result.error);
  process.exit(1);
}

export const env = result.data;
