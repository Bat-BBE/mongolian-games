import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import type { ServiceAccount } from "firebase-admin";
import { env } from "./config.js";

let app: App | null = null;

export function getFirebaseApp(): App | null {
  if (app) return app;
  const json = env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!json) {
    return null;
  }
  let credentials: ServiceAccount;
  try {
    credentials = JSON.parse(json) as ServiceAccount;
  } catch {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON must be valid JSON");
  }
  if (getApps().length === 0) {
    app = initializeApp({
      credential: cert(credentials),
      ...(env.FIREBASE_DATABASE_URL
        ? { databaseURL: env.FIREBASE_DATABASE_URL }
        : {}),
    });
  } else {
    app = getApps()[0]!;
  }
  return app;
}
