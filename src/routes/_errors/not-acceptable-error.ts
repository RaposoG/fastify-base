import { AppError } from "./app-error";
import { Type } from "@sinclair/typebox";

export class NotAcceptableError extends AppError {
  constructor(message?: string) {
    super(message ?? "Not Acceptable", 406);
  }

  toResponse() {
    return {
      statusCode: this.statusCode,
      error: "Not Acceptable",
      message: this.message,
    };
  }
}

export const NotAcceptableErrorSchema = Type.Object({
  statusCode: Type.Literal(406),
  error: Type.Literal("Not Acceptable"),
  message: Type.String(),
});
