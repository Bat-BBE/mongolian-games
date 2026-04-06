import { initializeApp, getApps, type FirebaseOptions } from "firebase/app";
import { getDatabase, type Database } from "firebase/database";
import { getAuth, type Auth } from "firebase/auth";

const defaultDatabaseURL =
  process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ??
  "https://mongolian-games-default-rtdb.firebaseio.com/";

function buildFirebaseOptions(): FirebaseOptions {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim();
  if (!apiKey) {
    return { databaseURL: defaultDatabaseURL };
  }
  return {
    apiKey,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
    databaseURL: defaultDatabaseURL,
  };
}

const app = !getApps().length ? initializeApp(buildFirebaseOptions()) : getApps()[0]!;

export const db: Database = getDatabase(app);

/** True when web client env has Firebase Auth keys (Google sign-in, etc.). */
export function isFirebaseAuthConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim());
}

export function getFirebaseAuth(): Auth | null {
  if (typeof window === "undefined") return null;
  if (!isFirebaseAuthConfigured()) return null;
  return getAuth(app);
}
