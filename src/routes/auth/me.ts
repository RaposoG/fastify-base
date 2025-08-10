import type { FastifyInstance } from "fastify";
import { Type } from "@sinclair/typebox";
import { prisma } from "@/lib/prisma";
import { auth } from "@/middlewares/auth";

export async function Me(app: FastifyInstance) {
  app.register(async (app) => {
    app.register(auth);

    app.get(
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
          },
          security: [{ cookieAuth: [] }],
        },
      },
      async (request, reply) => {
        const userId = await request.getCurrentUserId();
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
          for (const name of Object.keys(request.cookies ?? {})) {
            reply.clearCookie(name, { path: "/" });
          }
          reply.status(401).send({
            statusCode: 401,
            error: "Unauthorized",
            message: "User not found",
          });
          return;
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
  });
}
