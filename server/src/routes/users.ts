import { Router } from "express";
import { z } from "zod";
import { pool } from "../db.js";

export const usersRouter = Router();

const emailSchema = z.string().trim().toLowerCase().email();

function localFirebaseUid(normalizedEmail: string): string {
  return `local:${normalizedEmail}`;
}

const jsonRecord = z.record(z.string(), z.unknown());

const simpleSyncBody = z.object({
  email: z.string(),
  displayName: z.string().optional(),
  heroId: z.string().optional(),
  profile: jsonRecord.optional(),
  progress: jsonRecord.optional(),
});

/**
 * Имэйл + сонголттой профайл/прогрессыг PostgreSQL-д хадгална (үндсэн сан).
 * Firebase-д зөвхөн нөөц / бусад зүйл үлдэж болно.
 */
usersRouter.post("/simple-sync", async (req, res) => {
  const parsed = simpleSyncBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  const emailResult = emailSchema.safeParse(parsed.data.email);
  if (!emailResult.success) {
    res.status(400).json({ error: "Invalid email" });
    return;
  }
  const email = emailResult.data;
  const displayName = parsed.data.displayName?.trim() || null;
  const heroId = parsed.data.heroId?.trim() || null;
  const profile = parsed.data.profile ?? {};
  const progress = parsed.data.progress ?? {};
  const uid = localFirebaseUid(email);

  const result = await pool.query(
    `INSERT INTO app_users (firebase_uid, email, display_name, hero_id, profile, progress)
     VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb)
     ON CONFLICT (firebase_uid) DO UPDATE SET
       email = EXCLUDED.email,
       display_name = COALESCE(EXCLUDED.display_name, app_users.display_name),
       hero_id = COALESCE(EXCLUDED.hero_id, app_users.hero_id),
       profile = CASE
         WHEN EXCLUDED.profile IS DISTINCT FROM '{}'::jsonb THEN EXCLUDED.profile
         ELSE app_users.profile
       END,
       progress = CASE
         WHEN EXCLUDED.progress IS DISTINCT FROM '{}'::jsonb THEN EXCLUDED.progress
         ELSE app_users.progress
       END,
       updated_at = now()
     RETURNING id, firebase_uid, email, display_name, hero_id, profile, progress, created_at, updated_at`,
    [uid, email, displayName, heroId, JSON.stringify(profile), JSON.stringify(progress)]
  );
  res.json({ user: result.rows[0] });
});

/** Нүүр / dashboard — имэйлээр бүтэн мөр */
usersRouter.get("/game-profile", async (req, res) => {
  const raw = req.query.email;
  if (typeof raw !== "string") {
    res.status(400).json({ error: "Missing email query" });
    return;
  }
  const emailResult = emailSchema.safeParse(raw);
  if (!emailResult.success) {
    res.status(400).json({ error: "Invalid email" });
    return;
  }
  const email = emailResult.data;
  const uid = localFirebaseUid(email);

  const result = await pool.query(
    `SELECT id, firebase_uid, email, display_name, hero_id, profile, progress, created_at, updated_at
     FROM app_users WHERE firebase_uid = $1`,
    [uid]
  );
  if (result.rowCount === 0) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  const row = result.rows[0] as {
    profile: unknown;
    progress: unknown;
    [k: string]: unknown;
  };
  res.json({
    user: {
      ...row,
      profile: typeof row.profile === "string" ? JSON.parse(row.profile) : row.profile,
      progress: typeof row.progress === "string" ? JSON.parse(row.progress) : row.progress,
    },
  });
});

usersRouter.get("/simple-me", async (req, res) => {
  const raw = req.query.email;
  if (typeof raw !== "string") {
    res.status(400).json({ error: "Missing email query" });
    return;
  }
  const emailResult = emailSchema.safeParse(raw);
  if (!emailResult.success) {
    res.status(400).json({ error: "Invalid email" });
    return;
  }
  const email = emailResult.data;
  const uid = localFirebaseUid(email);

  const result = await pool.query(
    `SELECT id, firebase_uid, email, display_name, hero_id, profile, progress, created_at, updated_at
     FROM app_users WHERE firebase_uid = $1`,
    [uid]
  );
  if (result.rowCount === 0) {
    res.status(404).json({ error: "User not found; POST /api/users/simple-sync first" });
    return;
  }
  res.json({ user: result.rows[0] });
});
