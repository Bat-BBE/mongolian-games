import { Router } from "express";
import jwt from "jsonwebtoken";
import multer from "multer";
import { mkdirSync } from "node:fs";
import { join, extname } from "node:path";
import { z } from "zod";
import { env } from "../config.js";
import { pool } from "../db.js";
import { requireAdminJwt } from "../middleware/admin-jwt.js";

const loginBody = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

const gameBody = z.object({
  slug: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9-]+$/),
  name_mn: z.string().min(1).max(500),
  name_en: z.string().min(1).max(500),
  description_mn: z.string().max(10000).optional().default(""),
  description_en: z.string().max(10000).optional().default(""),
  image_url: z.string().nullish(),
  is_available: z.boolean(),
  show_on_home: z.boolean().optional().default(true),
  sort_order: z.number().int(),
});

const gamePatch = gameBody.partial();

const heroAdminPatch = z.object({
  name_mn: z.string().min(1).optional(),
  name_en: z.string().min(1).optional(),
  title_mn: z.string().min(1).optional(),
  title_en: z.string().min(1).optional(),
  bio_mn: z.string().optional(),
  bio_en: z.string().optional(),
  stats: z.record(z.string(), z.unknown()).optional(),
  color: z.string().optional(),
  emissive: z.string().optional(),
  image_url: z.string().optional(),
  model_path: z.string().optional(),
  sort_order: z.number().int().optional(),
  is_available: z.boolean().optional(),
});

const stationAdminPatch = z.object({
  name_mn: z.string().min(1).optional(),
  name_en: z.string().min(1).optional(),
  region_mn: z.string().min(1).optional(),
  region_en: z.string().min(1).optional(),
  icon: z.string().optional(),
  image_url: z.string().nullable().optional(),
  pos: z.record(z.string(), z.unknown()).optional(),
  journey_index: z.number().int().optional(),
  quest_hint_mn: z.string().optional(),
  quest_hint_en: z.string().optional(),
  quest_desc_mn: z.string().optional(),
  quest_desc_en: z.string().optional(),
});

const uiStringPut = z.object({
  key: z.string().min(1),
  locale: z.enum(["mn", "en"]),
  value: z.string(),
});

const userAdminPatch = z.object({
  displayName: z.string().min(1).max(500).optional(),
  kp: z.number().int().min(0).max(999999999).optional(),
  wealthScore: z.number().int().min(0).max(999999999).optional(),
  coins: z.number().int().min(0).max(999999999).optional(),
  gems: z.number().int().min(0).max(999999999).optional(),
  xp: z.number().int().min(0).max(999999999).optional(),
  gerLevel: z.number().int().min(1).max(9999).optional(),
  sheep: z.number().int().min(0).max(999999).optional(),
  goat: z.number().int().min(0).max(999999).optional(),
  cow: z.number().int().min(0).max(999999).optional(),
  horse: z.number().int().min(0).max(999999).optional(),
  camel: z.number().int().min(0).max(999999).optional(),
});

function asJsonObject(v: unknown): Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v)
    ? { ...(v as Record<string, unknown>) }
    : {};
}

function mergeUserEconomy(
  prevProfile: unknown,
  prevProgress: unknown,
  patch: z.infer<typeof userAdminPatch>,
): { profile: Record<string, unknown>; progress: Record<string, unknown> } {
  const profile = asJsonObject(prevProfile);
  const progress = asJsonObject(prevProgress);

  if (patch.kp !== undefined) profile.kp = patch.kp;
  if (patch.wealthScore !== undefined) profile.wealthScore = patch.wealthScore;

  if (patch.coins !== undefined || patch.gems !== undefined) {
    const inv = asJsonObject(profile.inventory);
    if (patch.coins !== undefined) inv.coins = patch.coins;
    if (patch.gems !== undefined) inv.gems = patch.gems;
    profile.inventory = inv;
  }

  if (
    patch.sheep !== undefined ||
    patch.goat !== undefined ||
    patch.cow !== undefined ||
    patch.horse !== undefined ||
    patch.camel !== undefined
  ) {
    const ls = asJsonObject(profile.livestock);
    if (patch.sheep !== undefined) ls.sheep = patch.sheep;
    if (patch.goat !== undefined) ls.goat = patch.goat;
    if (patch.cow !== undefined) ls.cow = patch.cow;
    if (patch.horse !== undefined) ls.horse = patch.horse;
    if (patch.camel !== undefined) ls.camel = patch.camel;
    profile.livestock = ls;
  }

  if (patch.gerLevel !== undefined) {
    const ger = asJsonObject(profile.ger);
    ger.level = patch.gerLevel;
    profile.ger = ger;
  }

  if (patch.xp !== undefined) progress.xp = patch.xp;

  return { profile, progress };
}

const stationGamesPutBody = z.object({
  gameIds: z.array(z.string().uuid()),
});

