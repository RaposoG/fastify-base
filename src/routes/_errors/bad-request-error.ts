export class BadRequestError extends Error {
  statusCode: number;

  constructor(message?: string) {
    super(message ?? "Bad Request");
    this.statusCode = 400;
  }

  toResponse() {
    return {
      statusCode: this.statusCode,
      error: "Bad Request",
      message: this.message,
    };
  }
}
