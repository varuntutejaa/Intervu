import { pool } from "../lib/db.js";

export type UserRow = {
  sub: string;
  email: string;
  name: string | null;
  password_hash: string;
};

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const result = await pool.query<UserRow>(
    "SELECT sub, email, name, password_hash FROM users WHERE lower(email) = lower($1)",
    [email],
  );
  return result.rows[0] ?? null;
}

// Returns false when the email is already taken (unique index on lower(email)).
export async function insertUser(user: UserRow): Promise<boolean> {
  const result = await pool.query(
    `INSERT INTO users (sub, email, name, password_hash) VALUES ($1, $2, $3, $4)
     ON CONFLICT DO NOTHING RETURNING sub`,
    [user.sub, user.email, user.name, user.password_hash],
  );
  return (result.rowCount ?? 0) > 0;
}
