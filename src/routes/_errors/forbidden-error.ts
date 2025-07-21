import { AppError } from "./app-error";

export class ForbiddenError extends AppError {
	constructor(message?: string) {
		super(message ?? "Forbidden", 403);
	}

	toResponse() {
		return {
			statusCode: this.statusCode,
			error: "Forbidden",
			message: this.message,
		};
	}
}
