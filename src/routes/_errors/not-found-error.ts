export class NotFoundError extends Error {
  statusCode: number;

  constructor(message?: string) {
    super(message ?? "Not Found");
    this.statusCode = 404;
  }

  toResponse() {
    return {
      statusCode: this.statusCode,
      error: "Not Found",
      message: this.message,
    };
  }
}
