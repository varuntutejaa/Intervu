import { randomUUID } from "node:crypto";
import type { Request, Response } from "express";
import { HttpError, unauthorized } from "../lib/httpError.js";
import { hashPassword, verifyPassword } from "../lib/password.js";
import { getRolesForSub, resolveActiveRole } from "../lib/profiles.js";
import { clearAuthCookie, getAuthUser, setAuthCookie } from "../middleware/auth.js";
import { findUserByEmail, insertUser } from "../repositories/usersRepository.js";
import { loginSchema, signupSchema, switchRoleSchema } from "../schemas/authSchemas.js";

type PublicUser = { sub: string; email: string; name?: string };

// Hashed once at startup so a login for an unknown email still spends the
// same time on a hash check, instead of returning early and revealing
// which emails have accounts.
const dummyHashPromise = hashPassword(randomUUID());

// Creates the account and logs the new user straight in.
export async function signup(res: Response, rawInput: unknown): Promise<{ user: PublicUser }> {
  const { email, password, name, role } = signupSchema.parse(rawInput);

  const sub = randomUUID();
  const created = await insertUser({
    sub,
    email,
    name: name || null,
    password_hash: await hashPassword(password),
  });
  if (!created) throw new HttpError(400, "An account with this email already exists.");

  const user = { sub, email, name: name || undefined };
  setAuthCookie(res, { ...user, activeRole: role });
  return { user };
}

export async function login(res: Response, rawInput: unknown): Promise<{ user: PublicUser }> {
  const { email, password, role } = loginSchema.parse(rawInput);

  const row = await findUserByEmail(email);
  const valid = await verifyPassword(password, row?.password_hash ?? (await dummyHashPromise));
  if (!row || !valid) throw new HttpError(401, "Incorrect email or password.");

  const user = { sub: row.sub, email: row.email, name: row.name ?? undefined };

  // The role picked on the login screen is trusted as the active role even
  // if this account has no profile for it yet; the frontend sends them to
  // profile setup in that case. Falls back to whichever profile exists.
  const activeRole = role ?? ((await resolveActiveRole(row.sub)) ?? undefined);

  setAuthCookie(res, { ...user, activeRole });
  return { user };
}

export function logout(res: Response): { status: string } {
  clearAuthCookie(res);
  return { status: "ok" };
}

export async function me(req: Request): Promise<{ user: PublicUser; role: string | null; roles: string[] }> {
  const authUser = getAuthUser(req);
  if (!authUser) throw unauthorized();

  const roles = await getRolesForSub(authUser.sub);
  return {
    user: { sub: authUser.sub, email: authUser.email, name: authUser.name },
    role: authUser.activeRole ?? null,
    roles,
  };
}

// Flips which profile (candidate or recruiter) is active. The target role
// doesn't need a saved profile yet: switching to it is how an existing
// account adds the other role. The active role lives in the JWT, so this
// re-signs the cookie.
export function switchRole(req: Request, res: Response, rawInput: unknown): { role: string } {
  const authUser = getAuthUser(req);
  if (!authUser) throw unauthorized();

  const { role } = switchRoleSchema.parse(rawInput);
  setAuthCookie(res, { ...authUser, activeRole: role });
  return { role };
}
