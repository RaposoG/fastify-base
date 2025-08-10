import type { FastifyInstance } from "fastify";
import { Type } from "@sinclair/typebox";

export async function Logout(app: FastifyInstance) {
  app.post(
    "/auth/logout",
    {
      schema: {
        tags: ["Auth"],
        summary: "Logout",
        response: {
          200: Type.Null(),
        },
        security: [{ cookieAuth: [] }],
      },
    },
    async (_request, reply) => {
      reply.clearCookie("token", { path: "/" });
      return reply.status(200).send();
    }
  );
}
