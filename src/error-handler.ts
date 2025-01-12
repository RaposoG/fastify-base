import { FastifyInstance } from "fastify";
import { ZodError } from "zod";
import { BadRequestError } from "./routes/_errors/bad-request-error";
import { UnauthorizedError } from "./routes/_errors/unauthorized-error";
import { NotFoundError } from "./routes/_errors/not-found-error";
import { InternalServerError } from "./routes/_errors/internal-server-error";
import { ForbiddenError } from "./routes/_errors/forbidden-error";
import { ConflictError } from "./routes/_errors/conflict-error";
import { NotAcceptableError } from "./routes/_errors/not-acceptable-error";
import { TooManyRequestsError } from "./routes/_errors/too-many-requests-error";

type FastifyErrorHandler = FastifyInstance["errorHandler"];

export const errorHandler: FastifyErrorHandler = (error, request, reply) => {
  if (error instanceof ZodError) {
    reply.status(400).send({
      statusCode: 400,
      error: "Validation Error",
      message: "Validation error",
      errors: error.flatten().fieldErrors,
    });
    return;
  }

  if (error instanceof BadRequestError || error instanceof UnauthorizedError || error instanceof NotFoundError || error instanceof InternalServerError || error instanceof ForbiddenError || error instanceof ConflictError || error instanceof NotAcceptableError || error instanceof TooManyRequestsError) {
    reply.status(error.statusCode).send(error.toResponse());
    return;
  }

  console.error(error);

  // send error to some observability tool

  return reply.status(500).send({
    statusCode: 500,
    error: "Internal Server Error",
    message: "Internal server error",
  });
};
