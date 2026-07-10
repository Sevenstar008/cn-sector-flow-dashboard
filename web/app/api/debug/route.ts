import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const info: Record<string, unknown> = {
    time: new Date().toISOString(),
    cwd: process.cwd(),
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    env: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV,
    },
  };

  // Check if the db file exists
  const fs = await import("node:fs");
  const path = await import("node:path");

  const candidates = [
    path.join(process.cwd(), "db", "data.db"),
    path.join("/var/task", "db", "data.db"),
    path.join("/var/task", "web", "db", "data.db"),
    path.join(process.cwd(), "..", "db", "data.db"),
  ];

  const dbPaths: Record<string, boolean> = {};
  for (const p of candidates) {
    dbPaths[p] = fs.existsSync(p);
  }
  info.dbPaths = dbPaths;

  // Try loading better-sqlite3
  try {
    const Database = (await import("better-sqlite3")).default;
    const foundPath = candidates.find((p) => fs.existsSync(p));
    if (!foundPath) {
      info.sqliteError = "No data.db found in any candidate path";
      return NextResponse.json(info, { status: 500 });
    }
    const db = new Database(`file:${foundPath}?immutable=1`, { readonly: true });
    const count = db.prepare("SELECT COUNT(*) as cnt FROM sector_flow").get();
    info.sqliteOk = true;
    info.sectorFlowCount = count;
    db.close();
  } catch (e) {
    info.sqliteOk = false;
    info.sqliteError = e instanceof Error ? e.message : String(e);
    info.sqliteStack = e instanceof Error ? e.stack : undefined;
  }

  return NextResponse.json(info);
}
