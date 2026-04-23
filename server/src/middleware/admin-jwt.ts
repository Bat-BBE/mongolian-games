import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config.js";

export function requireAdminJwt(req: Request, res: Response, next: NextFunction) {
  const secret = env.JWT_SECRET;
  if (!secret) {
    res.status(503).json({ error: "JWT_SECRET is not configured" });
    return;
  }
  const auth = req.headers.authorization;
  if (typeof auth !== "string" || !auth.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const token = auth.slice(7).trim();
  try {
    jwt.verify(token, secret);
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
