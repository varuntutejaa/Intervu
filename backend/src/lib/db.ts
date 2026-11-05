import { Pool } from "pg";

// Off by default (local Postgres); set DB_SSL=true for a hosted database
// that requires TLS.
const sslEnabled = process.env.DB_SSL === "true";

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  host: process.env.PGHOST,
  port: process.env.PGPORT ? Number(process.env.PGPORT) : undefined,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  ssl: sslEnabled ? { rejectUnauthorized: false } : undefined,
});
