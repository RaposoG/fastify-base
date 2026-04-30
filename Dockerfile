# ---------- Stage 1: deps ----------
FROM oven/bun:1-alpine AS deps

WORKDIR /app
COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile --production=false

# ---------- Stage 2: runner ----------
FROM oven/bun:1-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# usuário non-root (a imagem oven/bun já inclui o user "bun")
COPY --from=deps --chown=bun:bun /app/node_modules ./node_modules
COPY --chown=bun:bun package.json bun.lockb* ./
COPY --chown=bun:bun tsconfig.json ./
COPY --chown=bun:bun src ./src

USER bun

EXPOSE 3333

# Roda migrations e sobe o servidor
CMD ["sh", "-c", "bun run src/database/run-migrations.ts && bun run src/server.ts"]
