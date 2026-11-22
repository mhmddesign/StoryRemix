import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GET } from "@/app/api/cron/process-rounds/route";

describe("Cron Endpoint Security (Fail Closed)", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("rejects request with 401 when CRON_SECRET is not configured in environment", async () => {
    delete process.env.CRON_SECRET;

    const request = new Request("http://localhost:3000/api/cron/process-rounds", {
      headers: {
        authorization: "Bearer some-token",
      },
    });

    const response = await GET(request);
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toContain("Unauthorized");
  });

  it("rejects request with 401 when authorization header is missing", async () => {
    process.env.CRON_SECRET = "super-secret-cron-token";

    const request = new Request("http://localhost:3000/api/cron/process-rounds");

    const response = await GET(request);
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toContain("Unauthorized");
  });

  it("rejects request with 401 when authorization token does not match", async () => {
    process.env.CRON_SECRET = "super-secret-cron-token";

    const request = new Request("http://localhost:3000/api/cron/process-rounds", {
      headers: {
        authorization: "Bearer wrong-token",
      },
    });

    const response = await GET(request);
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toContain("Unauthorized");
  });
});
