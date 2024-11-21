import { FastifyInstance } from "fastify";
import { ZodError } from "zod";
import { BadRequestError } from "./routes/_errors/bad-request-error";
import { UnauthorizedError } from "./routes/_errors/unauthorized-error";

type FastifyErrorHandler = FastifyInstance["errorHandler"];

export const errorHandler: FastifyErrorHandler = (error, request, reply) => {
  if (error instanceof ZodError) {
    reply.status(400).send({
      message: "Validation error",
      errors: error.flatten().fieldErrors,
    });
    return;
  }

  if (error instanceof BadRequestError) {
    reply.status(400).send({
      message: error.message,
    });
    return;
  }

  if (error instanceof UnauthorizedError) {
    reply.status(401).send({
      message: error.message,
    });
    return;
  }

  console.error(error);

  // send erro to some observability tool

  return reply.status(500).send({ mensagem: "Internal server error" });
};