export const adminRouter = Router();

adminRouter.post("/login", (req, res) => {
  const u = env.ADMIN_USERNAME;
  const p = env.ADMIN_PASSWORD;
  const secret = env.JWT_SECRET;
  if (!u || !p || !secret) {
    res.status(503).json({
      error:
        "Admin login is not configured. Set ADMIN_USERNAME, ADMIN_PASSWORD, and JWT_SECRET (32+ chars) in server/.env",
    });
    return;
  }
  const parsed = loginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  const { username, password } = parsed.data;
  if (username !== u || password !== p) {
    res.status(401).json({ error: "Нэвтрэх нэр эсвэл нууц үг буруу" });
    return;
  }
  const token = jwt.sign({ role: "admin" }, secret, { expiresIn: "8h" });
  res.json({ token });
});

adminRouter.use(requireAdminJwt);

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      const dir = join(process.cwd(), "uploads", "games");
      mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (_req, file, cb) => {
      const safeExt = extname(file.originalname || "").toLowerCase() || ".jpg";
      const ext =
        safeExt === ".png" ||
        safeExt === ".jpg" ||
        safeExt === ".jpeg" ||
        safeExt === ".webp"
          ? safeExt
          : ".jpg";
      const name = `game_${Date.now()}_${Math.random().toString(16).slice(2)}${ext}`;
      cb(null, name);
    },
  }),
  limits: { fileSize: 6 * 1024 * 1024 },
  fileFilter: ((req, file, cb) => {
    const ok = ["image/png", "image/jpeg", "image/webp"].includes(
      file.mimetype,
    );
    if (!ok) {
      (req as unknown as { fileValidationError?: string }).fileValidationError =
        "Invalid file type";
      cb(null, false);
      return;
    }
    cb(null, true);
  }) as multer.Options["fileFilter"],
});

const heroImageUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      const dir = join(process.cwd(), "uploads", "heroes");
      mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (_req, file, cb) => {
      const safeExt = extname(file.originalname || "").toLowerCase() || ".jpg";
      const ext =
        safeExt === ".png" ||
        safeExt === ".jpg" ||
        safeExt === ".jpeg" ||
        safeExt === ".webp"
          ? safeExt
          : ".jpg";
      const name = `hero_${Date.now()}_${Math.random().toString(16).slice(2)}${ext}`;
      cb(null, name);
    },
  }),
  limits: { fileSize: 12 * 1024 * 1024 },
  fileFilter: ((req, file, cb) => {
    const ok =
      typeof file.mimetype === "string" && file.mimetype.startsWith("image/");
    if (!ok) {
      (req as unknown as { fileValidationError?: string }).fileValidationError =
        "Invalid file type";
      cb(null, false);
      return;
    }
    cb(null, true);
  }) as multer.Options["fileFilter"],
});

const stationImageUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      const dir = join(process.cwd(), "uploads", "stations");
      mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (_req, file, cb) => {
      const safeExt = extname(file.originalname || "").toLowerCase() || ".jpg";
      const ext =
        safeExt === ".png" ||
        safeExt === ".jpg" ||
        safeExt === ".jpeg" ||
        safeExt === ".webp"
          ? safeExt
          : ".jpg";
      const name = `station_${Date.now()}_${Math.random().toString(16).slice(2)}${ext}`;
      cb(null, name);
    },
  }),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: ((req, file, cb) => {
    const ok =
      typeof file.mimetype === "string" && file.mimetype.startsWith("image/");
    if (!ok) {
      (req as unknown as { fileValidationError?: string }).fileValidationError =
        "Invalid file type";
      cb(null, false);
      return;
    }
    cb(null, true);
  }) as multer.Options["fileFilter"],
});

