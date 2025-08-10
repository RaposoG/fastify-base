import { beforeAll, afterAll, vi } from "vitest";

// Variáveis de ambiente para testes
process.env.NODE_ENV = process.env.NODE_ENV ?? "test";
process.env.SECRET_JWT = process.env.SECRET_JWT ?? "test-secret";
process.env.DATABASE_URL = process.env.DATABASE_URL ?? "postgresql://user:pass@localhost:5432/test";
process.env.PORT = process.env.PORT ?? "3434";

// Mock do Prisma (in-memory)
// O vi.mock é hoisted, então deve ser aplicado antes dos testes importarem o app
vi.mock("@/lib/prisma", () => {
  type User = {
    id: string;
    name: string;
    email: string;
    passwordHash: string;
    createdAt: Date;
    updatedAt: Date;
  };

  const users: User[] = [];
  const { randomUUID } = require("node:crypto");

  const prisma = {
    user: {
      async findUnique({ where }: { where: { email?: string; id?: string } }) {
        if (where.email) return users.find((u) => u.email === where.email) ?? null;
        if (where.id) return users.find((u) => u.id === where.id) ?? null;
        return null;
      },
      async create({ data }: { data: { name: string; email: string; passwordHash: string } }) {
        const now = new Date();
        const item: User = {
          id: randomUUID(),
          name: data.name,
          email: data.email,
          passwordHash: data.passwordHash,
          createdAt: now,
          updatedAt: now,
        };
        users.push(item);
        return item;
      },
    },
    // No-ops para compatibilidade
    async $disconnect() {
      return;
    },
  };

  return { prisma };
});

beforeAll(async () => {
  // Setup global se necessário
});

afterAll(async () => {
  // Nada a desconectar pois o Prisma está mockado
});
