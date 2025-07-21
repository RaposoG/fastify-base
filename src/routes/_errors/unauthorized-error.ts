import { AppError } from "./app-error";

export class UnauthorizedError extends AppError {
	constructor(message?: string) {
		super(message ?? "Unauthorized", 401);
	}

	toResponse() {
		return {
			statusCode: this.statusCode,
			error: "Unauthorized",
			message: this.message,
		};
	}
}
