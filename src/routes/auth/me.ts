import type { FastifyInstance } from "fastify";
import { Type } from "@sinclair/typebox";
import { prisma } from "@/lib/prisma";
import { auth } from "@/middlewares/auth";
import { UnauthorizedError, UnauthorizedErrorSchema } from "@/routes/_errors/unauthorized-error";

export async function Me(app: FastifyInstance) {
  app.register(auth).get(
    "/auth/me",
    {
      schema: {
        tags: ["Auth"],
        summary: "Get current user",
        response: {
          200: Type.Object({
            id: Type.String(),
            name: Type.String(),
            email: Type.String({ format: "email" }),
            createdAt: Type.String(),
            updatedAt: Type.String(),
          }),
          401: UnauthorizedErrorSchema,
        },
        security: [{ cookieAuth: [] }],
      },
    },
    async (request, reply) => {
      const userId = await request.getCurrentUserId();
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new UnauthorizedError("User not found");
      }

      return reply.status(200).send({
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      });
    }
  );
}
