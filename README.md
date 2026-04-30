# Backend Template (Bun)

Template modular para novos projetos, rodando em **Bun**.

## Stack

- **Bun 1.x** — runtime + package manager + test runner (`Bun.password` p/ hash)
- **Fastify 5**
- **fastify-type-provider-zod** — schemas e validação ponta-a-ponta com Zod
- **TypeORM + Postgres 16**
- **Swagger/OpenAPI** auto-gerado a partir dos schemas Zod
- **Helmet + CORS**
- **Pino** (logs estruturados, pretty em dev)
- **TypeScript estrito** + path alias `@/*`
- **ESLint v9 (flat config) + Prettier**
- **Docker multi-stage** (`oven/bun`) + **docker-compose**

## Estrutura

```
src/
├── app.ts                    # builder do Fastify (plugins, hooks, módulos)
├── server.ts                 # bootstrap + graceful shutdown
├── config/
│   └── env.ts                # env Zod (DATABASE_URL ou discretas)
├── database/
│   ├── data-source.ts        # DataSource do TypeORM
│   ├── run-migrations.ts     # script de migrations no startup do container
│   └── migrations/           # arquivos gerados
├── shared/
│   ├── errors/               # AppError + handler global (Zod, fastify)
│   ├── plugins/              # database, swagger
│   └── types/fastify.d.ts    # augmentação do FastifyInstance
└── modules/
    ├── index.ts              # registry — registre módulos novos aqui
    └── users/                # módulo de exemplo (entity/schema/service/routes)
```

Cada módulo é auto-contido.

## Setup

```bash
cp .env.example .env
bun install
docker compose up -d postgres   # sobe só o banco local
bun run migration:run
bun run dev
```

- API: http://localhost:3333
- Swagger UI: http://localhost:3333/docs
- Health: http://localhost:3333/health

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

A lógica está em [src/config/env.ts](src/config/env.ts) — se `DATABASE_URL` estiver presente,
o `data-source.ts` ignora as variáveis discretas.

## Scripts

| Script | Descrição |
|---|---|
| `bun run dev` | Servidor com hot-reload (`--watch`) |
| `bun run start` | Roda o servidor |
| `bun run start:migrate` | Aplica migrations e sobe o servidor |
| `bun run migration:generate` | Gera migration a partir das mudanças de entity |
| `bun run migration:create` | Cria migration vazia |
| `bun run migration:run` | Aplica migrations pendentes |
| `bun run migration:revert` | Reverte a última migration |
| `bun run typecheck` | `tsc --noEmit` |
| `bun run lint` / `lint:fix` | ESLint |
| `bun run format` | Prettier |

## Docker

### Apenas Postgres (dev local)

```bash
docker compose up -d postgres
```

### Stack completa (API + DB)

```bash
docker compose --profile full up -d --build
```

O `Dockerfile` (multi-stage com `oven/bun:1-alpine`) roda
`bun run src/database/run-migrations.ts` antes de iniciar o servidor.

## Adicionando um novo módulo

1. Duplique [src/modules/users](src/modules/users) para `src/modules/<seu-modulo>`.
2. Ajuste entity, schemas, service e rotas.
3. Importe e registre em [src/modules/index.ts](src/modules/index.ts):

   ```ts
   await app.register(seuModuloRoutes, { prefix: '/api/v1' });
   ```

4. Gere a migration: `bun run migration:generate`.

## Convenções

- Toda validação de input/output passa pelos schemas Zod nas rotas.
- Erros de domínio extendem `AppError` — o handler global formata a resposta.
- Services recebem o `Repository` por construtor (testáveis).
- Hash de senhas via `Bun.password` (bcrypt nativo, sem deps extras).
- Nunca exponha entities cruas: cada módulo tem um `toPublic()`.
