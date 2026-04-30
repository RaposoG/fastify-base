import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(180),
  password: z.string().min(8).max(72),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const userPublicSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
});

/**
 * Resposta padrão dos endpoints de auth.
 * Os tokens **não** são retornados no body — vão em cookies HttpOnly.
 * O `csrfToken` é o que o frontend deve ler e ecoar em `X-CSRF-Token` em
 * requisições mutáveis (POST/PATCH/DELETE) — é o mesmo valor do cookie
 * `csrf_token` (double-submit pattern).
 */
export const authResponseSchema = z.object({
  user: userPublicSchema,
  csrfToken: z.string(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
