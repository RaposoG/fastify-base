import { randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

/**
 * Hash de senha portável via scrypt (`node:crypto`).
 *
 * Usamos `node:crypto` em vez de `Bun.password` para que o mesmo código rode
 * de forma idêntica no runtime Bun (produção) e no Node (test runner Vitest).
 * scrypt é um KDF forte e memory-hard, sem dependências nativas extras.
 *
 * Formato armazenado: `scrypt$<saltHex>$<hashHex>` (cabe em varchar(255)).
 */
const scrypt = promisify(scryptCb);
const KEY_LENGTH = 64;
const SALT_BYTES = 16;
const SCHEME = 'scrypt';

export async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES).toString('hex');
  const derived = (await scrypt(plain, salt, KEY_LENGTH)) as Buffer;
  return `${SCHEME}$${salt}$${derived.toString('hex')}`;
}

export async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  const [scheme, salt, hashHex] = stored.split('$');
  if (scheme !== SCHEME || !salt || !hashHex) return false;

  const derived = (await scrypt(plain, salt, KEY_LENGTH)) as Buffer;
  const expected = Buffer.from(hashHex, 'hex');
  if (expected.length !== derived.length) return false;

  return timingSafeEqual(expected, derived);
}
