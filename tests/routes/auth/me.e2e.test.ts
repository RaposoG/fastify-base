import request from "supertest";
import { randomUUID } from "node:crypto";
import { buildTestApp, closeTestApp } from "../../mocks/test-utils";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";

describe("GET /auth/me", () => {
  let app: Awaited<ReturnType<typeof buildTestApp>>;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  test("returns current user data when authenticated", async () => {
    const email = `${randomUUID()}@test.com`;
    const password = "123456";
    const passwordHash = await hash(password, 6);
    await prisma.user.create({ data: { name: "Me", email, passwordHash } });

    const login = await request(app.server).post("/auth/login").send({ email, password }).expect(200);

    const cookies = login.headers["set-cookie"] as unknown as string[] | undefined;
    const agent = request.agent(app.server);
    if (cookies) agent.set("Cookie", cookies);

    const res = await agent.get("/auth/me").expect(200);
    expect(res.body).toMatchObject({ email, name: "Me" });
  });

  test("clears cookies and returns 401 when token is invalid", async () => {
    const res = await request(app.server)
      .get("/auth/me")
      .set("Cookie", ["token=invalidtoken"]) // força token inválido
      .expect(401);

    const cleared = (res.headers["set-cookie"] as unknown as string[] | undefined)?.some((c) => /token=;/.test(c) || /Max-Age=0/.test(c));
    expect(cleared).toBe(true);
  });
});
