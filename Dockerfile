# ---------- Stage 1: deps (apenas dependências de produção) ----------
FROM oven/bun:1-alpine AS deps

WORKDIR /app
COPY package.json bun.lock ./
# --production omite devDeps (vitest, swc, eslint, tsc): imagem final enxuta.
# Bun roda TypeScript direto, então não há passo de build.
RUN bun install --frozen-lockfile --production

# ---------- Stage 2: runner ----------
FROM oven/bun:1-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# usuário non-root (a imagem oven/bun já inclui o user "bun")
COPY --from=deps --chown=bun:bun /app/node_modules ./node_modules
COPY --chown=bun:bun package.json bun.lock ./
COPY --chown=bun:bun tsconfig.json ./
COPY --chown=bun:bun src ./src

USER bun

EXPOSE 3333

# Healthcheck bate no /health usando o fetch nativo do Bun (sem curl na imagem).
HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 \
  CMD bun -e "fetch('http://127.0.0.1:'+(process.env.PORT||3333)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Roda migrations pendentes e sobe o servidor.
CMD ["sh", "-c", "bun run src/database/run-migrations.ts && bun run src/server.ts"]
