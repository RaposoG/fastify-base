import { AppError } from "./app-error";
import { Type } from "@sinclair/typebox";

export class NotFoundError extends AppError {
  constructor(message?: string) {
    super(message ?? "Not Found", 404);
  }

  toResponse() {
    return {
      statusCode: this.statusCode,
      error: "Not Found",
      message: this.message,
    };
  }
}

export const NotFoundErrorSchema = Type.Object({
  statusCode: Type.Literal(404),
  error: Type.Literal("Not Found"),
  message: Type.String(),
});
