import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Vite 8 usa o Oxc por padrão. Desligamos para o SWC (plugin abaixo) dominar
  // o transform e emitir `decoratorMetadata` — necessário p/ entities TypeORM.
  oxc: false,
  resolve: {
    // Resolve o path alias `@/*` do tsconfig nativamente (Vite 8+).
    tsconfigPaths: true,
  },
  plugins: [
    swc.vite({
      jsc: {
        parser: { syntax: 'typescript', decorators: true },
        transform: { legacyDecorator: true, decoratorMetadata: true },
        target: 'es2022',
        keepClassNames: true,
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    setupFiles: ['tests/setup.ts'],
    // Testes de integração usam um Postgres real e compartilham schema —
    // serializa para evitar corrida entre arquivos.
    fileParallelism: false,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.entity.ts',
        'src/server.ts',
        'src/database/migrations/**',
        'src/shared/types/**',
      ],
    },
  },
});
