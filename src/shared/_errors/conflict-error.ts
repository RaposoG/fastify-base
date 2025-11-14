import { AppError } from './app-error';
import { z } from 'zod';

export class ConflictError extends AppError {
	constructor(message?: string) {
		super(message ?? 'Conflict', 409);
	}

	toResponse() {
		return {
			statusCode: this.statusCode,
			error: 'Conflict',
			message: this.message,
		};
	}
}

export const ConflictErrorSchema = z.object({
	statusCode: z.literal(409),
	error: z.literal('Conflict'),
	message: z.string(),
});
