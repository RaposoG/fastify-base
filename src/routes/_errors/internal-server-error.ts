import { AppError } from "./app-error";

export class InternalServerError extends AppError {
	constructor(message?: string) {
		super(message ?? "Internal Server Error", 500);
	}

	toResponse() {
		return {
			statusCode: this.statusCode,
			error: "Internal Server Error",
			message: this.message,
		};
	}
}
