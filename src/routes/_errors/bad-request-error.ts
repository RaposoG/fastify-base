import { AppError } from "./app-error";
import { Type } from "@sinclair/typebox";

export class BadRequestError extends AppError {
  constructor(message?: string) {
    super(message ?? "Bad Request", 400);
  }

  toResponse() {
    return {
      statusCode: this.statusCode,
      error: "Bad Request",
      message: this.message,
    };
  }
}

export const BadRequestErrorSchema = Type.Object({
  statusCode: Type.Literal(400),
  error: Type.Literal("Bad Request"),
  message: Type.String(),
});
