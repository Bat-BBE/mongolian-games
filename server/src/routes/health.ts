import { Router } from "express";
import { queryDbHealth } from "../db.js";
import { getFirebaseApp } from "../firebase-admin.js";

export const healthRouter = Router();

healthRouter.get("/health", async (_req, res) => {
  let dbOk = false;
  try {
    dbOk = await queryDbHealth();
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
