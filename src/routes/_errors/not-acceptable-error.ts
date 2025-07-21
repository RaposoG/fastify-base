import { AppError } from "./app-error";

export class NotAcceptableError extends AppError {
	constructor(message?: string) {
		super(message ?? "Not Acceptable", 406);
	}

	toResponse() {
		return {
			statusCode: this.statusCode,
			error: "Not Acceptable",
			message: this.message,
		};
	}
}
