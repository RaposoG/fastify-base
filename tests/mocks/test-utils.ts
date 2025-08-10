import { createApp } from "@/app";
import type { FastifyInstance } from "fastify";

export async function buildTestApp(): Promise<FastifyInstance> {
  const app = createApp();
  await app.ready();
  return app;
}

export async function closeTestApp(app: FastifyInstance): Promise<void> {
  await app.close();
}
