import { AppError } from './app-error';
import { z } from 'zod';

export class BadRequestError extends AppError {
	constructor(message?: string) {
		super(message ?? 'Bad Request', 400);
	}

	toResponse() {
		return {
			statusCode: this.statusCode,
			error: 'Bad Request',
			message: this.message,
		};
	}
}

export const BadRequestErrorSchema = z.object({
	statusCode: z.literal(400),
	error: z.literal('Bad Request'),
	message: z.string(),
});