adminRouter.get("/treasury", async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         count(*)::int AS users,
         COALESCE(sum((profile->>'kp')::int), 0)::int AS kp_total,
         COALESCE(sum((profile->'inventory'->>'coins')::int), 0)::int AS coins_total,
         COALESCE(sum((profile->'inventory'->>'gems')::int), 0)::int AS gems_total,
         COALESCE(sum((profile->'livestock'->>'sheep')::int), 0)::int AS sheep_total,
         COALESCE(sum((profile->'livestock'->>'goat')::int), 0)::int AS goat_total,
         COALESCE(sum((profile->'livestock'->>'cow')::int), 0)::int AS cow_total,
         COALESCE(sum((profile->'livestock'->>'horse')::int), 0)::int AS horse_total,
         COALESCE(sum((profile->'livestock'->>'camel')::int), 0)::int AS camel_total,
         COALESCE(avg((profile->'ger'->>'level')::int), 1)::float AS ger_level_avg
       FROM app_users`,
    );

    const top = await pool.query(
      `SELECT id, display_name, email, hero_id,
              COALESCE((profile->>'wealthScore')::int, (profile->>'kp')::int, (progress->>'xp')::int, 0) AS score,
              COALESCE((profile->>'wealthScore')::int, 0) AS wealth_score,
              COALESCE((progress->>'xp')::int, 0) AS xp,
              COALESCE((profile->'ger'->>'level')::int, 1) AS ger_level,
              COALESCE((profile->>'kp')::int, 0) AS kp,
              COALESCE((profile->'inventory'->>'coins')::int, 0) AS coins,
              COALESCE((profile->'inventory'->>'gems')::int, 0) AS gems,
              COALESCE((profile->'livestock'->>'sheep')::int, 0) AS sheep,
              COALESCE((profile->'livestock'->>'goat')::int, 0) AS goat,
              COALESCE((profile->'livestock'->>'cow')::int, 0) AS cow,
              COALESCE((profile->'livestock'->>'horse')::int, 0) AS horse,
              COALESCE((profile->'livestock'->>'camel')::int, 0) AS camel,
              COALESCE(
                jsonb_array_length(COALESCE(progress->'doneStationIds', '[]'::jsonb)),
                0
              )::int AS visited_stations
       FROM app_users
       ORDER BY COALESCE((profile->>'wealthScore')::int, (profile->>'kp')::int, (progress->>'xp')::int, 0) DESC NULLS LAST
       LIMIT 10`,
    );

    const users = await pool.query(
      `SELECT id, display_name, email, hero_id,
              COALESCE((profile->>'wealthScore')::int, (profile->>'kp')::int, (progress->>'xp')::int, 0) AS score,
              COALESCE((profile->>'wealthScore')::int, 0) AS wealth_score,
              COALESCE((progress->>'xp')::int, 0) AS xp,
              COALESCE((profile->'ger'->>'level')::int, 1) AS ger_level,
              COALESCE((profile->>'kp')::int, 0) AS kp,
              COALESCE((profile->'inventory'->>'coins')::int, 0) AS coins,
              COALESCE((profile->'inventory'->>'gems')::int, 0) AS gems,
              COALESCE((profile->'livestock'->>'sheep')::int, 0) AS sheep,
              COALESCE((profile->'livestock'->>'goat')::int, 0) AS goat,
              COALESCE((profile->'livestock'->>'cow')::int, 0) AS cow,
              COALESCE((profile->'livestock'->>'horse')::int, 0) AS horse,
              COALESCE((profile->'livestock'->>'camel')::int, 0) AS camel,
              COALESCE(
                jsonb_array_length(COALESCE(progress->'doneStationIds', '[]'::jsonb)),
                0
              )::int AS visited_stations
       FROM app_users
       ORDER BY COALESCE((profile->>'wealthScore')::int, (profile->>'kp')::int, (progress->>'xp')::int, 0) DESC NULLS LAST
       LIMIT 250`,
    );
    res.json({
      summary: result.rows[0],
      top: top.rows,
      users: users.rows,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Query failed";
    res.status(500).json({ error: msg });
  }
});

adminRouter.get("/users", async (_req, res) => {
  try {
    const includeLocal = z
      .enum(["1", "true", "yes"])
      .optional()
      .safeParse(_req.query.includeLocal);
    const result = await pool.query(
      `SELECT id, firebase_uid, email, display_name, hero_id, created_at, updated_at
       FROM app_users
       WHERE ($1::boolean = true) OR (firebase_uid NOT LIKE 'local:%')
       ORDER BY created_at DESC`,
      [includeLocal.success && !!includeLocal.data],
    );
    res.json({ users: result.rows });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Query failed";
    res.status(500).json({ error: msg });
  }
});

adminRouter.get("/games", async (_req, res) => {
  const result = await pool.query(
    `SELECT id, slug, name_mn, name_en, description_mn, description_en, image_url, is_available, show_on_home, sort_order,
            created_at, updated_at
     FROM games
     ORDER BY sort_order ASC, name_en ASC`,
  );
  res.json({ games: result.rows });
});

adminRouter.post("/games", async (req, res) => {
  const parsed = gameBody.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ error: "Invalid body", details: parsed.error.flatten() });
    return;
  }
  const b = parsed.data;
  try {
    const result = await pool.query(
      `INSERT INTO games (slug, name_mn, name_en, description_mn, description_en, image_url, is_available, show_on_home, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING id, slug, name_mn, name_en, description_mn, description_en, image_url, is_available, show_on_home, sort_order, created_at, updated_at`,
      [
        b.slug,
        b.name_mn,
        b.name_en,
        b.description_mn,
        b.description_en,
        b.image_url ?? null,
        b.is_available,
        b.show_on_home ?? true,
        b.sort_order,
      ],
    );
    res.status(201).json({ game: result.rows[0] });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Insert failed";
    if (msg.includes("unique") || msg.includes("duplicate")) {
      res.status(409).json({ error: "Slug already exists" });
      return;
    }
    res.status(500).json({ error: msg });
  }
});

adminRouter.put("/games/:id", async (req, res) => {
  const id = z.string().uuid().safeParse(req.params.id);
  if (!id.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const parsed = gamePatch.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ error: "Invalid body", details: parsed.error.flatten() });
    return;
  }
  const p = parsed.data;
  const fields: string[] = [];
  const values: unknown[] = [];
  let n = 1;
  if (p.slug !== undefined) {
    fields.push(`slug = $${n++}`);
    values.push(p.slug);
  }
  if (p.name_mn !== undefined) {
    fields.push(`name_mn = $${n++}`);
    values.push(p.name_mn);
  }
  if (p.name_en !== undefined) {
    fields.push(`name_en = $${n++}`);
    values.push(p.name_en);
  }
  if (p.description_mn !== undefined) {
    fields.push(`description_mn = $${n++}`);
    values.push(p.description_mn);
  }
  if (p.description_en !== undefined) {
    fields.push(`description_en = $${n++}`);
    values.push(p.description_en);
  }
  if ((p as { image_url?: string }).image_url !== undefined) {
    fields.push(`image_url = $${n++}`);
    values.push((p as { image_url?: string }).image_url ?? null);
  }
  if (p.is_available !== undefined) {
    fields.push(`is_available = $${n++}`);
    values.push(p.is_available);
  }
  if ((p as { show_on_home?: boolean }).show_on_home !== undefined) {
    fields.push(`show_on_home = $${n++}`);
    values.push((p as { show_on_home: boolean }).show_on_home);
  }
  if (p.sort_order !== undefined) {
    fields.push(`sort_order = $${n++}`);
    values.push(p.sort_order);
  }
  if (fields.length === 0) {
    res.status(400).json({ error: "No fields to update" });
    return;
  }
  fields.push(`updated_at = now()`);
  values.push(id.data);

  const result = await pool.query(
    `UPDATE games SET ${fields.join(", ")} WHERE id = $${n}
     RETURNING id, slug, name_mn, name_en, description_mn, description_en, image_url, is_available, show_on_home, sort_order, created_at, updated_at`,
    values,
  );
  if (result.rowCount === 0) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({ game: result.rows[0] });
});

adminRouter.delete("/games/:id", async (req, res) => {
  const id = z.string().uuid().safeParse(req.params.id);
  if (!id.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const result = await pool.query(
    `DELETE FROM games WHERE id = $1 RETURNING id`,
    [id.data],
  );
  if (result.rowCount === 0) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.status(204).send();
});

adminRouter.post(
  "/games/:id/image",
  upload.single("file"),
  async (req, res) => {
    const id = z.string().uuid().safeParse(req.params.id);
    if (!id.success) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const fv = (req as unknown as { fileValidationError?: string })
      .fileValidationError;
    if (fv) {
      res.status(415).json({ error: fv });
      return;
    }
    const f = req.file;
    if (!f) {
      res.status(400).json({ error: "Missing file" });
      return;
    }
    const imageUrl = `/uploads/games/${f.filename}`;
    try {
      const result = await pool.query(
        `UPDATE games SET image_url = $1, updated_at = now()
       WHERE id = $2
       RETURNING id, image_url`,
        [imageUrl, id.data],
      );
      if (result.rowCount === 0) {
        res.status(404).json({ error: "Not found" });
        return;
      }
      res.json({ game: result.rows[0] });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Upload failed";
      res.status(500).json({ error: msg });
    }
  },
);

adminRouter.post(
  "/heroes/:slug/image",
  heroImageUpload.single("file"),
  async (req, res) => {
    const slug = z.string().min(1).safeParse(req.params.slug);
    if (!slug.success) {
      res.status(400).json({ error: "Invalid slug" });
      return;
    }
    const fv = (req as unknown as { fileValidationError?: string })
      .fileValidationError;
    if (fv) {
      res.status(415).json({ error: fv });
      return;
    }
    const f = req.file;
    if (!f) {
      res.status(400).json({ error: "Missing file" });
      return;
    }
    const imageUrl = `/uploads/heroes/${f.filename}`;
    try {
      const result = await pool.query(
        `UPDATE heroes SET image_url = $1, updated_at = now()
         WHERE slug = $2
         RETURNING id, slug, image_url`,
        [imageUrl, slug.data],
      );
      if (result.rowCount === 0) {
        res.status(404).json({ error: "Hero not found" });
        return;
      }
      res.json({ hero: result.rows[0] });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Upload failed";
      res.status(500).json({ error: msg });
    }
  },
);

adminRouter.get("/heroes", async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, slug, name_mn, name_en, title_mn, title_en, bio_mn, bio_en, stats, color, emissive, image_url, model_path,
              sort_order, is_available, created_at, updated_at
       FROM heroes
       ORDER BY sort_order ASC, name_en ASC`,
    );
    res.json({ heroes: result.rows });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Query failed";
    res.status(500).json({ error: msg });
  }
});

