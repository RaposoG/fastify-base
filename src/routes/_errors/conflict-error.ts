import { AppError } from "./app-error";

export class ConflictError extends AppError {
	constructor(message?: string) {
		super(message ?? "Conflict", 409);
	}

	toResponse() {
		return {
			statusCode: this.statusCode,
			error: "Conflict",
			message: this.message,
		};
	}
}
