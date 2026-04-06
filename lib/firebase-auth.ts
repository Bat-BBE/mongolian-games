import { ref, set, get } from "firebase/database";
import { db } from "./firebase";
import { emailToKey } from "./emailKey";
import type { HeroId } from "@/components/hero-select/hero-strings";
import { HEROES } from "@/components/hero-select/hero-data";
import { syncAppUserSimple, getGameProfileByEmail } from "@/lib/api";

function isPlainRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function defaultProgress(): Record<string, unknown> {
  return {
    xp: 0,
    xpMax: 100,
    currentStationId: "ulaanbaatar",
    journeyDay: 1,
    doneStationIds: [],
  };
}

function mergeProgress(raw: unknown): Record<string, unknown> {
  const base = defaultProgress();
  if (!isPlainRecord(raw)) return base;
  const done = raw.doneStationIds;
  return {
    ...base,
    ...raw,
    doneStationIds: Array.isArray(done) ? done : base.doneStationIds,
  };
}

/**
 * Dashboard / hero flow: read PostgreSQL first; if missing or empty profile, use Realtime DB and backfill PG.
 */
export async function getUserByEmail(email: string) {
  const trimmed = email.trim();
  try {
    const gp = await getGameProfileByEmail(trimmed);
    if (gp?.user) {
      const prof = gp.user.profile;
      if (
        isPlainRecord(prof) &&
        Object.keys(prof).length > 0 &&
        prof.heroName != null
      ) {
        return {
          profile: prof,
          progress: mergeProgress(gp.user.progress),
          meta: { createdAt: new Date(gp.user.created_at).getTime() },
        };
      }
    }
  } catch {
    /* API unavailable — try Firebase */
  }

  const key = emailToKey(trimmed);
  const snapshot = await get(ref(db, `users/${key}`));
  if (!snapshot.exists()) return null;
  const data = snapshot.val() as {
    profile?: unknown;
    progress?: unknown;
    meta?: { createdAt?: number };
  };

  const p = isPlainRecord(data.profile) ? data.profile : {};
  const pr = isPlainRecord(data.progress) ? data.progress : {};

  try {
    await syncAppUserSimple({
      email: trimmed,
      displayName: typeof p.name === "string" ? p.name : trimmed,
      heroId: typeof p.heroId === "string" ? p.heroId : undefined,
      profile: p,
      progress: pr,
    });
  } catch {
    /* PG optional */
  }

  return {
    profile: p,
    progress: mergeProgress(pr),
    meta: data.meta ?? { createdAt: Date.now() },
  };
}

export async function registerEmail(email: string, heroId: HeroId) {
  const key = emailToKey(email);
  const hero = HEROES.find((h) => h.id === heroId);
  if (!hero) throw new Error("Hero not found");

  const profile = {
    name: email,
    heroId: hero.id,
    heroName: hero.name,
    heroTitle: hero.title,
    heroImages: hero.imageUrl,
    level: 1,
    kp: 0,
    accentColor: hero.color,
    stats: hero.stats,
  };
  const progress = {
    xp: 0,
    xpMax: 100,
    currentStationId: "ulaanbaatar",
    journeyDay: 1,
    doneStationIds: [] as string[],
  };
  const meta = { createdAt: Date.now() };

  await set(ref(db, `users/${key}`), {
    profile,
    progress,
    meta,
  });

  try {
    await syncAppUserSimple({
      email,
      displayName: email,
      heroId: hero.id,
      profile: profile as Record<string, unknown>,
      progress: progress as Record<string, unknown>,
    });
  } catch {
    /* PG optional */
  }
}
