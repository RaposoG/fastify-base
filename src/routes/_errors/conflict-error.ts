export class ConflictError extends Error {
  statusCode: number;

  constructor(message?: string) {
    super(message ?? "Conflict");
    this.statusCode = 409;
  }

  toResponse() {
    return {
      statusCode: this.statusCode,
      error: "Conflict",
      message: this.message,
    };
  }
}
