import { AppError } from "./app-error";
import { Type } from "@sinclair/typebox";

export class InternalServerError extends AppError {
  constructor(message?: string) {
    super(message ?? "Internal Server Error", 500);
  }

  toResponse() {
    return {
      statusCode: this.statusCode,
      error: "Internal Server Error",
      message: this.message,
    };
  }
}

export const InternalServerErrorSchema = Type.Object({
  statusCode: Type.Literal(500),
  error: Type.Literal("Internal Server Error"),
  message: Type.String(),
});
