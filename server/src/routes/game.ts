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
  kind: z.enum(["sheep", "goat", "cow", "horse", "camel"]),
  qty: z.number().int().min(1).max(10),
});

const homeExchangeGemsBody = z.object({
  email: z.string().min(3),
  gems: z.number().int().min(1).max(500),
});

const claimRankChestBody = z.object({
  email: z.string().min(3),
});

/** lib/homeEconomy.ts WEALTH_COINS_PER_GEM-тэй ижил байх ёстой */
const GEMS_TO_COINS_EXCHANGE_RATE = 25;

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

function readStationSteps(
  progress: Record<string, unknown>,
): Record<string, StationProgress> {
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

function readStationGameVisits(
  progress: Record<string, unknown>,
): Record<string, Record<string, number[]>> {
  const raw = progress.stationGameVisits;
  if (!isPlainRecord(raw)) return {};
  const out: Record<string, Record<string, number[]>> = {};
  for (const [stationKey, stationVal] of Object.entries(raw)) {
    if (!isPlainRecord(stationVal)) continue;
    const inner: Record<string, number[]> = {};
    for (const [gameKey, arr] of Object.entries(stationVal)) {
      if (!Array.isArray(arr)) continue;
      inner[gameKey] = arr
        .map((x) => Number(x))
        .filter((n) => Number.isFinite(n));
    }
    out[stationKey] = inner;
  }
  return out;
}

/**
 * Нийт үнэлгээ (leaderboard `wealthScore`) — хэт том тоо гарч ирэхгүй байхын тулд
 * KP/зоос/гэрийн хувь нэмэгдлийг хязгаарлаж, жингүүдийг дундаж хэмжээнд тааруулсан.
 */
function computeWealthScore(profile: Record<string, unknown>): number {
  const kpRaw = num(profile.kp, 0);
  const inv = isPlainRecord(profile.inventory)
    ? (profile.inventory as Record<string, unknown>)
    : {};
  const coinsRaw = num(inv.coins, 0);
  const gems = num(inv.gems, 0);
  const ger = isPlainRecord(profile.ger)
    ? (profile.ger as Record<string, unknown>)
    : {};
  const gerLevel = Math.max(0, Math.floor(num(ger.level, 1)));
  const ls = isPlainRecord(profile.livestock)
    ? (profile.livestock as Record<string, unknown>)
    : {};
  const sheep = Math.max(0, Math.floor(num(ls.sheep, 0)));
  const goat = Math.max(0, Math.floor(num(ls.goat, 0)));
  const cow = Math.max(0, Math.floor(num(ls.cow, 0)));
  const horse = Math.max(0, Math.floor(num(ls.horse, 0)));
  const camel = Math.max(0, Math.floor(num(ls.camel, 0)));

  const kpPart = Math.floor(Math.min(kpRaw, 12_000) / 8);
  const coinsPart = Math.floor(Math.min(coinsRaw, 80_000) / 2);

  const base =
    kpPart +
    coinsPart +
    gems * 10 +
    sheep * 18 +
    goat * 16 +
    cow * 58 +
    horse * 95 +
    camel * 130 +
    Math.min(gerLevel, 50) * 36;

  return Math.max(0, Math.floor(base));
}

/** `lib/homeEconomy.ts` `gerUpgradeCost`-тай ижил байх ёстой */
function upgradeCost(gerLevel: number): { coins: number; kp: number } {
  const lvl = Math.max(1, Math.floor(gerLevel));
  return { coins: 130 + lvl * 52, kp: 42 + lvl * 11 };
}

/** `lib/homeEconomy.ts` LIVESTOCK_COIN_PRICES-тай ижил */
function livestockCost(
  kind: "sheep" | "goat" | "cow" | "horse" | "camel",
  qty: number,
): { coins: number } {
  const q = Math.max(1, Math.floor(qty));
  const unit =
    kind === "sheep"
      ? 85
      : kind === "goat"
        ? 78
        : kind === "cow"
          ? 300
          : kind === "horse"
            ? 480
            : 600;
  return { coins: unit * q };
}

/** Ялагчид олгох үндсэн шагнал. Эрдэнийн чулууг зөвхөн өртөөний 2 тоглоомыг анх бүрэн ялсны урамшууллаар өгнө. */
function rewardFor(gameSlug: string): {
  xp: number;
  kp: number;
  coins: number;
  gems: number;
  livestock?: Partial<{
    sheep: number;
    goat: number;
    cow: number;
    horse: number;
    camel: number;
  }>;
  gerLevelDelta?: number;
} {
  const base = { xp: 14, kp: 6, coins: 12, gems: 0 } as const;
  switch (gameSlug) {
    case "shagai":
      return {
        ...base,
        xp: 18,
        kp: 9,
        coins: 17,
        gems: 0,
        livestock: { sheep: 1 },
      };
    case "stone-guess":
      return { ...base, xp: 16, kp: 7, coins: 15, gems: 0 };
    case "four-bones":
      return { ...base, xp: 22, kp: 10, coins: 20, gems: 0 };
    case "horse-race":
      return {
        ...base,
        xp: 24,
        kp: 12,
        coins: 22,
        gems: 0,
        livestock: { horse: 1 },
      };
    case "shagai-guess":
      return { ...base, xp: 20, kp: 9, coins: 18, gems: 0 };
    case "seven-shagai":
      return { ...base, xp: 22, kp: 10, coins: 19, gems: 0 };
    case "puzzle":
      return { ...base, xp: 16, kp: 7, coins: 14, gems: 0 };
    case "modon-onis":
      return { ...base, xp: 18, kp: 8, coins: 16, gems: 0 };
    default:
      return { ...base };
  }
}

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

    const profile = isPlainRecord(row.profile)
      ? { ...(row.profile as Record<string, unknown>) }
      : {};
    const progress = isPlainRecord(row.progress)
      ? { ...(row.progress as Record<string, unknown>) }
      : {};

    const now = Date.now();
    const windowMs = 7 * 24 * 60 * 60 * 1000;
    const cutoff = now - windowMs;

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

    if (!ordered.includes(gameSlug)) {
      res.status(400).json({ error: "Game not available at this station" });
      return;
    }

    const visitsByGame = readStationGameVisits(progress);
    const prevForGame = (visitsByGame[stationSlug]?.[gameSlug] ?? []).filter(
      (t) => t >= cutoff,
    );
    if (prevForGame.length >= 2) {
      res.status(429).json({
        error: "Weekly limit reached for this game (2 plays / 7 days)",
        remainingMs: Math.max(0, Math.min(...prevForGame) + windowMs - now),
      });
      return;
    }

    const stationSteps = readStationSteps(progress);

    const nextForStation = {
      ...(visitsByGame[stationSlug] ?? {}),
      [gameSlug]: [...prevForGame, now],
    };
    progress.stationGameVisits = {
      ...visitsByGame,
      [stationSlug]: nextForStation,
    };

    if (result === "win") {
      const prev = stationSteps[stationSlug]?.completedGameSlugs ?? [];
      stationSteps[stationSlug] = {
        completedGameSlugs: [...new Set([...prev, gameSlug])],
      };
      progress.stationSteps = stationSteps;

      const doneNow = ordered.every((s) =>
        stationSteps[stationSlug].completedGameSlugs.includes(s),
      );
      const doneIdsRaw = progress.doneStationIds;
      const doneIds = Array.isArray(doneIdsRaw)
        ? doneIdsRaw.map((x) => String(x))
        : [];
      const stationFirstFullClear =
        doneNow && !doneIds.includes(stationSlug);
      if (stationFirstFullClear) {
        doneIds.push(stationSlug);
      }
      progress.doneStationIds = doneIds;
      const rwd = rewardFor(gameSlug);
      progress.xp = num(progress.xp, 0) + rwd.xp;
      progress.xpMax = num(progress.xpMax, 100);
      profile.kp = num(profile.kp, 0) + rwd.kp;

      const inv = isPlainRecord(profile.inventory)
        ? { ...(profile.inventory as Record<string, unknown>) }
        : {};
      inv.coins = num(inv.coins, 0) + rwd.coins;
      const gemBonus = stationFirstFullClear ? 2 : 0;
      inv.gems = num(inv.gems, 0) + rwd.gems + gemBonus;
      profile.inventory = inv;

      const ger = isPlainRecord(profile.ger)
        ? { ...(profile.ger as Record<string, unknown>) }
        : {};
      ger.level = Math.max(
        1,
        Math.floor(num(ger.level, 1) + (rwd.gerLevelDelta ?? 0)),
      );
      profile.ger = ger;

      const ls = isPlainRecord(profile.livestock)
        ? { ...(profile.livestock as Record<string, unknown>) }
        : {};
      const add = rwd.livestock ?? {};
      ls.sheep = Math.max(0, Math.floor(num(ls.sheep, 0) + (add.sheep ?? 0)));
      ls.goat = Math.max(0, Math.floor(num(ls.goat, 0) + (add.goat ?? 0)));
      ls.cow = Math.max(0, Math.floor(num(ls.cow, 0) + (add.cow ?? 0)));
      ls.horse = Math.max(0, Math.floor(num(ls.horse, 0) + (add.horse ?? 0)));
      ls.camel = Math.max(0, Math.floor(num(ls.camel, 0) + (add.camel ?? 0)));
      profile.livestock = ls;

      profile.wealthScore = computeWealthScore(profile);
    } else {
      progress.xp = num(progress.xp, 0) + 1;
      const LOSE_PLAY_COINS = 10;
      const inv = isPlainRecord(profile.inventory)
        ? { ...(profile.inventory as Record<string, unknown>) }
        : {};
      inv.coins = num(inv.coins, 0) + LOSE_PLAY_COINS;
      profile.inventory = inv;
      profile.wealthScore = computeWealthScore(profile);
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

/** Урамшууллын хувь (xp / xpMax) 100% хүрмэгц авдар — 1 эрдэнэ эсвэл КП эсвэл зоос */
gameRouter.post("/claim-rank-chest", async (req, res) => {
  const parsed = claimRankChestBody.safeParse(req.body);
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
    const profile = isPlainRecord(row.profile)
      ? { ...(row.profile as Record<string, unknown>) }
      : {};
    const progress = isPlainRecord(row.progress)
      ? { ...(row.progress as Record<string, unknown>) }
      : {};

    const xpMax = Math.max(1, Math.floor(num(progress.xpMax, 100)));
    let xp = num(progress.xp, 0);
    if (xp < xpMax) {
      res.status(409).json({ error: "Progress bar not full yet" });
      return;
    }

    const roll = Math.random();
    let reward: { kind: "gem" | "kp" | "coins"; amount: number };

    if (roll < 0.28) {
      reward = { kind: "gem", amount: 1 };
      const inv = isPlainRecord(profile.inventory)
        ? { ...(profile.inventory as Record<string, unknown>) }
        : {};
      inv.gems = num(inv.gems, 0) + 1;
      profile.inventory = inv;
    } else if (roll < 0.62) {
      const kpAmt = 20 + Math.floor(Math.random() * 36);
      reward = { kind: "kp", amount: kpAmt };
      profile.kp = num(profile.kp, 0) + kpAmt;
    } else {
      const cAmt = 120 + Math.floor(Math.random() * 281);
      reward = { kind: "coins", amount: cAmt };
      const inv = isPlainRecord(profile.inventory)
        ? { ...(profile.inventory as Record<string, unknown>) }
        : {};
      inv.coins = num(inv.coins, 0) + cAmt;
      profile.inventory = inv;
    }

    xp -= xpMax;
    progress.xp = Math.max(0, xp);
    profile.wealthScore = computeWealthScore(profile);

    const upd = await pool.query(
      `UPDATE app_users
       SET profile = $2::jsonb, progress = $3::jsonb, updated_at = now()
       WHERE firebase_uid = $1
       RETURNING id, firebase_uid, email, display_name, hero_id, profile, progress, created_at, updated_at`,
      [uid, JSON.stringify(profile), JSON.stringify(progress)],
    );

    res.json({ user: upd.rows[0], reward });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Claim failed";
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
    const profile = isPlainRecord(row.profile)
      ? { ...(row.profile as Record<string, unknown>) }
      : {};
    const progress = isPlainRecord(row.progress)
      ? { ...(row.progress as Record<string, unknown>) }
      : {};

    const inv = isPlainRecord(profile.inventory)
      ? { ...(profile.inventory as Record<string, unknown>) }
      : {};
    const ger = isPlainRecord(profile.ger)
      ? { ...(profile.ger as Record<string, unknown>) }
      : {};
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
    const profile = isPlainRecord(row.profile)
      ? { ...(row.profile as Record<string, unknown>) }
      : {};
    const progress = isPlainRecord(row.progress)
      ? { ...(row.progress as Record<string, unknown>) }
      : {};

    const inv = isPlainRecord(profile.inventory)
      ? { ...(profile.inventory as Record<string, unknown>) }
      : {};
    const coins = num(inv.coins, 0);
    const cost = livestockCost(kind, qty);
    if (coins < cost.coins) {
      res.status(409).json({ error: "Not enough coins" });
      return;
    }
    inv.coins = coins - cost.coins;
    profile.inventory = inv;

    const ls = isPlainRecord(profile.livestock)
      ? { ...(profile.livestock as Record<string, unknown>) }
      : {};
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

gameRouter.post("/home/exchange-gems", async (req, res) => {
  const parsed = homeExchangeGemsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  const email = parsed.data.email.trim().toLowerCase();
  const uid = emailUid(email);
  const wantGems = parsed.data.gems;

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
    const profile = isPlainRecord(row.profile)
      ? { ...(row.profile as Record<string, unknown>) }
      : {};
    const progress = isPlainRecord(row.progress)
      ? { ...(row.progress as Record<string, unknown>) }
      : {};

    const inv = isPlainRecord(profile.inventory)
      ? { ...(profile.inventory as Record<string, unknown>) }
      : {};
    const curGems = Math.max(0, Math.floor(num(inv.gems, 0)));
    if (curGems < wantGems) {
      res.status(409).json({ error: "Not enough gems" });
      return;
    }

    const coinsOut = wantGems * GEMS_TO_COINS_EXCHANGE_RATE;
    inv.gems = curGems - wantGems;
    inv.coins = num(inv.coins, 0) + coinsOut;
    profile.inventory = inv;
    profile.wealthScore = computeWealthScore(profile);

    const upd = await pool.query(
      `UPDATE app_users
       SET profile = $2::jsonb, progress = $3::jsonb, updated_at = now()
       WHERE firebase_uid = $1
       RETURNING id, firebase_uid, email, display_name, hero_id, profile, progress, created_at, updated_at`,
      [uid, JSON.stringify(profile), JSON.stringify(progress)],
    );
    res.json({
      user: upd.rows[0],
      exchange: { gemsSpent: wantGems, coinsReceived: coinsOut },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Exchange failed";
    res.status(500).json({ error: msg });
  }
});
