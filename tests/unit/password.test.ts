import { hashPassword, verifyPassword } from '@/shared/utils/password';
import { describe, expect, it } from 'vitest';

describe('password hashing', () => {
  it('verifies a correct password', async () => {
    const hash = await hashPassword('correct horse battery staple');
    expect(await verifyPassword('correct horse battery staple', hash)).toBe(true);
  });

  it('rejects a wrong password', async () => {
    const hash = await hashPassword('s3cr3t');
    expect(await verifyPassword('not-it', hash)).toBe(false);
  });

  it('uses a per-hash salt (no two hashes are equal)', async () => {
    const a = await hashPassword('same');
    const b = await hashPassword('same');
    expect(a).not.toBe(b);
    expect(a.startsWith('scrypt$')).toBe(true);
  });

  it('rejects malformed stored hashes', async () => {
    expect(await verifyPassword('x', 'garbage')).toBe(false);
    expect(await verifyPassword('x', 'bcrypt$salt$hash')).toBe(false);
    expect(await verifyPassword('x', '')).toBe(false);
  });

  it('fits the users.passwordHash column (varchar 255)', async () => {
    const hash = await hashPassword('whatever');
    expect(hash.length).toBeLessThanOrEqual(255);
  });
});
