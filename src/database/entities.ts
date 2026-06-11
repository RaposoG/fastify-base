// Imports RELATIVOS (sem alias `@/`): este barrel entra no grafo carregado
// pelo CLI do TypeORM via data-source.ts, que não resolve os paths do tsconfig.
import { RefreshTokenEntity } from '../modules/auth/refresh-token.entity';
import { UserEntity } from '../modules/users/user.entity';

/**
 * Registry central de entities do TypeORM.
 *
 * Registramos as classes explicitamente (em vez de um glob `*.entity.ts`)
 * porque assim o DataSource funciona igual em qualquer ambiente: runtime Bun,
 * Vitest e bundlers. Globs dependem de leitura de disco + transform on-the-fly,
 * o que quebra o `emitDecoratorMetadata` sob test runners.
 *
 * Ao criar um novo módulo, adicione a entity aqui.
 */
export const entities = [UserEntity, RefreshTokenEntity];
