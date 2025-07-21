import { AppError } from "./app-error";

export class NotFoundError extends AppError {
	constructor(message?: string) {
		super(message ?? "Not Found", 404);
	}

	toResponse() {
		return {
			statusCode: this.statusCode,
			error: "Not Found",
			message: this.message,
		};
	}
}
