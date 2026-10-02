import pg from "pg";
import { env } from "./config.js";

function databaseUrlWithExplicitSslMode(urlStr: string): string {
  try {
    const u = new URL(urlStr);
    if (u.hostname === "localhost" || u.hostname === "127.0.0.1") {
      return urlStr;
    }
    if (u.searchParams.has("sslmode")) return urlStr;
    u.searchParams.set("sslmode", "require");
    return u.toString();
  } catch {
    return urlStr;
  }
}

export const pool = new pg.Pool({
  connectionString: databaseUrlWithExplicitSslMode(env.DATABASE_URL),
  max: 10,
  connectionTimeoutMillis: 8_000,
  idleTimeoutMillis: 30_000,
});

export async function queryDbHealth(): Promise<boolean> {
  const client = await pool.connect();
  try {
    await client.query("SELECT 1");
    return true;
  } finally {
    client.release();
  }
}
