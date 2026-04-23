import { Router } from "express";
import { pool } from "../db.js";

export const leaderboardRouter = Router();

function displayNameOrMasked(
  displayName: string | null,
  email: string,
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

leaderboardRouter.get("/", async (req, res) => {
  try {
    const forEmailRaw =
      typeof req.query.email === "string" ? req.query.email.trim() : "";
    const forEmail = forEmailRaw.toLowerCase();

    const result = await pool.query(
      `SELECT id, display_name, email, hero_id,
              COALESCE((profile->>'wealthScore')::int, (profile->>'kp')::int, (progress->>'xp')::int, 0) AS score,
              COALESCE((progress->>'xp')::int, 0) AS xp,
              COALESCE((profile->>'kp')::int, 0) AS kp,
              profile->'livestock' AS livestock,
              profile->'ger' AS ger
       FROM app_users
       ORDER BY COALESCE((profile->>'wealthScore')::int, (profile->>'kp')::int, (progress->>'xp')::int, 0) DESC NULLS LAST
       LIMIT 50`,
    );
    const entries = result.rows.map((r, i) => {
      const emailNorm = String(r.email ?? "").trim().toLowerCase();
      return {
        rank: i + 1,
        name: displayNameOrMasked(
          r.display_name as string | null,
          String(r.email ?? ""),
        ),
        xp: Number(r.score) || 0,
        hero_id: r.hero_id as string | null,
        is_you: Boolean(forEmail && emailNorm === forEmail),
        meta: {
          rawXp: Number(r.xp) || 0,
          kp: Number(r.kp) || 0,
          livestock: r.livestock ?? null,
          ger: r.ger ?? null,
        },
      };
    });
    res.json({ entries });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Query failed";
    res.status(500).json({ error: msg });
  }
});
