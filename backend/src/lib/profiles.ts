import { pool } from "./db.js";

// One login can hold both a candidate and a recruiter profile — these
// helpers answer "which roles has this account set up" and "which one
// should be active by default", shared by every login path (email/password,
// Google) and the switch-role endpoint.
export async function getRolesForSub(sub: string): Promise<("candidate" | "recruiter")[]> {
  const result = await pool.query("SELECT role FROM profiles WHERE auth_sub = $1", [sub]);
  return result.rows.map((row) => row.role);
}

export async function resolveActiveRole(sub: string): Promise<"candidate" | "recruiter" | null> {
  const result = await pool.query(
    "SELECT role FROM profiles WHERE auth_sub = $1 ORDER BY updated_at DESC LIMIT 1",
    [sub],
  );
  return result.rows[0]?.role ?? null;
}

// Email/password login and Google OAuth each mint their own,
// completely unrelated sub for the same person (a random UUID vs.
// "google:<id>") — with nothing to link them, the same email
// logging in via a different method looks like a brand-new account with no
// profile, and gets sent to set one up from scratch instead of landing on
// the one they already have.
//
// Since profiles are the one place email is actually recorded, resolve to
// whichever auth_sub already owns a profile under this email (preferring
// the oldest, so whichever method was used to originally create the
// account stays canonical across every later login method) instead of the
// fresh provider-specific sub. A genuinely new account (no profile yet
// under this email) falls through to the provided sub unchanged.
export async function resolveCanonicalSub(email: string, sub: string): Promise<string> {
  if (!email) return sub;
  // Case-insensitive: signup stores email exactly as typed, while Google
  // normalizes it — the same address shouldn't
  // fail to match just because of casing.
  const result = await pool.query(
    "SELECT auth_sub FROM profiles WHERE lower(email) = lower($1) AND auth_sub != $2 ORDER BY created_at ASC LIMIT 1",
    [email, sub],
  );
  return result.rows[0]?.auth_sub ?? sub;
}
