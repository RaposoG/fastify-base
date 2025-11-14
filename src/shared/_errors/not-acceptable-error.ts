import { AppError } from './app-error';
import { z } from 'zod';

export class NotAcceptableError extends AppError {
	constructor(message?: string) {
		super(message ?? 'Not Acceptable', 406);
	}

	toResponse() {
		return {
			statusCode: this.statusCode,
			error: 'Not Acceptable',
			message: this.message,
		};
	}
}

export const NotAcceptableErrorSchema = z.object({
	statusCode: z.literal(406),
	error: z.literal('Not Acceptable'),
	message: z.string(),
});
