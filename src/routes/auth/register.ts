import { hash } from 'bcryptjs';
import type { FastifyInstance } from 'fastify';
import { prisma } from '@/lib/prisma';
import { BadRequestError, BadRequestErrorSchema } from '@/shared/_errors/bad-request-error';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function Register(app: FastifyInstance) {
	app.withTypeProvider<ZodTypeProvider>().post(
		'/auth/register',
		{
			schema: {
				tags: ['Auth'],
				summary: 'Create account',
				body: z.object({
					name: z.string(),
					email: z.string(),
					password: z.string(),
				}),
				response: {
					201: z.null(),
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
				throw new BadRequestError('User with this email already exists');
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
