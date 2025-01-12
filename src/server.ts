import { jsonSchemaTransform, serializerCompiler, validatorCompiler, ZodTypeProvider } from "fastify-type-provider-zod";
import { fastify } from "fastify";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUI from "@fastify/swagger-ui";
import fastifyJwt from "@fastify/jwt";
import fastifyCors from "@fastify/cors";
import { env } from "@/env";
import { errorHandler } from "./error-handler";
import { createAccount } from "./routes/auth/create-account";
import { join } from "node:path";
import { readFileSync } from "node:fs";

const _logo = join(__dirname, "assets", "logoExemplo.png");
const _favIcon = join(__dirname, "assets", "logoExemplo.png");

const logo = readFileSync(_logo);
const favIcon = readFileSync(_favIcon);

const app = fastify({
  logger: env.NODE_ENV == "dev" ? true : false,
}).withTypeProvider<ZodTypeProvider>();

app.setSerializerCompiler(serializerCompiler);
app.setValidatorCompiler(validatorCompiler);

app.setErrorHandler(errorHandler);

app.register(fastifySwagger, {
  openapi: {
    info: {
      title: "Api BackEndTsFull",
      description: "Api BackEndTsFull",
      version: "0.0.1",
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  transform: jsonSchemaTransform,
});

app.register(fastifySwaggerUI, {
  routePrefix: "/docs",
  logo: {
    type: "image/png",
    content: logo,
    href: "/docs",
    target: "_blank",
  },
  theme: {
    favicon: [
      {
        filename: "favicon.png",
        rel: "icon",
        sizes: "16x16",
        type: "image/png",
        content: favIcon,
      },
    ],
  },
});

app.register(fastifyJwt, {
  secret: env.SECRET_JWT,
});

app.register(fastifyCors);

// Recomendo registrar as rotas daqui para baixo.

//Auth
app.register(createAccount);

app
  .listen({ port: env.PORT })
  .then(() => {
    console.log(`Server is running on port ${env.PORT}`);
  })
  .catch((error) => {
    console.error("Error starting server:", error);
  });
