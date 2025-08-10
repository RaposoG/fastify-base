import request from "supertest";
import { randomUUID } from "node:crypto";
import { buildTestApp, closeTestApp } from "../../mocks/test-utils";

describe("POST /auth/register", () => {
  let app: Awaited<ReturnType<typeof buildTestApp>>;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  test("creates a new user", async () => {
    const email = `${randomUUID()}@test.com`;
    const res = await request(app.server).post("/auth/register").send({ name: "Tester", email, password: "123456" });

    expect(res.status).toBe(201);
  });
});
