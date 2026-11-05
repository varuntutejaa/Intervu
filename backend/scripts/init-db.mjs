// One-time (and re-runnable) setup: applies schema.sql to the database.
//
// With DATABASE_URL (e.g. Supabase), the schema goes straight into that
// database. With the discrete PG* fields, it first creates PGDATABASE if it
// doesn't exist yet. Works without psql installed locally.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import "dotenv/config";
import pg from "pg";

const { Client } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ssl = process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined;

async function connectionForSchema() {
  if (process.env.DATABASE_URL) {
    return { connectionString: process.env.DATABASE_URL, ssl };
  }

  const baseConfig = {
    host: process.env.PGHOST,
    port: process.env.PGPORT ? Number(process.env.PGPORT) : undefined,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    ssl,
  };

  const targetDb = process.env.PGDATABASE;
  if (!targetDb) {
    console.error("Set DATABASE_URL or PGDATABASE in .env");
    process.exit(1);
  }

  const adminClient = new Client({ ...baseConfig, database: "postgres" });
  await adminClient.connect();
  const { rows } = await adminClient.query("SELECT 1 FROM pg_database WHERE datname = $1", [targetDb]);
  if (rows.length === 0) {
    console.log(`Creating database "${targetDb}"...`);
    // Database names can't be parameterized — safe here since it's our own
    // config value, not user input.
    await adminClient.query(`CREATE DATABASE "${targetDb}"`);
  } else {
    console.log(`Database "${targetDb}" already exists.`);
  }
  await adminClient.end();

  return { ...baseConfig, database: targetDb };
}

const dbClient = new Client(await connectionForSchema());
await dbClient.connect();

const schemaSql = readFileSync(path.join(__dirname, "..", "schema.sql"), "utf8");
console.log("Applying schema.sql...");
await dbClient.query(schemaSql);
console.log("Done.");

await dbClient.end();
