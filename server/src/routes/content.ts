import { Router } from "express";
import { z } from "zod";
import { pool } from "../db.js";

export const contentRouter = Router();

function localUid(email: string) {
  return `local:${email.trim().toLowerCase()}`;
}

function normalizeStationId(raw: unknown): string {
  let sid = typeof raw === "string" && raw.trim() ? raw.trim() : "ulaanbaatar";
  if (sid === "orkhon") sid = "orkhon_river";
  return sid;
}

contentRouter.get("/heroes", async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, slug, name_mn, name_en, title_mn, title_en, tier, stats, color, emissive, image_url, model_path,
              bonus_multiplier, bonus_title_mn, bonus_title_en, sort_order, is_available, created_at, updated_at
       FROM heroes
       WHERE is_available = true
       ORDER BY sort_order ASC, name_en ASC`
    );
    res.json({ heroes: result.rows });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Query failed";
    res.status(500).json({ error: msg });
  }
});

contentRouter.get("/stations", async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT slug, name_mn, name_en, region_mn, region_en, icon, pos, journey_index,
              quest_hint_mn, quest_hint_en, created_at, updated_at
       FROM map_stations
       ORDER BY journey_index ASC`
    );
    res.json({ stations: result.rows });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Query failed";
    res.status(500).json({ error: msg });
  }
});

/** Өртөөнд холбогдсон тоглоомууд (нээлттэй каталог). */
contentRouter.get("/stations/:slug/games", async (req, res) => {
  const slug = z.string().min(1).safeParse(req.params.slug);
  if (!slug.success) {
    res.status(400).json({ error: "Invalid slug" });
    return;
  }
  try {
    const result = await pool.query(
      `SELECT g.id, g.slug, g.name_mn, g.name_en, g.description_mn, g.description_en, g.is_available,
              g.sort_order, g.created_at, g.updated_at,
              sg.sort_order AS station_sort, sg.reward_hint_mn, sg.reward_hint_en
       FROM station_games sg
       INNER JOIN games g ON g.id = sg.game_id
       WHERE sg.station_slug = $1 AND g.is_available = true
       ORDER BY sg.sort_order ASC, g.sort_order ASC`,
      [slug.data]
    );
    res.json({ games: result.rows });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Query failed";
    res.status(500).json({ error: msg });
  }
});

const bundleQuery = z.object({
  email: z.string().min(3),
  lang: z.enum(["mn", "en"]).optional().default("mn"),
});

/**
 * Home / sidebar: user progress + hero + current уртуу + UI strings (locale).
 */
