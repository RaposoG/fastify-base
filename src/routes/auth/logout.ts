import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function Logout(app: FastifyInstance) {
	app.withTypeProvider<ZodTypeProvider>().post(
		'/auth/logout',
		{
			schema: {
				tags: ['Auth'],
				summary: 'Logout',
				response: {
					200: z.null(),
				},
				security: [{ cookieAuth: [] }],
			},
		},
		async (_request, reply) => {
			reply.clearCookie('token', { path: '/' });
			return reply.status(200).send();
		}
	);
}