adminRouter.put("/heroes/:slug", async (req, res) => {
  const slug = z.string().min(1).safeParse(req.params.slug);
  if (!slug.success) {
    res.status(400).json({ error: "Invalid slug" });
    return;
  }
  const parsed = heroAdminPatch.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ error: "Invalid body", details: parsed.error.flatten() });
    return;
  }
  const p = parsed.data;
  const fields: string[] = [];
  const values: unknown[] = [];
  let n = 1;
  const push = (col: string, v: unknown) => {
    fields.push(`${col} = $${n++}`);
    values.push(v);
  };
  if (p.name_mn !== undefined) push("name_mn", p.name_mn);
  if (p.name_en !== undefined) push("name_en", p.name_en);
  if (p.title_mn !== undefined) push("title_mn", p.title_mn);
  if (p.title_en !== undefined) push("title_en", p.title_en);
  if (p.bio_mn !== undefined) push("bio_mn", p.bio_mn);
  if (p.bio_en !== undefined) push("bio_en", p.bio_en);
  if (p.stats !== undefined) {
    fields.push(`stats = $${n++}::jsonb`);
    values.push(JSON.stringify(p.stats));
  }
  if (p.color !== undefined) push("color", p.color);
  if (p.emissive !== undefined) push("emissive", p.emissive);
  if (p.image_url !== undefined) push("image_url", p.image_url);
  if (p.model_path !== undefined) push("model_path", p.model_path);
  if (p.sort_order !== undefined) push("sort_order", p.sort_order);
  if (p.is_available !== undefined) push("is_available", p.is_available);
  if (fields.length === 0) {
    res.status(400).json({ error: "No fields to update" });
    return;
  }
  fields.push(`updated_at = now()`);
  values.push(slug.data);
  try {
    const result = await pool.query(
      `UPDATE heroes SET ${fields.join(", ")} WHERE slug = $${n}
       RETURNING id, slug, name_mn, name_en, title_mn, title_en, bio_mn, bio_en, stats, color, emissive, image_url, model_path,
                 sort_order, is_available, created_at, updated_at`,
      values,
    );
    if (result.rowCount === 0) {
      res.status(404).json({ error: "Hero not found" });
      return;
    }
    res.json({ hero: result.rows[0] });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Update failed";
    res.status(500).json({ error: msg });
  }
});

