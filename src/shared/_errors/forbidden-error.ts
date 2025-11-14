import { AppError } from './app-error';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

export class ForbiddenError extends AppError {
	constructor(message?: string) {
		super(message ?? 'Forbidden', 403);
	}

	toResponse() {
		return {
			statusCode: this.statusCode,
			error: 'Forbidden',
			message: this.message,
		};
	}
}

export function clearAllCookies(reply: FastifyReply, request: FastifyRequest) {
	const names = Object.keys(request.cookies ?? {});
	for (const name of names) {
		reply.clearCookie(name, { path: '/' });
	}
}

export const ForbiddenErrorSchema = z.object({
	statusCode: z.literal(403),
	error: z.literal('Forbidden'),
	message: z.string(),
});
