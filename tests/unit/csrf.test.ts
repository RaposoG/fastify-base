import { generateCsrfToken } from '@/shared/plugins/csrf';
import { describe, expect, it } from 'vitest';

describe('generateCsrfToken', () => {
  it('returns a url-safe base64 string', () => {
    const token = generateCsrfToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    // 32 bytes em base64url => 43 chars (sem padding)
    expect(token.length).toBe(43);
  });

  it('produces unique tokens', () => {
    const tokens = new Set(Array.from({ length: 100 }, () => generateCsrfToken()));
    expect(tokens.size).toBe(100);
  });
});
