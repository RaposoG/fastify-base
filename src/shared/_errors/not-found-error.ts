import { AppError } from './app-error';
import { z } from 'zod';

export class NotFoundError extends AppError {
	constructor(message?: string) {
		super(message ?? 'Not Found', 404);
	}

	toResponse() {
		return {
			statusCode: this.statusCode,
			error: 'Not Found',
			message: this.message,
		};
	}
}

export const NotFoundErrorSchema = z.object({
	statusCode: z.literal(404),
	error: z.literal('Not Found'),
	message: z.string(),
});
