import { Router } from "express";
import { pool } from "../db.js";

export const leaderboardRouter = Router();

function displayNameOrMasked(
  displayName: string | null,
  email: string
): string {
  const d = displayName?.trim();
  if (d) return d;
  const at = email.indexOf("@");
  if (at <= 0) return "—";
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  const prefix = local.slice(0, Math.min(2, local.length));
  return `${prefix}•••@${domain}`;
}

/**
 * XP-ээр эрэмбэлсэн жагсаалт (progress.xp).
 */
leaderboardRouter.get("/", async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, display_name, email, hero_id,
              COALESCE((progress->>'xp')::int, 0) AS xp
       FROM app_users
       ORDER BY COALESCE((progress->>'xp')::int, 0) DESC NULLS LAST
       LIMIT 50`
    );
    const entries = result.rows.map((r, i) => ({
      rank: i + 1,
      name: displayNameOrMasked(
        r.display_name as string | null,
        String(r.email ?? "")
      ),
      xp: Number(r.xp) || 0,
      hero_id: r.hero_id as string | null,
    }));
    res.json({ entries });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Query failed";
    res.status(500).json({ error: msg });
  }
});
