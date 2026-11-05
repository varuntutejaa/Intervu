import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db.js", () => ({
  pool: { query: vi.fn() },
}));

const { pool } = await import("./db.js");
const { resolveCanonicalSub } = await import("./profiles.js");

describe("resolveCanonicalSub", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the existing profile's auth_sub when one exists for this email under a different sub", async () => {
    vi.mocked(pool.query).mockResolvedValue({ rows: [{ auth_sub: "local-uuid-1" }] } as never);

    const sub = await resolveCanonicalSub("person@example.com", "google:999");
    expect(sub).toBe("local-uuid-1");
  });

  it("falls through to the provided sub for a genuinely new email", async () => {
    vi.mocked(pool.query).mockResolvedValue({ rows: [] } as never);

    const sub = await resolveCanonicalSub("brand-new@example.com", "google:999");
    expect(sub).toBe("google:999");
  });

  it("skips the lookup entirely for an empty email", async () => {
    const sub = await resolveCanonicalSub("", "google:999");
    expect(sub).toBe("google:999");
    expect(pool.query).not.toHaveBeenCalled();
  });

  it("matches case-insensitively", async () => {
    vi.mocked(pool.query).mockResolvedValue({ rows: [{ auth_sub: "local-uuid-1" }] } as never);

    await resolveCanonicalSub("Person@Example.com", "google:999");
    expect(vi.mocked(pool.query).mock.calls[0][0]).toContain("lower(email) = lower($1)");
  });
});
