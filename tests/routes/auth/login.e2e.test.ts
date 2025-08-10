import request from "supertest";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { buildTestApp, closeTestApp } from "../../mocks/test-utils";

describe("POST /auth/login", () => {
  let app: Awaited<ReturnType<typeof buildTestApp>>;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  test("sets cookie when credentials are valid", async () => {
    const email = `${randomUUID()}@test.com`;
    const password = "123456";
    const passwordHash = await hash(password, 6);
    await prisma.user.create({ data: { name: "U", email, passwordHash } });

    const res = await request(app.server).post("/auth/login").send({ email, password }).expect(200);

    const setCookie = res.headers["set-cookie"] as unknown as string[] | undefined;
    expect(setCookie?.some((c) => c.startsWith("token="))).toBe(true);
  });
});
