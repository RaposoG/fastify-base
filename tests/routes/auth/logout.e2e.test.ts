import request from "supertest";
import { randomUUID } from "node:crypto";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { buildTestApp, closeTestApp } from "../../mocks/test-utils";

describe("POST /auth/logout", () => {
  let app: Awaited<ReturnType<typeof buildTestApp>>;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  test("clears token cookie", async () => {
    const email = `${randomUUID()}@test.com`;
    const password = "123456";
    const passwordHash = await hash(password, 6);
    await prisma.user.create({ data: { name: "U", email, passwordHash } });

    const login = await request(app.server).post("/auth/login").send({ email, password }).expect(200);

    const cookies = login.headers["set-cookie"] as unknown as string[] | undefined;
    const agent = request.agent(app.server);
    if (cookies) agent.set("Cookie", cookies);

    const res = await agent.post("/auth/logout").expect(200);
    const cleared = (res.headers["set-cookie"] as unknown as string[] | undefined)?.some((c) => /token=;/.test(c) || /Max-Age=0/.test(c));
    expect(cleared).toBe(true);
  });
});