adminRouter.get("/stations", async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT slug, name_mn, name_en, region_mn, region_en, icon, image_url, pos, journey_index,
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

adminRouter.put("/stations/:slug", async (req, res) => {
  const slug = z.string().min(1).safeParse(req.params.slug);
  if (!slug.success) {
    res.status(400).json({ error: "Invalid slug" });
    return;
  }
  const parsed = stationAdminPatch.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ error: "Invalid body", details: parsed.error.flatten() });
    return;
  }
  const p = parsed.data;
  const fields: string[] = [];
  const values: unknown[] = [];
  let n = 1;
  if (p.name_mn !== undefined) {
    fields.push(`name_mn = $${n++}`);
    values.push(p.name_mn);
  }
  if (p.name_en !== undefined) {
    fields.push(`name_en = $${n++}`);
    values.push(p.name_en);
  }
  if (p.region_mn !== undefined) {
    fields.push(`region_mn = $${n++}`);
    values.push(p.region_mn);
  }
  if (p.region_en !== undefined) {
    fields.push(`region_en = $${n++}`);
    values.push(p.region_en);
  }
  if (p.icon !== undefined) {
    fields.push(`icon = $${n++}`);
    values.push(p.icon);
  }
  if (p.image_url !== undefined) {
    fields.push(`image_url = $${n++}`);
    values.push(p.image_url);
  }
  if (p.pos !== undefined) {
    fields.push(`pos = $${n++}::jsonb`);
    values.push(JSON.stringify(p.pos));
  }
  if (p.journey_index !== undefined) {
    fields.push(`journey_index = $${n++}`);
    values.push(p.journey_index);
  }
  if (p.quest_hint_mn !== undefined) {
    fields.push(`quest_hint_mn = $${n++}`);
    values.push(p.quest_hint_mn);
  }
  if (p.quest_hint_en !== undefined) {
    fields.push(`quest_hint_en = $${n++}`);
    values.push(p.quest_hint_en);
  }
  if (p.quest_desc_mn !== undefined) {
    fields.push(`quest_desc_mn = $${n++}`);
    values.push(p.quest_desc_mn);
  }
  if (p.quest_desc_en !== undefined) {
    fields.push(`quest_desc_en = $${n++}`);
    values.push(p.quest_desc_en);
  }
  if (fields.length === 0) {
    res.status(400).json({ error: "No fields to update" });
    return;
  }
  fields.push(`updated_at = now()`);
  values.push(slug.data);
  try {
    const result = await pool.query(
      `UPDATE map_stations SET ${fields.join(", ")} WHERE slug = $${n}
       RETURNING slug, name_mn, name_en, region_mn, region_en, icon, image_url, pos, journey_index,
                 quest_hint_mn, quest_hint_en, quest_desc_mn, quest_desc_en, created_at, updated_at`,
      values,
    );
    if (result.rowCount === 0) {
      res.status(404).json({ error: "Station not found" });
      return;
    }
    res.json({ station: result.rows[0] });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Update failed";
    res.status(500).json({ error: msg });
  }
});

