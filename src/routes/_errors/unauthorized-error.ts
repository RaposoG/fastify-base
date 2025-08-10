import { AppError } from "./app-error";
import { Type } from "@sinclair/typebox";

export class UnauthorizedError extends AppError {
  constructor(message?: string) {
    super(message ?? "Unauthorized", 401);
  }

  toResponse() {
    return {
      statusCode: this.statusCode,
      error: "Unauthorized",
      message: this.message,
    };
  }
}

export const UnauthorizedErrorSchema = Type.Object({
  statusCode: Type.Literal(401),
  error: Type.Literal("Unauthorized"),
  message: Type.String(),
});
