import { env } from '@/config/env';
import { ConflictError, UnauthorizedError } from '@/shared/errors/app-error';
import type { FastifyInstance } from 'fastify';
import { createHash, randomBytes } from 'node:crypto';
import type { Repository } from 'typeorm';
import { LessThan } from 'typeorm';
import type { UserEntity } from '../users/user.entity';
import type { LoginInput, RegisterInput } from './auth.schema';
import type { RefreshTokenEntity } from './refresh-token.entity';

export interface AuthContext {
  userAgent?: string | null;
  ipAddress?: string | null;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  refreshExpiresIn: number;
}

export interface AccessTokenPayload {
  sub: string;
  email: string;
}

const REFRESH_TOKEN_BYTES = 48;

const sha256 = (value: string): string => createHash('sha256').update(value).digest('hex');

const parseDurationToSeconds = (value: string): number => {
  const m = /^(\d+)([smhd])$/.exec(value.trim());
  if (!m) return 900; // 15min default
  const n = Number(m[1]);
  switch (m[2]) {
    case 's':
      return n;
    case 'm':
      return n * 60;
    case 'h':
      return n * 60 * 60;
    case 'd':
      return n * 60 * 60 * 24;
    default:
      return n;
  }
};

export class AuthService {
  constructor(
    private readonly app: FastifyInstance,
    private readonly users: Repository<UserEntity>,
    private readonly refreshTokens: Repository<RefreshTokenEntity>,
  ) {}

  // ---------- Auth flows ----------

  async register(input: RegisterInput, ctx: AuthContext) {
    const exists = await this.users.findOne({ where: { email: input.email } });
    if (exists) throw new ConflictError('Email already in use');

    const passwordHash = await Bun.password.hash(input.password, {
      algorithm: 'bcrypt',
      cost: 10,
    });
    const user = await this.users.save(
      this.users.create({ name: input.name, email: input.email, passwordHash }),
    );

    const tokens = await this.issueTokens(user, ctx);
    return { user, tokens };
  }

  async login(input: LoginInput, ctx: AuthContext) {
    const user = await this.users.findOne({ where: { email: input.email } });
    if (!user) throw new UnauthorizedError('Invalid credentials');

    const ok = await Bun.password.verify(input.password, user.passwordHash);
    if (!ok) throw new UnauthorizedError('Invalid credentials');

    const tokens = await this.issueTokens(user, ctx);
    return { user, tokens };
  }

  /**
   * Rotação de refresh token.
   * - Token atual é marcado como revogado e aponta para o novo.
   * - Se o cliente tentar reutilizar um token JÁ revogado, revogamos toda a
   *   cadeia (provável vazamento) — a sessão precisa fazer login de novo.
   */
  async refresh(rawToken: string, ctx: AuthContext): Promise<TokenPair> {
    const tokenHash = sha256(rawToken);
    const stored = await this.refreshTokens.findOne({
      where: { tokenHash },
      relations: { user: true },
    });

    if (!stored) throw new UnauthorizedError('Invalid refresh token');

    if (stored.revokedAt) {
      // Reuso de token revogado → derruba a cadeia inteira.
      await this.revokeChain(stored.id);
      throw new UnauthorizedError('Refresh token reuse detected');
    }

    if (stored.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedError('Refresh token expired');
    }

    const tokens = await this.issueTokens(stored.user, ctx);

    stored.revokedAt = new Date();
    stored.replacedById = await this.findIdByHash(sha256(tokens.refreshToken));
    await this.refreshTokens.save(stored);

    return tokens;
  }

  async logout(rawToken: string): Promise<void> {
    const stored = await this.refreshTokens.findOne({
      where: { tokenHash: sha256(rawToken) },
    });
    if (stored && !stored.revokedAt) {
      stored.revokedAt = new Date();
      await this.refreshTokens.save(stored);
    }
  }

  /** Revoga todos os refresh tokens de um usuário (logout em todos os dispositivos). */
  async logoutAll(userId: string): Promise<void> {
    await this.refreshTokens
      .createQueryBuilder()
      .update()
      .set({ revokedAt: () => 'NOW()' })
      .where('userId = :userId AND revokedAt IS NULL', { userId })
      .execute();
  }

  // ---------- Internals ----------

  private async issueTokens(user: UserEntity, ctx: AuthContext): Promise<TokenPair> {
    const payload: AccessTokenPayload = { sub: user.id, email: user.email };

    const accessToken = await this.app.jwt.sign(payload, {
      expiresIn: env.JWT_EXPIRES_IN,
    });

    const refreshToken = randomBytes(REFRESH_TOKEN_BYTES).toString('base64url');
    const refreshTtlSec = parseDurationToSeconds(env.JWT_REFRESH_EXPIRES_IN);
    const expiresAt = new Date(Date.now() + refreshTtlSec * 1000);

    await this.refreshTokens.save(
      this.refreshTokens.create({
        userId: user.id,
        tokenHash: sha256(refreshToken),
        expiresAt,
        userAgent: ctx.userAgent ?? null,
        ipAddress: ctx.ipAddress ?? null,
      }),
    );

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: parseDurationToSeconds(env.JWT_EXPIRES_IN),
      refreshExpiresIn: refreshTtlSec,
    };
  }

  private async findIdByHash(hash: string): Promise<string | null> {
    const row = await this.refreshTokens.findOne({
      where: { tokenHash: hash },
      select: { id: true },
    });
    return row?.id ?? null;
  }

  /** Revoga o token informado e todos os descendentes (replacedById chain). */
  private async revokeChain(startId: string): Promise<void> {
    let currentId: string | null = startId;
    const now = new Date();
    while (currentId) {
      const node = await this.refreshTokens.findOne({ where: { id: currentId } });
      if (!node) break;
      if (!node.revokedAt) {
        node.revokedAt = now;
        await this.refreshTokens.save(node);
      }
      currentId = node.replacedById;
    }
    // Também revoga todos os ativos do mesmo user (defesa extra).
    const start = await this.refreshTokens.findOne({ where: { id: startId } });
    if (start) await this.logoutAll(start.userId);
  }

  /** Limpeza periódica de tokens expirados/revogados antigos. */
  async cleanupExpired(): Promise<number> {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const result = await this.refreshTokens.delete({ expiresAt: LessThan(cutoff) });
    return result.affected ?? 0;
  }
}