adminRouter.post(
  "/stations/:slug/image",
  stationImageUpload.single("file"),
  async (req, res) => {
    const slug = z.string().min(1).safeParse(req.params.slug);
    if (!slug.success) {
      res.status(400).json({ error: "Invalid slug" });
      return;
    }
    const fv = (req as unknown as { fileValidationError?: string })
      .fileValidationError;
    if (fv) {
      res.status(415).json({ error: fv });
      return;
    }
    const f = req.file;
    if (!f) {
      res.status(400).json({ error: "Missing file" });
      return;
    }
    const imageUrl = `/uploads/stations/${f.filename}`;
    try {
      const result = await pool.query(
        `UPDATE map_stations SET image_url = $1, updated_at = now()
         WHERE slug = $2
         RETURNING slug, image_url`,
        [imageUrl, slug.data],
      );
      if (result.rowCount === 0) {
        res.status(404).json({ error: "Station not found" });
        return;
      }
      res.json({ station: result.rows[0] });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Upload failed";
      res.status(500).json({ error: msg });
    }
  },
);

adminRouter.delete("/users/:id", async (req, res) => {
  const id = z.string().uuid().safeParse(req.params.id);
  if (!id.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  try {
    const result = await pool.query(
      `DELETE FROM app_users WHERE id = $1 RETURNING id`,
      [id.data],
    );
    if (result.rowCount === 0) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.status(204).send();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Delete failed";
    res.status(500).json({ error: msg });
  }
});

adminRouter.get("/ui-strings", async (req, res) => {
  const loc = z.enum(["mn", "en"]).optional().safeParse(req.query.locale);
  if (!loc.success) {
    res.status(400).json({ error: "Invalid locale" });
    return;
  }
  try {
    if (loc.data) {
      const result = await pool.query(
        `SELECT id, key, locale, value FROM ui_strings WHERE locale = $1 ORDER BY key ASC`,
        [loc.data],
      );
      res.json({ strings: result.rows });
      return;
    }
    const result = await pool.query(
      `SELECT id, key, locale, value FROM ui_strings ORDER BY locale, key`,
    );
    res.json({ strings: result.rows });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Query failed";
    res.status(500).json({ error: msg });
  }
});

adminRouter.put("/ui-strings", async (req, res) => {
  const parsed = uiStringPut.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ error: "Invalid body", details: parsed.error.flatten() });
    return;
  }
  const { key, locale, value } = parsed.data;
  try {
    const result = await pool.query(
      `INSERT INTO ui_strings (key, locale, value) VALUES ($1, $2, $3)
       ON CONFLICT (key, locale) DO UPDATE SET value = EXCLUDED.value
       RETURNING id, key, locale, value`,
      [key, locale, value],
    );
    res.json({ string: result.rows[0] });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Upsert failed";
    res.status(500).json({ error: msg });
  }
});

adminRouter.patch("/users/:id", async (req, res) => {
  const id = z.string().uuid().safeParse(req.params.id);
  if (!id.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const parsed = userAdminPatch.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: "Invalid body",
      details: parsed.error.flatten(),
    });
    return;
  }
  const p = parsed.data;
  const hasUpdate =
    p.displayName !== undefined ||
    p.kp !== undefined ||
    p.wealthScore !== undefined ||
    p.coins !== undefined ||
    p.gems !== undefined ||
    p.xp !== undefined ||
    p.gerLevel !== undefined ||
    p.sheep !== undefined ||
    p.goat !== undefined ||
    p.cow !== undefined ||
    p.horse !== undefined ||
    p.camel !== undefined;
  if (!hasUpdate) {
    res.status(400).json({ error: "No fields to update" });
    return;
  }
  try {
    const cur = await pool.query(
      `SELECT display_name, profile, progress FROM app_users WHERE id = $1`,
      [id.data],
    );
    if (cur.rowCount === 0) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const row = cur.rows[0] as {
      display_name: string | null;
      profile: unknown;
      progress: unknown;
    };
    const merged = mergeUserEconomy(row.profile, row.progress, p);
    const newDisplay =
      p.displayName !== undefined ? p.displayName.trim() : row.display_name;

    const result = await pool.query(
      `UPDATE app_users SET display_name = $1, profile = $2::jsonb, progress = $3::jsonb, updated_at = now()
       WHERE id = $4
       RETURNING id, firebase_uid, email, display_name, hero_id, profile, progress, created_at, updated_at`,
      [
        newDisplay,
        JSON.stringify(merged.profile),
        JSON.stringify(merged.progress),
        id.data,
      ],
    );
    res.json({ user: result.rows[0] });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Update failed";
    res.status(500).json({ error: msg });
  }
});

