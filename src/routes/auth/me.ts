import type { FastifyInstance } from 'fastify';
import { prisma } from '@/lib/prisma';
import { auth } from '@/middlewares/auth';
import { UnauthorizedError, UnauthorizedErrorSchema } from '@/shared/_errors/unauthorized-error';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function Me(app: FastifyInstance) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.get(
			'/auth/me',
			{
				schema: {
					tags: ['Auth'],
					summary: 'Get current user',
					response: {
						200: z.object({
							id: z.string(),
							name: z.string(),
							email: z.string().email(),
							createdAt: z.string(),
							updatedAt: z.string(),
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
					throw new UnauthorizedError('User not found');
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
