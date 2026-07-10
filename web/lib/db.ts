import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

// In dev `npm run dev` cwd = web/. In Vercel build, rootDirectory = web/.
// The db file is inside web/db/ so it ships with the function bundle.
const DB_PATH =
  process.env.SQLITE_PATH ??
  path.join(process.cwd(), "db", "data.db");

declare global {
  var __db: Database.Database | undefined;
}

function open(): Database.Database {
  // data.db may not exist on first deploy before ingest runs.
  if (!fs.existsSync(DB_PATH)) {
    throw new Error(`SQLite file not found: ${DB_PATH}`);
  }
  const db = new Database(DB_PATH, { readonly: true });
  // Only set WAL in dev (writable filesystem). Vercel's serverless FS is
  // read-only, so WAL would throw. readonly mode inherits the journal mode
  // already baked into the file.
  if (process.env.NODE_ENV !== "production") {
    try {
      db.pragma("journal_mode = WAL");
    } catch {
      // ignore — not critical for readonly access
    }
  }
  return db;
}

export function getDb(): Database.Database {
  if (!global.__db) global.__db = open();
  return global.__db;
}
