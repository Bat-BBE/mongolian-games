import { Router } from "express";
import { z } from "zod";
import { pool } from "../db.js";

export const gameRouter = Router();

const completeBody = z.object({
  email: z.string().min(3),
  stationSlug: z.string().min(1),
  gameSlug: z.string().min(1),
  result: z.enum(["win", "lose"]),
  progressPct: z.number().min(0).max(100).optional(),
});

const homeUpgradeBody = z.object({
  email: z.string().min(3),
});

const homeBuyBody = z.object({
  email: z.string().min(3),
  kind: z.enum(["sheep", "horse", "camel"]),
  qty: z.number().int().min(1).max(10),
});

function emailUid(email: string): string {
  return `local:${email.trim().toLowerCase()}`;
}

function isPlainRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function num(v: unknown, fallback: number): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

type StationProgress = {
  completedGameSlugs: string[];
};

function readStationSteps(progress: Record<string, unknown>): Record<string, StationProgress> {
  const raw = progress.stationSteps;
  if (!isPlainRecord(raw)) return {};
  const out: Record<string, StationProgress> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (!isPlainRecord(v)) continue;
    const arr = (v as Record<string, unknown>).completedGameSlugs;
    out[k] = {
      completedGameSlugs: Array.isArray(arr) ? arr.map((x) => String(x)) : [],
    };
  }
  return out;
}

function readStationVisits(progress: Record<string, unknown>): Record<string, number[]> {
  const raw = progress.stationVisits;
  if (!isPlainRecord(raw)) return {};
  const out: Record<string, number[]> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (!Array.isArray(v)) continue;
    out[k] = v.map((x) => Number(x)).filter((n) => Number.isFinite(n));
  }
  return out;
}

function computeWealthScore(profile: Record<string, unknown>): number {
  const kp = num(profile.kp, 0);
  const inv = isPlainRecord(profile.inventory) ? (profile.inventory as Record<string, unknown>) : {};
  const coins = num(inv.coins, 0);
  const gems = num(inv.gems, 0);
  const ger = isPlainRecord(profile.ger) ? (profile.ger as Record<string, unknown>) : {};
  const gerLevel = Math.max(0, Math.floor(num(ger.level, 1)));
  const ls = isPlainRecord(profile.livestock) ? (profile.livestock as Record<string, unknown>) : {};
  const sheep = Math.max(0, Math.floor(num(ls.sheep, 0)));
  const horse = Math.max(0, Math.floor(num(ls.horse, 0)));
  const camel = Math.max(0, Math.floor(num(ls.camel, 0)));

  // Simple, tunable formula (server authoritative).
  // - gems are rarer than coins
  // - livestock has large impact (game fantasy value)
  // - ger level acts as multiplier baseline
  const base =
    kp +
    coins * 1 +
    gems * 25 +
    sheep * 30 +
    horse * 160 +
    camel * 220 +
    gerLevel * 500;

  return Math.max(0, Math.floor(base));
}

function upgradeCost(gerLevel: number): { coins: number; kp: number } {
  const lvl = Math.max(1, Math.floor(gerLevel));
  return { coins: 200 + lvl * 80, kp: 60 + lvl * 15 };
}

function livestockCost(kind: "sheep" | "horse" | "camel", qty: number): { coins: number } {
  const q = Math.max(1, Math.floor(qty));
  const unit = kind === "sheep" ? 120 : kind === "horse" ? 650 : 820;
  return { coins: unit * q };
}

function rewardFor(gameSlug: string): {
  xp: number;
  kp: number;
  coins: number;
  gems: number;
  livestock?: Partial<{ sheep: number; horse: number; camel: number }>;
  gerLevelDelta?: number;
} {
  // Defaults: small progression. You can adjust per minigame.
  const base = { xp: 40, kp: 15, coins: 20, gems: 0 } as const;
  switch (gameSlug) {
    case "shagai":
      return { ...base, xp: 55, kp: 20, coins: 35, gems: 0, livestock: { sheep: 1 } };
    case "stone-guess":
      return { ...base, xp: 45, kp: 18, coins: 28, gems: 0 };
    case "four-bones":
      return { ...base, xp: 65, kp: 24, coins: 40, gems: 1 };
    default:
      return { ...base };
  }
}

/**
 * Complete a station game step. Server enforces:
 * - step ordering (station_games.sort_order)
 * - per-station weekly visits limit (2 in last 7 days)
 */
