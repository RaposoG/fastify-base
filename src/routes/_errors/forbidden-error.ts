export class ForbiddenError extends Error {
  statusCode: number;

  constructor(message?: string) {
    super(message ?? "Forbidden");
    this.statusCode = 403;
  }

  toResponse() {
    return {
      statusCode: this.statusCode,
      error: "Forbidden",
      message: this.message,
    };
  }
}
