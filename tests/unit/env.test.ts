import { parseEnv } from '@/config/env';
import { describe, expect, it } from 'vitest';

const realSecrets = {
  JWT_SECRET: 'a-real-jwt-secret-value',
  JWT_REFRESH_SECRET: 'a-real-refresh-secret-value',
  COOKIE_SECRET: 'a-real-cookie-secret-value-32b',
};

describe('parseEnv', () => {
  it('applies defaults for a minimal (development) env', () => {
    const result = parseEnv({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.NODE_ENV).toBe('development');
      expect(result.data.PORT).toBe(3333);
      expect(result.data.db.kind).toBe('discrete');
    }
  });

  it('prefers DATABASE_URL over discrete vars', () => {
    const result = parseEnv({ DATABASE_URL: 'postgres://u:p@host:5432/db' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.db.kind).toBe('url');
    }
  });

  it('rejects an invalid PORT', () => {
    const result = parseEnv({ PORT: 'not-a-number' });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid DATABASE_URL', () => {
    const result = parseEnv({ DATABASE_URL: 'definitely-not-a-url' });
    expect(result.success).toBe(false);
  });

  it('treats an empty DATABASE_URL as absent (docker-compose ${VAR:-})', () => {
    const result = parseEnv({ DATABASE_URL: '' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.db.kind).toBe('discrete');
    }
  });

  it('refuses default secrets in production', () => {
    const result = parseEnv({ NODE_ENV: 'production', ...realSecrets, COOKIE_SECRET: undefined });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('COOKIE_SECRET');
    }
  });

  it('accepts production with real secrets', () => {
    const result = parseEnv({ NODE_ENV: 'production', ...realSecrets });
    expect(result.success).toBe(true);
  });

  it('coerces boolean-ish strings', () => {
    const result = parseEnv({ DB_SSL: 'true', DB_LOGGING: 'false' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.DB_SSL).toBe(true);
      expect(result.data.DB_LOGGING).toBe(false);
    }
  });
});
