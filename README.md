# 🚀 ** fastify-base + Typescript**

Uma configuração simples e poderosa para criar APIs com **Fastify**, **TypeScript**, **CORS**, **Token Auth**, **Env Config**, **Swagger**, **ZodTypeProvider** e **Prisma**. Ideal para você começar rápido e fácil com o desenvolvimento de APIs escaláveis e seguras.

---

## 🌟 **Features**

- **Fastify**: Framework minimalista e super rápido para Node.js.
- **TypeScript**: Aproveite todos os benefícios de tipagem estática para um desenvolvimento mais robusto.
- **CORS**: Suporte integrado a CORS para permitir que sua API seja acessível de diferentes origens.
- **Token Auth**: Autenticação simples com tokens JWT para garantir segurança.
- **Env Config**: Variáveis de ambiente facilmente configuráveis para diferentes ambientes (desenvolvimento, produção, etc.).
- **Swagger UI**: Documentação automática da API usando o Swagger, facilitando o uso e integração da sua API.
- **ZodTypeProvider**: Validação e tipagem de dados com a poderosa biblioteca Zod, garantindo que seus dados estejam sempre corretos.
- **Prisma**: ORM poderoso para interagir facilmente com bancos de dados relacionais.

---

## ⚡ **Como Começar**

1. **Clone o repositório:**

```bash
git clone https://github.com/RaposoG/ fastify-base
cd  fastify-base
```

2. **Iniciar o projeto**

- Remova .exemple de .env.exemple e configure as variáveis, por padrão recomendo a port 3434

```bash
npm i
docker-compose up -d
npx prisma generate dev
npm run dev
```

## Acesse o Swagger
- http://localhost:3434/docs
