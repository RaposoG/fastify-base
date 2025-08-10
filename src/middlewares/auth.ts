import type { FastifyInstance } from "fastify";
import { fastifyPlugin } from "fastify-plugin";
import { UnauthorizedError } from "../routes/_errors/unauthorized-error";

// esse middleware é responsável por verificar o token JWT e extrair o ID do usuário atual
export const auth = fastifyPlugin(async (app: FastifyInstance) => {
  app.decorateRequest("getCurrentUserId", async () => {
    return "";
  });

  app.addHook("preHandler", async (request, reply) => {
    request.getCurrentUserId = async () => {
      try {
        const { sub } = await request.jwtVerify<{ sub: string }>();
        if (!sub) {
          // Limpa todos os cookies e lança não autorizado
          for (const name of Object.keys(request.cookies ?? {})) {
            reply.clearCookie(name, { path: "/" });
          }
          throw new UnauthorizedError("Invalid token payload");
        }
        return sub;
      } catch (error) {
        console.error("Auth middleware error:", error);
        // Limpa todos os cookies e lança não autorizado
        for (const name of Object.keys(request.cookies ?? {})) {
          reply.clearCookie(name, { path: "/" });
        }
        throw new UnauthorizedError("Invalid or expired token");
      }
    };
  });
});
