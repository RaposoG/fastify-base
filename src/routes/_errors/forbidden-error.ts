import { AppError } from "./app-error";
import type { FastifyReply, FastifyRequest } from "fastify";
import { Type } from "@sinclair/typebox";

export class ForbiddenError extends AppError {
  constructor(message?: string) {
    super(message ?? "Forbidden", 403);
  }

  toResponse() {
    return {
      statusCode: this.statusCode,
      error: "Forbidden",
      message: this.message,
    };
  }
}

export function clearAllCookies(reply: FastifyReply, request: FastifyRequest) {
  const names = Object.keys(request.cookies ?? {});
  for (const name of names) {
    reply.clearCookie(name, { path: "/" });
  }
}

export const ForbiddenErrorSchema = Type.Object({
  statusCode: Type.Literal(403),
  error: Type.Literal("Forbidden"),
  message: Type.String(),
});
