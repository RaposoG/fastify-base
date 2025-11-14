import { AppError } from './app-error';
import { z } from 'zod';

export class InternalServerError extends AppError {
	constructor(message?: string) {
		super(message ?? 'Internal Server Error', 500);
	}

	toResponse() {
		return {
			statusCode: this.statusCode,
			error: 'Internal Server Error',
			message: this.message,
		};
	}
}

export const InternalServerErrorSchema = z.object({
	statusCode: z.literal(500),
	error: z.literal('Internal Server Error'),
	message: z.string(),
});
