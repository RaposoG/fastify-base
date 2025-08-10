import { compare } from "bcryptjs";
import type { FastifyInstance } from "fastify";
import { Type } from "@sinclair/typebox";
import { prisma } from "@/lib/prisma";
import { env } from "@/env";
import { BadRequestError, BadRequestErrorSchema } from "../_errors/bad-request-error";

export async function Login(app: FastifyInstance) {
  app.post(
    "/auth/login",
    {
      schema: {
        tags: ["Auth"],
        summary: "Login",
        body: Type.Object({
          email: Type.String({ format: "email" }),
          password: Type.String({ minLength: 6 }),
        }),
        response: {
          200: Type.Null(),
          400: BadRequestErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const { email, password } = request.body as {
        email: string;
        password: string;
      };

      const userExist = await prisma.user.findUnique({
        where: { email },
      });

      if (!userExist) {
        throw new BadRequestError("Invalid email or password");
      }

      const passwordCompare = await compare(password, userExist.passwordHash);

      if (!passwordCompare) {
        throw new BadRequestError("Invalid email or password");
      }

      const token = app.jwt.sign({ sub: userExist.id }, { expiresIn: "1d" });

      reply.setCookie("token", token, {
        httpOnly: true,
        sameSite: "lax",
        secure: env.NODE_ENV !== "development",
        path: "/",
        maxAge: 60 * 60 * 24, // 1 day
      });

      return reply.status(200).send();
    }
  );
}
