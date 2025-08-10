import "dotenv/config";
import { Type } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";

const EnvSchema = Type.Object({
  NODE_ENV: Type.Union([Type.Literal("development"), Type.Literal("test"), Type.Literal("production")], { default: "development" }),
  PORT: Type.Number({ default: 3434 }),
  SECRET_JWT: Type.String(),
  DATABASE_URL: Type.String(),
});

function coerceEnv(input: NodeJS.ProcessEnv) {
  const coerced: Record<string, unknown> = { ...input };
  if (typeof input.PORT === "string") coerced.PORT = Number(input.PORT);
  return coerced;
}

const maybeEnv = coerceEnv(process.env);

if (!Value.Check(EnvSchema, maybeEnv)) {
  const errors = [...Value.Errors(EnvSchema, maybeEnv)].map((e) => ({
    path: e.path,
    message: e.message,
  }));
  console.error("❌ Invalid environment variables ", errors);
  throw new Error("❌ Invalid environment variables ");
}

export const env = Value.Convert(EnvSchema, maybeEnv) as {
  NODE_ENV: "development" | "test" | "production";
  PORT: number;
  SECRET_JWT: string;
  DATABASE_URL: string;
};
