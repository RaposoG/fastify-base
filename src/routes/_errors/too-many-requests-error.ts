import { AppError } from "./app-error";

export class TooManyRequestsError extends AppError {
	constructor(message?: string) {
		super(message ?? "Too Many Requests", 429);
	}

	toResponse() {
		return {
			statusCode: this.statusCode,
			error: "Too Many Requests",
			message: this.message,
		};
	}
}
