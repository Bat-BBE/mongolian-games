import { Router } from "express";
import { pool } from "../db.js";

export const gamesPublicRouter = Router();

gamesPublicRouter.get("/games", async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, slug, name_mn, name_en, description_mn, 
      description_en, 
      image_url, is_available, show_on_home, sort_order,
              created_at, updated_at
       FROM games
       ORDER BY sort_order ASC, name_en ASC`,
    );
    res.json({ games: result.rows });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Query failed";
    res.status(500).json({ error: msg });
  }
});
