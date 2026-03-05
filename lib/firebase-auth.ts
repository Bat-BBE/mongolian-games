import { ref, set, get } from "firebase/database";
import { db } from "./firebase";
import { emailToKey } from "./emailKey";
import type { HeroId } from "@/components/hero-select/hero-strings";
import { HEROES } from "@/components/hero-select/hero-data";

export async function getUserByEmail(email: string) {
  const key = emailToKey(email);
  const snapshot = await get(ref(db, `users/${key}`));
  if (!snapshot.exists()) return null;
  return snapshot.val();
}

export async function registerEmail(
  email: string,
  heroId: HeroId
) {
  const key = emailToKey(email);

  const hero = HEROES.find((h) => h.id === heroId);
  if (!hero) throw new Error("Hero not found");

  await set(ref(db, `users/${key}`), {
    profile: {
      name: email,
      heroId: hero.id,
      heroName: hero.name,
      heroTitle: hero.title,
      heroImages: hero.imageUrl,
      level: 1,
      kp: 0,
      accentColor: hero.color,
      stats: hero.stats,
    },
    progress: {
      xp: 0,
      xpMax: 100,
      currentStationId: "orkhon",
      doneStationIds: [],
    },
    meta: {
      createdAt: Date.now(),
    },
  });
}