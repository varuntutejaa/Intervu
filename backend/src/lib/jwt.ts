import jwt from "jsonwebtoken";

// Decodes a JWT payload without verifying its signature. Only safe when the
// token was received directly from the issuer's token endpoint over a
// server-to-server HTTPS call (Google) — never do this with a
// token handed to you by an untrusted client.
export function decodeJwtPayload<T = Record<string, unknown>>(token: string): T {
  const payload = token.split(".")[1];
  const json = Buffer.from(payload, "base64url").toString("utf8");
  return JSON.parse(json);
}

// This app's own auth token — signed by us and carried in an httpOnly
// cookie, so it gets the XSS protection of a session cookie while still
// being a real, stateless JWT (no server-side session store, which also
// means logins survive a backend restart).
export type AppTokenPayload = {
  sub: string;
  email: string;
  name?: string;
  // Which of the account's profiles (candidate and/or recruiter) is
  // currently "in view" — a display preference, not itself an authorization
  // check (see requireRole, which checks the profiles table directly).
  activeRole?: "candidate" | "recruiter";
};

// Signing with a hardcoded fallback in production would mean every deploy
// without JWT_SECRET set silently trusts a secret checked into source — fail
// loudly at startup instead. Dev/test keep the fallback so local setup isn't
// blocked on generating a real secret.
function resolveJwtSecret(): string {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET must be set in production.");
  }
  return "dev-only-secret-change-me";
}

const JWT_SECRET = resolveJwtSecret();
const JWT_EXPIRES_IN = "7d";

export function signAppToken(payload: AppTokenPayload): string {
  // Callers commonly build this payload as `{ ...getAuthUser(req), activeRole }`
  // to refresh a session — but getAuthUser's return value is a *decoded* JWT,
  // which carries `exp`/`iat` claims from the original sign. jsonwebtoken
  // refuses to sign a payload that already has `exp` alongside an
  // `expiresIn` option, so strip both here rather than requiring every call
  // site to remember to.
  const { exp: _exp, iat: _iat, ...clean } = payload as AppTokenPayload & {
    exp?: number;
    iat?: number;
  };
  return jwt.sign(clean, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyAppToken(token: string): AppTokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AppTokenPayload & jwt.JwtPayload;
  } catch {
    return null;
  }
}
