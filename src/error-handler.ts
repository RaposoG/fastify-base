import type { FastifyInstance } from "fastify";
import { AppError } from "./routes/_errors/app-error";
import { ForbiddenError } from "./routes/_errors/forbidden-error";
import { UnauthorizedError } from "./routes/_errors/unauthorized-error";

type FastifyErrorHandler = FastifyInstance["errorHandler"];

export const errorHandler: FastifyErrorHandler = async (error, request, reply) => {
  if (error instanceof ForbiddenError || error instanceof UnauthorizedError) {
    const cookieNames = Object.keys(request.cookies ?? {});
    for (const name of cookieNames) {
      reply.clearCookie(name, { path: "/" });
    }
  }
  if ((error as any)?.validation) {
    reply.status(400).send({
      statusCode: 400,
      error: "Validation Error",
      message: "Validation error",
      errors: (error as any).validation,
    });
    return;
  }

  if (error instanceof AppError) {
    reply.status(error.statusCode).send(error.toResponse());
    return;
  }

  console.error(error);

  return reply.status(500).send({
    statusCode: 500,
    error: "Internal Server Error",
    message: "Internal server error",
  });
};