adminRouter.get("/stations/:slug/games", async (req, res) => {
  const slug = z.string().min(1).safeParse(req.params.slug);
  if (!slug.success) {
    res.status(400).json({ error: "Invalid slug" });
    return;
  }
  try {
    const result = await pool.query(
      `SELECT g.id, g.slug, g.name_mn, g.name_en, g.description_mn, g.description_en, g.is_available,
              sg.sort_order, sg.reward_hint_mn, sg.reward_hint_en
       FROM station_games sg
       INNER JOIN games g ON g.id = sg.game_id
       WHERE sg.station_slug = $1
       ORDER BY sg.sort_order ASC, g.name_en ASC`,
      [slug.data],
    );
    res.json({ games: result.rows });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Query failed";
    res.status(500).json({ error: msg });
  }
});

adminRouter.put("/stations/:slug/games", async (req, res) => {
  const slug = z.string().min(1).safeParse(req.params.slug);
  if (!slug.success) {
    res.status(400).json({ error: "Invalid slug" });
    return;
  }
  const parsed = stationGamesPutBody.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ error: "Invalid body", details: parsed.error.flatten() });
    return;
  }
  const { gameIds } = parsed.data;
  const client = await pool.connect();
  try {
    const ex = await client.query(
      `SELECT 1 FROM map_stations WHERE slug = $1`,
      [slug.data],
    );
    if (ex.rowCount === 0) {
      res.status(404).json({ error: "Station not found" });
      return;
    }
    await client.query("BEGIN");
    await client.query(`DELETE FROM station_games WHERE station_slug = $1`, [
      slug.data,
    ]);
    for (let i = 0; i < gameIds.length; i++) {
      await client.query(
        `INSERT INTO station_games (station_slug, game_id, sort_order)
         VALUES ($1, $2, $3)`,
        [slug.data, gameIds[i], i],
      );
    }
    await client.query("COMMIT");
    const list = await pool.query(
      `SELECT g.id, g.slug, g.name_mn, g.name_en, sg.sort_order
       FROM station_games sg
       INNER JOIN games g ON g.id = sg.game_id
       WHERE sg.station_slug = $1
       ORDER BY sg.sort_order ASC`,
      [slug.data],
    );
    res.json({ ok: true, games: list.rows });
  } catch (e: unknown) {
    try {
      await client.query("ROLLBACK");
    } catch {
      /* */
    }
    const msg = e instanceof Error ? e.message : "Update failed";
    res.status(500).json({ error: msg });
  } finally {
    client.release();
  }
});

const onisogoSlugParam = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9_-]+$/);

const onisogoUpsertBody = z.object({
  slug: onisogoSlugParam,
  wx: z.number().int(),
  wz: z.number().int(),
  icon: z.string().max(32).optional().default("❓"),
  title_mn: z.string().min(1).max(4000),
  title_en: z.string().min(1).max(4000),
  question_mn: z.string().min(1).max(12000),
  question_en: z.string().min(1).max(12000),
  answer_correct_mn: z.string().min(1).max(800),
  answer_correct_en: z.string().min(1).max(800),
  wrong_1_mn: z.string().min(1).max(800),
  wrong_1_en: z.string().min(1).max(800),
  wrong_2_mn: z.string().min(1).max(800),
  wrong_2_en: z.string().min(1).max(800),
  wrong_3_mn: z.string().min(1).max(800),
  wrong_3_en: z.string().min(1).max(800),
  coin_reward: z.number().int().min(1).max(999).optional().default(18),
  sort_order: z.number().int().optional().default(0),
  is_active: z.boolean().optional().default(true),
});

const onisogoPatchBody = onisogoUpsertBody.partial().omit({ slug: true });

