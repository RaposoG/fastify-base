export class AppError extends Error {
	statusCode: number;

	constructor(message: string, statusCode: number) {
		super(message);
		this.statusCode = statusCode;
	}

	toResponse() {
		return {
			statusCode: this.statusCode,
			error: this.constructor.name
				.replace("Error", "")
				.replace(/([A-Z])/g, " $1")
				.trim(),
			message: this.message,
		};
	}
}
