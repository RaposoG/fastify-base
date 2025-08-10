import type { FastifyInstance } from "fastify";
import { AppError } from "./routes/_errors/app-error";

type FastifyErrorHandler = FastifyInstance["errorHandler"];

export const errorHandler: FastifyErrorHandler = async (error, _, reply) => {
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
