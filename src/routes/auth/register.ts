import { hash } from "bcryptjs";
import type { FastifyInstance } from "fastify";
import { Type } from "@sinclair/typebox";
import { prisma } from "@/lib/prisma";
import { BadRequestError, BadRequestErrorSchema } from "../_errors/bad-request-error";

export async function Register(app: FastifyInstance) {
  app.post(
    "/auth/register",
    {
      schema: {
        tags: ["Auth"],
        summary: "Create account",
        body: Type.Object({
          name: Type.String(),
          email: Type.String({ format: "email" }),
          password: Type.String({ minLength: 6 }),
        }),
        response: {
          201: Type.Null(),
          400: BadRequestErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const { name, email, password } = request.body as {
        name: string;
        email: string;
        password: string;
      };

      const userWithSameEmail = await prisma.user.findUnique({
        where: { email },
      });

      if (userWithSameEmail) {
        throw new BadRequestError("User with this email already exists");
      }

      const passwordHash = await hash(password, 6);

      await prisma.user.create({
        data: {
          name,
          email,
          passwordHash,
        },
      });

      return reply.status(201).send();
    }
  );
}
