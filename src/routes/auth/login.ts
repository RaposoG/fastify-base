import { compare } from 'bcryptjs';
import type { FastifyInstance } from 'fastify';
import { prisma } from '@/lib/prisma';
import { env } from '@/env';
import { BadRequestError, BadRequestErrorSchema } from '@/shared/_errors/bad-request-error';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function Login(app: FastifyInstance) {
	app.withTypeProvider<ZodTypeProvider>().post(
		'/auth/login',
		{
			schema: {
				tags: ['Auth'],
				summary: 'Login',
				body: z.object({
					email: z.string(),
					password: z.string().min(6),
				}),
				response: {
					200: z.null(),
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
				throw new BadRequestError('Invalid email or password');
			}

			const passwordCompare = await compare(password, userExist.passwordHash);

			if (!passwordCompare) {
				throw new BadRequestError('Invalid email or password');
			}

			const token = app.jwt.sign({ sub: userExist.id }, { expiresIn: '1d' });

			reply.setCookie('token', token, {
				httpOnly: true,
				sameSite: 'lax',
				secure: env.NODE_ENV !== 'development',
				path: '/',
				maxAge: 60 * 60 * 24, // 1 day
			});

			return reply.status(200).send();
		}
	);
}
