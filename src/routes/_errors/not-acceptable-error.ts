export class NotAcceptableError extends Error {
  statusCode: number;

  constructor(message?: string) {
    super(message ?? "Not Acceptable");
    this.statusCode = 406;
  }

  toResponse() {
    return {
      statusCode: this.statusCode,
      error: "Not Acceptable",
      message: this.message,
    };
  }
}
