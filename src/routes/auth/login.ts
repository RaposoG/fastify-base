import { compare } from "bcryptjs";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { BadRequestError } from "../_errors/bad-request-error";

export async function Login(app: FastifyInstance) {
	app.withTypeProvider<ZodTypeProvider>().post(
		"/auth/login",
		{
			schema: {
				tags: ["Auth"],
				summary: "Create account",
				body: z.object({
					email: z.string(),
					password: z.string().min(6),
				}),
				response: {
					200: z.object({
						token: z.string(),
					}),
				},
			},
		},
		async (request, reply) => {
			const { email, password } = request.body;

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

			const token = app.jwt.sign(
				{ sub: userExist.id }, // Aqui você pode adicionar mais informações ao payload do token, se necessário, passe informações valiosas como Role, permissions, etc.
				{
					expiresIn: "1D",
				},
			);

			return reply.status(200).send({ token });
		},
	);
}
