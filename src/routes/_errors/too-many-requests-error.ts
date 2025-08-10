import { AppError } from "./app-error";
import { Type } from "@sinclair/typebox";

export class TooManyRequestsError extends AppError {
  constructor(message?: string) {
    super(message ?? "Too Many Requests", 429);
  }

  toResponse() {
    return {
      statusCode: this.statusCode,
      error: "Too Many Requests",
      message: this.message,
    };
  }
}

export const TooManyRequestsErrorSchema = Type.Object({
  statusCode: Type.Literal(429),
  error: Type.Literal("Too Many Requests"),
  message: Type.String(),
});
