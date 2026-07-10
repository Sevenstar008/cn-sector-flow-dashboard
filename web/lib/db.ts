import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

// In dev `npm run dev` cwd = web/. In Vercel build, rootDirectory = web/.
// The db file is inside web/db/ so it ships with the function bundle.
const DB_PATH =
  process.env.SQLITE_PATH ??
  path.join(process.cwd(), "db", "data.db");

// Vercel may place the Lambda bundle in a different cwd; also check a few
// fallback paths so the db is found regardless of runtime layout.
function resolveDbPath(): string {
  if (fs.existsSync(DB_PATH)) return DB_PATH;
  // Common Vercel serverless cwd is /var/task/
  const fallbacks = [
    path.join("/var/task", "db", "data.db"),
    path.join(process.cwd(), "..", "db", "data.db"),
    path.join(__dirname, "db", "data.db"),
    path.join(__dirname, "..", "db", "data.db"),
  ];
  for (const p of fallbacks) {
    if (fs.existsSync(p)) return p;
  }
  return DB_PATH; // let it throw with the original path for diagnostics
}

declare global {
  var __db: Database.Database | undefined;
  var __dbError: Error | undefined;
}

function open(): Database.Database {
  const dbPath = resolveDbPath();
  if (!fs.existsSync(dbPath)) {
    throw new Error(
      `SQLite file not found: ${dbPath} (cwd=${process.cwd()}, __dirname=${__dirname})`,
    );
  }
  const db = new Database(dbPath, { readonly: true });
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
  if (!global.__db) {
    try {
      global.__db = open();
    } catch (e) {
      global.__dbError = e as Error;
      throw e;
    }
  }
  return global.__db;
}
