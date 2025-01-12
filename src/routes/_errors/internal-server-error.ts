
export class InternalServerError extends Error {
  statusCode: number;

  constructor(message?: string) {
    super(message ?? "Internal Server Error");
    this.statusCode = 500;
  }

  toResponse() {
    return {
      statusCode: this.statusCode,
      error: "Internal Server Error",
      message: this.message,
    };
  }
}