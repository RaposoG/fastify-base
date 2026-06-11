# Backend Template (Bun)

Template modular para novos backends, rodando em **Bun**. Auth com cookies
HttpOnly, validação ponta-a-ponta com Zod, TypeORM + Postgres, testes e CI.

## Stack

- **Bun 1.2+** — runtime + package manager + bundler (roda TypeScript direto)
- **Fastify 5**
- **Zod 4** + **fastify-type-provider-zod 6** — validação e OpenAPI a partir dos schemas
- **TypeORM 1.0 + Postgres 16** — entities explícitas, migrations versionadas
- **Auth** — JWT em cookie HttpOnly assinado, refresh token com rotação + detecção de reuso, CSRF double-submit
- **@fastify/rate-limit** — limite global + estrito nas rotas de auth
- **Swagger/OpenAPI** auto-gerado · **Helmet + CORS** · **Pino** (pretty em dev)
- **TypeScript 6** estrito + path alias `@/*`
- **ESLint 9 flat config + Prettier**
- **Vitest 4** (unit + integração) · **GitHub Actions CI**
- **Docker multi-stage** (`oven/bun`) + **docker-compose**

## Estrutura

```
src/
├── app.ts                      # builder do Fastify (plugins, hooks, módulos)
├── server.ts                   # bootstrap + graceful shutdown
├── config/
│   └── env.ts                  # env Zod (parseEnv testável + guard de secrets em prod)
├── database/
│   ├── data-source.ts          # DataSource do TypeORM
│   ├── entities.ts             # registry explícito de entities (adicione aqui)
│   ├── run-migrations.ts       # roda migrations no startup do container
│   └── migrations/             # arquivos gerados (versionados)
├── shared/
│   ├── errors/                 # AppError + handler global (Zod, fastify)
│   ├── plugins/                # cookies, csrf, jwt, database, rate-limit, swagger
│   ├── utils/                  # password (scrypt), duration
│   └── types/fastify.d.ts      # augmentação do FastifyInstance
└── modules/
    ├── index.ts                # registry — registre módulos novos aqui
    ├── auth/                   # register/login/refresh/logout/me
    └── users/                  # CRUD de exemplo (entity/schema/service/routes)
tests/
├── setup.ts                    # env de teste (antes de qualquer import)
├── unit/                       # sem banco (sempre rodam)
└── integration/                # precisam de Postgres (TEST_DATABASE_URL)
```

Cada módulo é auto-contido.

## Setup

```bash
cp .env.example .env
bun install
docker compose up -d postgres     # sobe só o banco local
bun run migration:run             # cria o schema
bun run dev
```

- API: http://localhost:3333
- Swagger UI: http://localhost:3333/docs
- Health: http://localhost:3333/health

> Em **dev** você pode pular migrations usando `DB_SYNCHRONIZE=true` (TypeORM
> cria o schema a partir das entities). Em **produção** use sempre migrations.

## Configuração de banco

Aceita **duas formas**, com `DATABASE_URL` tendo prioridade:

```env
# Forma 1 (preferida)
DATABASE_URL=postgres://user:pass@host:5432/dbname

# Forma 2 (fallback se DATABASE_URL não existir)
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASS=postgres
DB_NAME=app_db

# Comuns às duas
DB_SSL=false
DB_SYNCHRONIZE=false
DB_LOGGING=false
```

UUIDs usam `gen_random_uuid()` (core do Postgres 13+) — sem extensões manuais.

## Segurança

- **Tokens só em cookies HttpOnly assinados** — o frontend nunca lê o access/refresh token (mitiga exfiltração por XSS).
- **Refresh token**: armazenado como hash SHA-256, rotacionado a cada uso, com detecção de reuso (derruba a cadeia inteira). Cookie `SameSite=Strict` e path-scoped em `/api/v1/auth`.
- **CSRF**: double-submit cookie (`csrf_token` legível + header `X-CSRF-Token`) nas rotas mutáveis autenticadas.
- **Guard de secrets em produção**: com `NODE_ENV=production`, o app **recusa subir** se `JWT_SECRET`, `JWT_REFRESH_SECRET` ou `COOKIE_SECRET` ainda estiverem nos defaults do template.
- **Rate limit**: 100 req/min global, 10 req/min nas rotas de auth.
- Senhas via **scrypt** (`node:crypto`) — portável entre Bun e Node, sem deps nativas.

## Scripts

| Script | Descrição |
|---|---|
| `bun run dev` | Servidor com hot-reload (`--watch`) |
| `bun run start` | Roda o servidor |
| `bun run start:migrate` | Aplica migrations e sobe o servidor |
| `bun run test` | Testes (Vitest) |
| `bun run test:watch` / `test:cov` | Watch / cobertura |
| `bun run migration:generate` | Gera migration a partir das mudanças de entity |
| `bun run migration:create` | Cria migration vazia |
| `bun run migration:run` / `migration:revert` | Aplica / reverte migrations |
| `bun run typecheck` | `tsc --noEmit` |
| `bun run lint` / `lint:fix` | ESLint |
| `bun run format` | Prettier |

> Os scripts de `typeorm`/migration usam `bunx --bun` para forçar o runtime Bun
> (necessário para carregar o `data-source.ts` em TypeScript).

## Testes

```bash
bun run test                                    # só unit (integração é pulada)

# Integração precisa de um Postgres real (use um banco descartável):
TEST_DATABASE_URL=postgres://postgres:postgres@localhost:5432/app_test bun run test
```

- **Unit** (`tests/unit`) — funções puras (env, password, duration, errors, csrf). Rodam sempre.
- **Integração** (`tests/integration`) — sobem o app e batem nas rotas com Postgres real. Pulam quando `TEST_DATABASE_URL` não está definido; o CI provê o banco.

## Docker

### Apenas Postgres (dev local)

```bash
docker compose up -d postgres
```

### Stack completa (API + DB)

Defina os secrets no `.env` primeiro (o compose exige `JWT_SECRET`,
`JWT_REFRESH_SECRET`, `COOKIE_SECRET`):

```bash
docker compose --profile full up -d --build
```

O `Dockerfile` (multi-stage, `oven/bun:1-alpine`) instala só dependências de
produção e roda as migrations antes de iniciar o servidor.

## Adicionando um novo módulo

1. Duplique [src/modules/users](src/modules/users) para `src/modules/<seu-modulo>`.
2. Ajuste entity, schemas, service e rotas.
3. Registre a entity em [src/database/entities.ts](src/database/entities.ts).
4. Registre as rotas em [src/modules/index.ts](src/modules/index.ts):

   ```ts
   await app.register(seuModuloRoutes, { prefix: '/api/v1' });
   ```

5. Gere a migration: `bun run migration:generate`.

## Convenções

- Toda validação de input/output passa pelos schemas Zod nas rotas.
- Erros de domínio extendem `AppError` — o handler global formata a resposta.
- Services recebem o `Repository` por construtor (testáveis).
- Entities são registradas explicitamente (não via glob) — funciona igual em Bun, Vitest e bundlers.
- Nunca exponha entities cruas: cada módulo tem um `toPublic()`.