gameRouter.post("/complete", async (req, res) => {
  const parsed = completeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }

  const email = parsed.data.email.trim().toLowerCase();
  const stationSlug = parsed.data.stationSlug.trim();
  const gameSlug = parsed.data.gameSlug.trim();
  const result = parsed.data.result;

  const uid = emailUid(email);

  try {
    const userRes = await pool.query(
      `SELECT id, email, display_name, hero_id, profile, progress, created_at, updated_at
       FROM app_users WHERE firebase_uid = $1`,
      [uid],
    );
    if (userRes.rowCount === 0) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const row = userRes.rows[0] as {
      profile: unknown;
      progress: unknown;
    };

    const profile = isPlainRecord(row.profile) ? { ...(row.profile as Record<string, unknown>) } : {};
    const progress = isPlainRecord(row.progress) ? { ...(row.progress as Record<string, unknown>) } : {};

    // Weekly station limit.
    const visitsByStation = readStationVisits(progress);
    const now = Date.now();
    const windowMs = 7 * 24 * 60 * 60 * 1000;
    const cutoff = now - windowMs;
    const prevVisits = (visitsByStation[stationSlug] ?? []).filter((t) => t >= cutoff);
    if (prevVisits.length >= 2) {
      res.status(429).json({
        error: "Weekly limit reached for this station (2 plays / 7 days)",
        remainingMs: Math.max(0, Math.min(...prevVisits) + windowMs - now),
      });
      return;
    }

    // Validate step ordering using station_games.
    const sg = await pool.query(
      `SELECT g.slug
       FROM station_games sg
       INNER JOIN games g ON g.id = sg.game_id
       WHERE sg.station_slug = $1 AND g.is_available = true
       ORDER BY sg.sort_order ASC, g.sort_order ASC`,
      [stationSlug],
    );
    const ordered = (sg.rows as { slug: string }[]).map((r) => String(r.slug));
    if (ordered.length === 0) {
      res.status(404).json({ error: "No games configured for station" });
      return;
    }

    const stationSteps = readStationSteps(progress);
    const completed = new Set(stationSteps[stationSlug]?.completedGameSlugs ?? []);
    const nextRequired = ordered.find((s) => !completed.has(s)) ?? null;

    if (nextRequired && gameSlug !== nextRequired) {
      res.status(409).json({
        error: "Wrong step order",
        expected: nextRequired,
        received: gameSlug,
      });
      return;
    }

    // Record visit attempt regardless of win/lose (counts as a play).
    visitsByStation[stationSlug] = [...prevVisits, now];
    progress.stationVisits = visitsByStation;

    if (result === "win") {
      // Mark step done.
      const prev = stationSteps[stationSlug]?.completedGameSlugs ?? [];
      stationSteps[stationSlug] = {
        completedGameSlugs: [...new Set([...prev, gameSlug])],
      };
      progress.stationSteps = stationSteps;

      // If all games done, add to doneStationIds.
      const doneNow = ordered.every((s) => stationSteps[stationSlug].completedGameSlugs.includes(s));
      const doneIdsRaw = progress.doneStationIds;
      const doneIds = Array.isArray(doneIdsRaw) ? doneIdsRaw.map((x) => String(x)) : [];
      if (doneNow && !doneIds.includes(stationSlug)) {
        doneIds.push(stationSlug);
      }
      progress.doneStationIds = doneIds;

      // Rewards.
      const rwd = rewardFor(gameSlug);
      progress.xp = num(progress.xp, 0) + rwd.xp;
      progress.xpMax = num(progress.xpMax, 100);
      profile.kp = num(profile.kp, 0) + rwd.kp;

      const inv = isPlainRecord(profile.inventory) ? { ...(profile.inventory as Record<string, unknown>) } : {};
      inv.coins = num(inv.coins, 0) + rwd.coins;
      inv.gems = num(inv.gems, 0) + rwd.gems;
      profile.inventory = inv;

      const ger = isPlainRecord(profile.ger) ? { ...(profile.ger as Record<string, unknown>) } : {};
      ger.level = Math.max(1, Math.floor(num(ger.level, 1) + (rwd.gerLevelDelta ?? 0)));
      profile.ger = ger;

      const ls = isPlainRecord(profile.livestock) ? { ...(profile.livestock as Record<string, unknown>) } : {};
      const add = rwd.livestock ?? {};
      ls.sheep = Math.max(0, Math.floor(num(ls.sheep, 0) + (add.sheep ?? 0)));
      ls.horse = Math.max(0, Math.floor(num(ls.horse, 0) + (add.horse ?? 0)));
      ls.camel = Math.max(0, Math.floor(num(ls.camel, 0) + (add.camel ?? 0)));
      profile.livestock = ls;

      profile.wealthScore = computeWealthScore(profile);
    } else {
      // Small consolation: still track attempts, tiny XP.
      progress.xp = num(progress.xp, 0) + 5;
    }

    const upd = await pool.query(
      `UPDATE app_users
       SET profile = $2::jsonb, progress = $3::jsonb, updated_at = now()
       WHERE firebase_uid = $1
       RETURNING id, firebase_uid, email, display_name, hero_id, profile, progress, created_at, updated_at`,
      [uid, JSON.stringify(profile), JSON.stringify(progress)],
    );

    res.json({ user: upd.rows[0] });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Complete failed";
    res.status(500).json({ error: msg });
  }
});