adminRouter.get("/onisogo", async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, slug, wx, wz, icon, title_mn, title_en, question_mn, question_en,
              answer_correct_mn, answer_correct_en,
              wrong_1_mn, wrong_1_en, wrong_2_mn, wrong_2_en, wrong_3_mn, wrong_3_en,
              coin_reward, sort_order, is_active, created_at, updated_at
       FROM map_onisogo
       ORDER BY sort_order ASC, slug ASC`,
    );
    res.json({ rows: result.rows });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Query failed";
    res.status(500).json({ error: msg });
  }
});

adminRouter.post("/onisogo", async (req, res) => {
  const parsed = onisogoUpsertBody.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ error: "Invalid body", details: parsed.error.flatten() });
    return;
  }
  const b = parsed.data;
  try {
    const result = await pool.query(
      `INSERT INTO map_onisogo (
         slug, wx, wz, icon, title_mn, title_en, question_mn, question_en,
         answer_correct_mn, answer_correct_en,
         wrong_1_mn, wrong_1_en, wrong_2_mn, wrong_2_en, wrong_3_mn, wrong_3_en,
         coin_reward, sort_order, is_active
       ) VALUES (
         $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19
       )
       RETURNING id, slug, wx, wz, icon, title_mn, title_en, question_mn, question_en,
                 answer_correct_mn, answer_correct_en,
                 wrong_1_mn, wrong_1_en, wrong_2_mn, wrong_2_en, wrong_3_mn, wrong_3_en,
                 coin_reward, sort_order, is_active, created_at, updated_at`,
      [
        b.slug,
        b.wx,
        b.wz,
        b.icon,
        b.title_mn,
        b.title_en,
        b.question_mn,
        b.question_en,
        b.answer_correct_mn,
        b.answer_correct_en,
        b.wrong_1_mn,
        b.wrong_1_en,
        b.wrong_2_mn,
        b.wrong_2_en,
        b.wrong_3_mn,
        b.wrong_3_en,
        b.coin_reward,
        b.sort_order,
        b.is_active,
      ],
    );
    res.json({ row: result.rows[0] });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Insert failed";
    if (/unique|duplicate/i.test(msg)) {
      res.status(409).json({ error: "Slug already exists" });
      return;
    }
    res.status(500).json({ error: msg });
  }
});

adminRouter.put("/onisogo/:slug", async (req, res) => {
  const slug = onisogoSlugParam.safeParse(req.params.slug);
  if (!slug.success) {
    res.status(400).json({ error: "Invalid slug" });
    return;
  }
  const parsed = onisogoPatchBody.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ error: "Invalid body", details: parsed.error.flatten() });
    return;
  }
  const p = parsed.data;
  const fields: string[] = [];
  const values: unknown[] = [];
  let n = 1;
  const push = (col: string, v: unknown) => {
    fields.push(`${col} = $${n++}`);
    values.push(v);
  };
  if (p.wx !== undefined) push("wx", p.wx);
  if (p.wz !== undefined) push("wz", p.wz);
  if (p.icon !== undefined) push("icon", p.icon);
  if (p.title_mn !== undefined) push("title_mn", p.title_mn);
  if (p.title_en !== undefined) push("title_en", p.title_en);
  if (p.question_mn !== undefined) push("question_mn", p.question_mn);
  if (p.question_en !== undefined) push("question_en", p.question_en);
  if (p.answer_correct_mn !== undefined)
    push("answer_correct_mn", p.answer_correct_mn);
  if (p.answer_correct_en !== undefined)
    push("answer_correct_en", p.answer_correct_en);
  if (p.wrong_1_mn !== undefined) push("wrong_1_mn", p.wrong_1_mn);
  if (p.wrong_1_en !== undefined) push("wrong_1_en", p.wrong_1_en);
  if (p.wrong_2_mn !== undefined) push("wrong_2_mn", p.wrong_2_mn);
  if (p.wrong_2_en !== undefined) push("wrong_2_en", p.wrong_2_en);
  if (p.wrong_3_mn !== undefined) push("wrong_3_mn", p.wrong_3_mn);
  if (p.wrong_3_en !== undefined) push("wrong_3_en", p.wrong_3_en);
  if (p.coin_reward !== undefined) push("coin_reward", p.coin_reward);
  if (p.sort_order !== undefined) push("sort_order", p.sort_order);
  if (p.is_active !== undefined) push("is_active", p.is_active);
  if (fields.length === 0) {
    res.status(400).json({ error: "No fields to update" });
    return;
  }
  fields.push(`updated_at = now()`);
  values.push(slug.data);
  try {
    const result = await pool.query(
      `UPDATE map_onisogo SET ${fields.join(", ")} WHERE slug = $${n}
       RETURNING id, slug, wx, wz, icon, title_mn, title_en, question_mn, question_en,
                 answer_correct_mn, answer_correct_en,
                 wrong_1_mn, wrong_1_en, wrong_2_mn, wrong_2_en, wrong_3_mn, wrong_3_en,
                 coin_reward, sort_order, is_active, created_at, updated_at`,
      values,
    );
    if (result.rowCount === 0) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json({ row: result.rows[0] });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Update failed";
    res.status(500).json({ error: msg });
  }
});

adminRouter.delete("/onisogo/:slug", async (req, res) => {
  const slug = onisogoSlugParam.safeParse(req.params.slug);
  if (!slug.success) {
    res.status(400).json({ error: "Invalid slug" });
    return;
  }
  try {
    const result = await pool.query(`DELETE FROM map_onisogo WHERE slug = $1`, [
      slug.data,
    ]);
    if (result.rowCount === 0) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Delete failed";
    res.status(500).json({ error: msg });
  }
});
