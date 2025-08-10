import { errorHandler } from "@/error-handler";
import { AppError } from "@/routes/_errors/app-error";

function createReply() {
  const res: any = {
    statusCode: 0,
    payload: undefined as any,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    send(payload: any) {
      this.payload = payload;
      return this;
    },
  };
  return res;
}

describe("errorHandler", () => {
  it("should format AppError", async () => {
    const err = new AppError("Something", 418);
    const reply = createReply();
    // @ts-expect-error manual call
    await errorHandler(err, {} as any, reply);
    expect(reply.statusCode).toBe(418);
    expect(reply.payload).toMatchObject({
      statusCode: 418,
      message: "Something",
    });
  });

  it("should handle validation errors shape", async () => {
    const err: any = { validation: [{ instancePath: "/x", message: "invalid" }] };
    const reply = createReply();
    await errorHandler(err as any, {} as any, reply);
    expect(reply.statusCode).toBe(400);
    expect(reply.payload?.errors?.length).toBeGreaterThan(0);
  });
});
