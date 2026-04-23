import { Router } from "express";
import { queryDbHealth } from "../db.js";
import { getFirebaseApp } from "../firebase-admin.js";

export const healthRouter = Router();

const DB_HEALTH_MS = 5_000;

healthRouter.get("/health", async (_req, res) => {
  let dbOk = false;
  try {
    dbOk = await Promise.race([
      queryDbHealth(),
      new Promise<boolean>((_, reject) =>
        setTimeout(
          () => reject(new Error("db health timeout")),
          DB_HEALTH_MS,
        ),
      ),
    ]);
  } catch {
    dbOk = false;
  }
  const firebaseConfigured = getFirebaseApp() !== null;
  res.json({
    ok: dbOk,
    db: dbOk,
    firebaseAdmin: firebaseConfigured,
  });
});
