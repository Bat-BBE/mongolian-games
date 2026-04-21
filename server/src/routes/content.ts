import { Router } from "express";
import { z } from "zod";
import { pool } from "../db.js";

export const contentRouter = Router();

function localUid(email: string) {
  return `local:${email.trim().toLowerCase()}`;
}

function normalizeStationId(raw: unknown): string {
  let sid = typeof raw === "string" && raw.trim() ? raw.trim() : "choibalsan";
  if (sid === "orkhon") sid = "orkhon_river";
  return sid;
}

contentRouter.get("/heroes", async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, slug, name_mn, name_en, title_mn, title_en, tier, stats, color, emissive, image_url, model_path,
              bonus_multiplier, bonus_title_mn, bonus_title_en, bio_mn, bio_en, sort_order, is_available, created_at, updated_at
       FROM heroes
       WHERE is_available = true
       ORDER BY sort_order ASC, name_en ASC`,
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
              quest_hint_mn, quest_hint_en, quest_desc_mn, quest_desc_en, created_at, updated_at
       FROM map_stations
       ORDER BY journey_index ASC`,
    );
    res.json({ stations: result.rows });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Query failed";
    res.status(500).json({ error: msg });
  }
});

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
      [slug.data],
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
      [uid],
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

    const doneIds = progress.doneStationIds;
    const doneCount = Array.isArray(doneIds) ? doneIds.length : 0;
    const xp =
      typeof progress.xp === "number" ? progress.xp : Number(progress.xp ?? 0);
    const jd =
      typeof progress.journeyDay === "number"
        ? progress.journeyDay
        : Number(progress.journeyDay ?? 1);

    const isFreshStart =
      doneCount === 0 &&
      (Number.isFinite(xp) ? xp : 0) <= 0 &&
      (Number.isFinite(jd) ? jd : 1) <= 1;

    const heroSlug =
      (typeof user.hero_id === "string" && user.hero_id) ||
      (typeof profile.heroId === "string" ? profile.heroId : null);

    let hero: Record<string, unknown> | null = null;
    if (heroSlug) {
      const hr = await pool.query(`SELECT * FROM heroes WHERE slug = $1`, [
        heroSlug,
      ]);
      if (hr.rowCount && hr.rows[0])
        hero = hr.rows[0] as Record<string, unknown>;
    }

    const firstStationRes = await pool.query(
      `SELECT slug FROM map_stations ORDER BY journey_index ASC LIMIT 1`,
    );
    const firstStationSlug =
      typeof firstStationRes.rows?.[0]?.slug === "string"
        ? String(firstStationRes.rows[0].slug)
        : "choibalsan";

    const sid = isFreshStart
      ? firstStationSlug
      : normalizeStationId(
          typeof progress.currentStationId === "string"
            ? progress.currentStationId
            : firstStationSlug,
        );
    const st = await pool.query(`SELECT * FROM map_stations WHERE slug = $1`, [
      sid,
    ]);
    let station: Record<string, unknown> | null =
      st.rowCount && st.rows[0]
        ? (st.rows[0] as Record<string, unknown>)
        : null;

    if (!station) {
      const fb = await pool.query(
        `SELECT * FROM map_stations WHERE slug = $1`,
        [firstStationSlug],
      );
      if (fb.rowCount && fb.rows[0])
        station = fb.rows[0] as Record<string, unknown>;
    }

    const strRes = await pool.query(
      `SELECT key, value FROM ui_strings WHERE locale = $1`,
      [lang],
    );
    const strings: Record<string, string> = {};
    for (const row of strRes.rows as { key: string; value: string }[]) {
      strings[row.key] = row.value;
    }

    const totalRes = await pool.query(
      `SELECT count(*)::int AS c FROM map_stations`,
    );
    const totalStations = totalRes.rows[0]?.c ?? 0;

    let journeyDay =
      typeof progress.journeyDay === "number" ? progress.journeyDay : 1;
    if (progress.journeyDay === undefined) {
      const daysSince =
        Math.floor(
          (Date.now() - new Date(user.created_at).getTime()) / 86400000,
        ) + 1;
      journeyDay = Math.max(1, Math.min(daysSince, 9999));
    }

    const questTitle =
      lang === "mn"
        ? (strings["sidebar.homeQuestTitleMn"] ??
          "Таны гэр — талын төв")
        : (strings["sidebar.homeQuestTitleEn"] ??
          "Your ger — heart of the steppe");

    const questDesc =
      lang === "mn"
        ? (strings["sidebar.homeQuestDescMn"] ??
          "Зураг дээрх бүх өртөө руу чөлөөтэй очоод тогло. Өртөө бүрт 7 хоногт 2 удаа. Лимит дууссан өртөө түгжигдэнэ. Гэр дээр дараад гэрээ сайжруулж, мал худалдана.")
        : (strings["sidebar.homeQuestDescEn"] ??
          "Visit any station on the map and play. Each station allows 2 plays per 7 days, then it locks until the week resets. Open Home to upgrade your ger and buy livestock.");

    const bonusMultiplier =
      typeof hero?.bonus_multiplier === "string"
        ? hero.bonus_multiplier
        : "x1.5";
    const bonusTitle =
      lang === "mn"
        ? String(hero?.bonus_title_mn ?? "Талын Хурд")
        : String(hero?.bonus_title_en ?? "Steppe Speedster");

    const stationLabel =
      station &&
      (lang === "mn"
        ? (station.name_mn as string)
        : (station.name_en as string))
        ? String(lang === "mn" ? station.name_mn : station.name_en)
        : "";

    const stationGames: unknown[] = [];

    // Map stations for 3D map labels (dynamic names + positions + all linked games).
    const allStationsRes = await pool.query(
      `SELECT slug, name_mn, name_en, region_mn, region_en, icon, image_url, pos, journey_index,
              quest_hint_mn, quest_hint_en, quest_desc_mn, quest_desc_en
       FROM map_stations
       ORDER BY journey_index ASC`,
    );

    const allGamesRes = await pool.query(
      `SELECT sg.station_slug,
              g.slug,
              g.name_mn, g.name_en,
              g.description_mn, g.description_en,
              sg.reward_hint_mn, sg.reward_hint_en,
              sg.sort_order AS sg_sort
       FROM station_games sg
       INNER JOIN games g ON g.id = sg.game_id
       WHERE g.is_available = true
       ORDER BY sg.station_slug, sg.sort_order ASC, g.sort_order ASC`,
    );
    type StationGameJoinRow = {
      station_slug: string;
      slug: string;
      name_mn: string;
      name_en: string;
      description_mn: string;
      description_en: string;
      reward_hint_mn: string | null;
      reward_hint_en: string | null;
    };
    const gamesByStation = new Map<string, StationGameJoinRow[]>();
    for (const row of allGamesRes.rows as StationGameJoinRow[]) {
      const list = gamesByStation.get(row.station_slug) ?? [];
      list.push(row);
      gamesByStation.set(row.station_slug, list);
    }

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
      mapStations: (
        allStationsRes.rows as {
          slug: string;
          name_mn: string;
          name_en: string;
          region_mn: string;
          region_en: string;
          icon: string;
          pos: unknown;
          journey_index: number;
        }[]
      ).map((s) => {
        const row = s as {
          slug: string;
          name_mn: string;
          name_en: string;
          region_mn: string;
          region_en: string;
          icon: string;
          image_url?: string | null;
          pos: unknown;
          journey_index: number;
          quest_hint_mn: string | null;
          quest_hint_en: string | null;
          quest_desc_mn: string | null;
          quest_desc_en: string | null;
        };
        const p =
          typeof row.pos === "object" && row.pos
            ? (row.pos as Record<string, unknown>)
            : {};
        const rawList = gamesByStation.get(row.slug) ?? [];
        const games = rawList.map((g) => ({
          slug: g.slug,
          name: lang === "mn" ? g.name_mn : g.name_en,
          desc: lang === "mn" ? g.description_mn : g.description_en,
          reward:
            (lang === "mn" ? g.reward_hint_mn : g.reward_hint_en) ?? "",
        }));
        const prev = games[0];
        const img =
          typeof row.image_url === "string"
            ? String(row.image_url).trim()
            : null;
        const qh =
          lang === "mn" ? row.quest_hint_mn : row.quest_hint_en;
        const qd =
          lang === "mn" ? row.quest_desc_mn : row.quest_desc_en;
        return {
          id: row.slug,
          name: lang === "mn" ? row.name_mn : row.name_en,
          region: lang === "mn" ? row.region_mn : row.region_en,
          icon: row.icon,
          image_url: img && img.length > 0 ? img : null,
          quest_hint: typeof qh === "string" && qh.trim() ? qh.trim() : null,
          quest_desc: typeof qd === "string" && qd.trim() ? qd.trim() : null,
          pos: { left: String(p.left ?? ""), top: String(p.top ?? "") },
          available: true,
          games,
          game: prev
            ? {
                slug: prev.slug,
                name: prev.name,
                desc: prev.desc,
                reward: prev.reward,
              }
            : { slug: "", name: "", desc: "", reward: "" },
        };
      }),
      computed: {
        currentStationSlug: "home",
        mapHubMode: true,
        journeyDay,
        questTitle,
        questDesc,
        bonusMultiplier,
        bonusTitle,
        tier: typeof hero?.tier === "string" ? hero.tier : "C",
        currentStationLabel:
          lang === "mn" ? "Гэр — төв" : "Home — your ger",
        stationIndexOneBased: null as unknown as number,
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
