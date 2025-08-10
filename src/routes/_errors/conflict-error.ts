import { AppError } from "./app-error";
import { Type } from "@sinclair/typebox";

export class ConflictError extends AppError {
  constructor(message?: string) {
    super(message ?? "Conflict", 409);
  }

  toResponse() {
    return {
      statusCode: this.statusCode,
      error: "Conflict",
      message: this.message,
    };
  }
}

export const ConflictErrorSchema = Type.Object({
  statusCode: Type.Literal(409),
  error: Type.Literal("Conflict"),
  message: Type.String(),
});