contentRouter.get("/dashboard-bundle", async (req, res) => {
  const parsed = bundleQuery.safeParse({
    email: req.query.email,
    lang: req.query.lang ?? "mn",
  });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query" });
    return;
  }
  const { email, lang } = parsed.data;
  const uid = localUid(email);

  try {
    const userRow = await pool.query(
      `SELECT id, email, display_name, hero_id, profile, progress, created_at
       FROM app_users WHERE firebase_uid = $1`,
      [uid]
    );
    if (userRow.rowCount === 0) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const user = userRow.rows[0] as {
      id: string;
      email: string;
      display_name: string | null;
      hero_id: string | null;
      profile: unknown;
      progress: unknown;
      created_at: Date;
    };

    const profile =
      typeof user.profile === "object" && user.profile
        ? (user.profile as Record<string, unknown>)
        : {};
    const progress =
      typeof user.progress === "object" && user.progress
        ? (user.progress as Record<string, unknown>)
        : {};

    const heroSlug =
      (typeof user.hero_id === "string" && user.hero_id) ||
      (typeof profile.heroId === "string" ? profile.heroId : null);

    let hero: Record<string, unknown> | null = null;
    if (heroSlug) {
      const hr = await pool.query(`SELECT * FROM heroes WHERE slug = $1`, [heroSlug]);
      if (hr.rowCount && hr.rows[0]) hero = hr.rows[0] as Record<string, unknown>;
    }

    const sid = normalizeStationId(progress.currentStationId);
    const st = await pool.query(`SELECT * FROM map_stations WHERE slug = $1`, [sid]);
    let station: Record<string, unknown> | null =
      st.rowCount && st.rows[0] ? (st.rows[0] as Record<string, unknown>) : null;

    if (!station) {
      const fb = await pool.query(
        `SELECT * FROM map_stations WHERE slug = $1`,
        ["ulaanbaatar"]
      );
      if (fb.rowCount && fb.rows[0]) station = fb.rows[0] as Record<string, unknown>;
    }

    const strRes = await pool.query(`SELECT key, value FROM ui_strings WHERE locale = $1`, [lang]);
    const strings: Record<string, string> = {};
    for (const row of strRes.rows as { key: string; value: string }[]) {
      strings[row.key] = row.value;
    }

    const totalRes = await pool.query(`SELECT count(*)::int AS c FROM map_stations`);
    const totalStations = totalRes.rows[0]?.c ?? 0;

    let journeyDay = typeof progress.journeyDay === "number" ? progress.journeyDay : 1;
    if (progress.journeyDay === undefined) {
      const daysSince =
        Math.floor((Date.now() - new Date(user.created_at).getTime()) / 86400000) + 1;
      journeyDay = Math.max(1, Math.min(daysSince, 9999));
    }

    const questTitle =
      station &&
      (lang === "mn"
        ? (station.quest_hint_mn as string | null)
        : (station.quest_hint_en as string | null))
        ? String(lang === "mn" ? station.quest_hint_mn : station.quest_hint_en)
        : strings["sidebar.questTitle"] ?? "";

    const questDesc = strings["sidebar.questDesc"] ?? "";

    const bonusMultiplier =
      typeof hero?.bonus_multiplier === "string" ? hero.bonus_multiplier : "x1.5";
    const bonusTitle =
      lang === "mn"
        ? String(hero?.bonus_title_mn ?? "Талын Хурд")
        : String(hero?.bonus_title_en ?? "Steppe Speedster");

    const stationLabel =
      station &&
      (lang === "mn" ? (station.name_mn as string) : (station.name_en as string))
        ? String(lang === "mn" ? station.name_mn : station.name_en)
        : "";

    const stationIndex =
      typeof station?.journey_index === "number" ? (station.journey_index as number) + 1 : 1;

    const stationSlugForGames = typeof station?.slug === "string" ? station.slug : sid;
    const gamesRes = await pool.query(
      `SELECT g.id, g.slug, g.name_mn, g.name_en, g.description_mn, g.description_en, g.is_available,
              sg.sort_order AS station_sort, sg.reward_hint_mn, sg.reward_hint_en
       FROM station_games sg
       INNER JOIN games g ON g.id = sg.game_id
       WHERE sg.station_slug = $1 AND g.is_available = true
       ORDER BY sg.sort_order ASC, g.sort_order ASC`,
      [stationSlugForGames]
    );
    const stationGames = gamesRes.rows;

    res.json({
      user: {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
        hero_id: user.hero_id,
        profile,
        progress,
        created_at: user.created_at,
      },
      hero,
      currentStation: station,
      stationGames,
      strings,
      computed: {
        journeyDay,
        questTitle,
        questDesc,
        bonusMultiplier,
        bonusTitle,
        tier: typeof hero?.tier === "string" ? hero.tier : "C",
        currentStationLabel: stationLabel,
        stationIndexOneBased: stationIndex,
        totalStations,
        displayHeroName:
          lang === "mn"
            ? String(hero?.name_mn ?? profile.heroName ?? "")
            : String(hero?.name_en ?? profile.heroName ?? ""),
        displayHeroTitle:
          lang === "mn"
            ? String(hero?.title_mn ?? profile.heroTitle ?? "")
            : String(hero?.title_en ?? profile.heroTitle ?? ""),
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Query failed";
    res.status(500).json({ error: msg });
  }
});
