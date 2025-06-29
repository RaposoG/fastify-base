import { jsonSchemaTransform, serializerCompiler, validatorCompiler, ZodTypeProvider } from "fastify-type-provider-zod";
import { fastify } from "fastify";
import fastifySwagger from "@fastify/swagger";
import fastifyScalar from "@scalar/fastify-api-reference";
import fastifyJwt from "@fastify/jwt";
import fastifyCors from "@fastify/cors";
import fastifyRateLimit from "@fastify/rate-limit";
import { env } from "@/env";
import { errorHandler } from "./error-handler";
import os from "os";
import { Register } from "./routes/auth/register";
import { Login } from "./routes/auth/login";

const app = fastify({
  logger: env.NODE_ENV == "development" ? true : false,
}).withTypeProvider<ZodTypeProvider>();

app.setSerializerCompiler(serializerCompiler);
app.setValidatorCompiler(validatorCompiler);

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

  app.register(fastifyScalar, {
    routePrefix: "/docs",
  });
}

app.register(fastifyJwt, {
  secret: env.SECRET_JWT,
});

app.register(fastifyCors);

//Auth
app.register(Register);
app.register(Login);

function getNetworkAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses: { name: string; address: string }[] = [];

  for (const name in interfaces) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === "IPv4" && !iface.internal) {
        addresses.push({ name, address: iface.address });
      }
    }
  }

  return addresses;
}

app
  .listen({ port: env.PORT, host: "0.0.0.0" }) // 0.0.0.0 coloca o servidor para escutar em todas as interfaces de rede, use com cautela em ambientes de produção
  .then(() => {
    const networkAddresses = getNetworkAddresses();

    console.log(`🚀 Server is running on port ${env.PORT}`);

    console.log("Server is available at the following addresses:");

    networkAddresses.forEach(({ name, address }) => {
      console.log(`- ${name}: http://${address}:${env.PORT}`);
    });
  })
  .catch((error) => {
    console.error("❌ Server failed to start", error);
  });
