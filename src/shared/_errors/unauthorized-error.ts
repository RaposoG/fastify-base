import { AppError } from './app-error';
import { z } from 'zod';

export class UnauthorizedError extends AppError {
	constructor(message?: string) {
		super(message ?? 'Unauthorized', 401);
	}

	toResponse() {
		return {
			statusCode: this.statusCode,
			error: 'Unauthorized',
			message: this.message,
		};
	}
}

export const UnauthorizedErrorSchema = z.object({
	statusCode: z.literal(401),
	error: z.literal('Unauthorized'),
	message: z.string(),
});
