export class TooManyRequestsError extends Error {
  statusCode: number;

  constructor(message?: string) {
    super(message ?? "Too Many Requests");
    this.statusCode = 429;
  }

  toResponse() {
    return {
      statusCode: this.statusCode,
      error: "Too Many Requests",
      message: this.message,
    };
  }
}
