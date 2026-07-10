import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  // Ship the SQLite file + native binary with Vercel serverless functions.
  outputFileTracingIncludes: {
    "/**/*": [
      "./db/data.db",
      "./node_modules/better-sqlite3/build/Release/better_sqlite3.node",
    ],
  },
};

export default nextConfig;
