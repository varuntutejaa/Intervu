import type { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { hashPassword } from "../lib/password.js";

vi.mock("../repositories/usersRepository.js", () => ({
  findUserByEmail: vi.fn(),
  insertUser: vi.fn(),
}));

vi.mock("../lib/profiles.js", () => ({
  resolveActiveRole: vi.fn().mockResolvedValue(null),
  getRolesForSub: vi.fn().mockResolvedValue([]),
}));

vi.mock("../middleware/auth.js", () => ({
  setAuthCookie: vi.fn(),
  clearAuthCookie: vi.fn(),
  getAuthUser: vi.fn(),
}));

const usersRepo = await import("../repositories/usersRepository.js");
const authModule = await import("../middleware/auth.js");
const { signup, login, me, switchRole } = await import("./authService.js");

const fakeRes = {} as Response;

describe("authService — signup", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects a duplicate email with a friendly message", async () => {
    vi.mocked(usersRepo.insertUser).mockResolvedValue(false);

    await expect(signup(fakeRes, { email: "a@b.com", password: "password1" })).rejects.toMatchObject({
      status: 400,
      message: "An account with this email already exists.",
    });
    expect(authModule.setAuthCookie).not.toHaveBeenCalled();
  });

  it("rejects a password under 8 characters before touching the database", async () => {
    await expect(signup(fakeRes, { email: "a@b.com", password: "short" })).rejects.toThrow();
    expect(usersRepo.insertUser).not.toHaveBeenCalled();
  });

  it("stores a hash (never the raw password) and logs the new user in with the picked role", async () => {
    vi.mocked(usersRepo.insertUser).mockResolvedValue(true);

    const result = await signup(fakeRes, {
      email: "a@b.com",
      password: "password1",
      name: "Ada",
      role: "candidate",
    });

    const stored = vi.mocked(usersRepo.insertUser).mock.calls[0][0];
    expect(stored.password_hash).not.toContain("password1");
    expect(stored.password_hash.startsWith("scrypt$")).toBe(true);
    expect(result.user).toMatchObject({ email: "a@b.com", name: "Ada" });
    expect(authModule.setAuthCookie).toHaveBeenCalledWith(
      fakeRes,
      expect.objectContaining({ email: "a@b.com", activeRole: "candidate" }),
    );
  });
});

describe("authService — login", () => {
  beforeEach(() => vi.clearAllMocks());

  it("401s for an unknown email", async () => {
    vi.mocked(usersRepo.findUserByEmail).mockResolvedValue(null);

    await expect(login(fakeRes, { email: "a@b.com", password: "whatever" })).rejects.toMatchObject({
      status: 401,
      message: "Incorrect email or password.",
    });
  });

  it("401s for a wrong password with the same message as an unknown email", async () => {
    vi.mocked(usersRepo.findUserByEmail).mockResolvedValue({
      sub: "user-1",
      email: "a@b.com",
      name: null,
      password_hash: await hashPassword("right-password"),
    });

    await expect(login(fakeRes, { email: "a@b.com", password: "wrong-password" })).rejects.toMatchObject({
      status: 401,
      message: "Incorrect email or password.",
    });
  });

  it("trusts the role picked on the login screen as the active role", async () => {
    vi.mocked(usersRepo.findUserByEmail).mockResolvedValue({
      sub: "user-1",
      email: "a@b.com",
      name: null,
      password_hash: await hashPassword("right-password"),
    });

    const result = await login(fakeRes, { email: "a@b.com", password: "right-password", role: "recruiter" });
    expect(result).toEqual({ user: { sub: "user-1", email: "a@b.com", name: undefined } });
    expect(authModule.setAuthCookie).toHaveBeenCalledWith(
      fakeRes,
      expect.objectContaining({ sub: "user-1", activeRole: "recruiter" }),
    );
  });
});

describe("authService — me / switchRole require authentication", () => {
  beforeEach(() => vi.clearAllMocks());

  it("me() 401s when there's no session", async () => {
    vi.mocked(authModule.getAuthUser).mockReturnValue(null);
    await expect(me({} as Request)).rejects.toMatchObject({ status: 401 });
  });

  it("switchRole() 401s when there's no session", () => {
    vi.mocked(authModule.getAuthUser).mockReturnValue(null);
    expect(() => switchRole({} as Request, fakeRes, { role: "candidate" })).toThrow(
      expect.objectContaining({ status: 401 }),
    );
  });
});
