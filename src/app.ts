import fastifyCors from "@fastify/cors";
import fastifyCookie from "@fastify/cookie";
import fastifyJwt from "@fastify/jwt";
import fastifyRateLimit from "@fastify/rate-limit";
import fastifySwagger from "@fastify/swagger";
import fastifyScalar from "@scalar/fastify-api-reference";
import { fastify, type FastifyInstance } from "fastify";
import { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import { env } from "@/env";
import { errorHandler } from "./error-handler";
import { Login } from "./routes/auth/login";
import { Register } from "./routes/auth/register";
import { Logout } from "./routes/auth/logout";
import { Me } from "./routes/auth/me";

export function createApp(): FastifyInstance {
  const app = fastify({
    logger: env.NODE_ENV === "development",
  }).withTypeProvider<TypeBoxTypeProvider>();

  app.setErrorHandler(errorHandler);

  app.register(fastifyRateLimit, {
    max: 100,
    timeWindow: "1 minute",
    keyGenerator: (req) => req.ip,
    skipOnError: true,
  });

  if (env.NODE_ENV === "development") {
    app.register(fastifySwagger, {
      openapi: {
        info: {
          title: "Api BackEndTsFull",
          description: "Api BackEndTsFull",
          version: "0.0.1",
        },
        components: {
          securitySchemes: {
            cookieAuth: {
              type: "apiKey",
              in: "cookie",
              name: "token",
            },
          },
        },
      },
    });

    app.register(fastifyScalar, {
      routePrefix: "/docs",
    });
  }

  app.register(fastifyCookie);
  app.register(fastifyJwt, {
    secret: env.SECRET_JWT,
    cookie: {
      cookieName: "token",
      signed: false,
    },
  });

  app.register(fastifyCors, {
    origin: ["http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  });

  // Auth routes
  app.register(Register);
  app.register(Login);
  app.register(Logout);
  app.register(Me);

  return app;
}