gameRouter.post("/home/upgrade", async (req, res) => {
  const parsed = homeUpgradeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  const email = parsed.data.email.trim().toLowerCase();
  const uid = emailUid(email);

  try {
    const userRes = await pool.query(
      `SELECT profile, progress FROM app_users WHERE firebase_uid = $1`,
      [uid],
    );
    if (userRes.rowCount === 0) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const row = userRes.rows[0] as { profile: unknown; progress: unknown };
    const profile = isPlainRecord(row.profile) ? { ...(row.profile as Record<string, unknown>) } : {};
    const progress = isPlainRecord(row.progress) ? { ...(row.progress as Record<string, unknown>) } : {};

    const inv = isPlainRecord(profile.inventory) ? { ...(profile.inventory as Record<string, unknown>) } : {};
    const ger = isPlainRecord(profile.ger) ? { ...(profile.ger as Record<string, unknown>) } : {};
    const curLevel = Math.max(1, Math.floor(num(ger.level, 1)));
    const cost = upgradeCost(curLevel);

    const coins = num(inv.coins, 0);
    const kp = num(profile.kp, 0);
    if (coins < cost.coins || kp < cost.kp) {
      res.status(409).json({ error: "Not enough resources" });
      return;
    }

    inv.coins = coins - cost.coins;
    profile.inventory = inv;
    profile.kp = kp - cost.kp;
    ger.level = curLevel + 1;
    profile.ger = ger;
    profile.wealthScore = computeWealthScore(profile);

    const upd = await pool.query(
      `UPDATE app_users
       SET profile = $2::jsonb, progress = $3::jsonb, updated_at = now()
       WHERE firebase_uid = $1
       RETURNING id, firebase_uid, email, display_name, hero_id, profile, progress, created_at, updated_at`,
      [uid, JSON.stringify(profile), JSON.stringify(progress)],
    );
    res.json({ user: upd.rows[0] });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Upgrade failed";
    res.status(500).json({ error: msg });
  }
});

gameRouter.post("/home/buy", async (req, res) => {
  const parsed = homeBuyBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  const email = parsed.data.email.trim().toLowerCase();
  const uid = emailUid(email);
  const kind = parsed.data.kind;
  const qty = parsed.data.qty;

  try {
    const userRes = await pool.query(
      `SELECT profile, progress FROM app_users WHERE firebase_uid = $1`,
      [uid],
    );
    if (userRes.rowCount === 0) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const row = userRes.rows[0] as { profile: unknown; progress: unknown };
    const profile = isPlainRecord(row.profile) ? { ...(row.profile as Record<string, unknown>) } : {};
    const progress = isPlainRecord(row.progress) ? { ...(row.progress as Record<string, unknown>) } : {};

    const inv = isPlainRecord(profile.inventory) ? { ...(profile.inventory as Record<string, unknown>) } : {};
    const coins = num(inv.coins, 0);
    const cost = livestockCost(kind, qty);
    if (coins < cost.coins) {
      res.status(409).json({ error: "Not enough coins" });
      return;
    }
    inv.coins = coins - cost.coins;
    profile.inventory = inv;

    const ls = isPlainRecord(profile.livestock) ? { ...(profile.livestock as Record<string, unknown>) } : {};
    ls[kind] = Math.max(0, Math.floor(num(ls[kind], 0) + qty));
    profile.livestock = ls;
    profile.wealthScore = computeWealthScore(profile);

    const upd = await pool.query(
      `UPDATE app_users
       SET profile = $2::jsonb, progress = $3::jsonb, updated_at = now()
       WHERE firebase_uid = $1
       RETURNING id, firebase_uid, email, display_name, hero_id, profile, progress, created_at, updated_at`,
      [uid, JSON.stringify(profile), JSON.stringify(progress)],
    );
    res.json({ user: upd.rows[0] });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Buy failed";
    res.status(500).json({ error: msg });
  }
});

