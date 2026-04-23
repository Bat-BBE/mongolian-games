const STORAGE_KEY = "mongol_hero_change_unlock_at";
/** Баатар солих хоорондын хугацаа (24 цаг). */
export const HERO_CHANGE_COOLDOWN_MS = 24 * 60 * 60 * 1000;

export function getHeroChangeUnlockAt(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

export function setHeroChangeCooldownFromNow(): void {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      String(Date.now() + HERO_CHANGE_COOLDOWN_MS)
    );
  } catch {
    /* ignore */
  }
}

export function getHeroChangeRemainingMs(): number {
  const unlock = getHeroChangeUnlockAt();
  if (unlock == null) return 0;
  return Math.max(0, unlock - Date.now());
}

export function formatCooldownHMS(ms: number, lang: "mn" | "en"): string {
  if (ms <= 0) return lang === "mn" ? "Бэлэн" : "Ready";
  const totalSec = Math.ceil(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  if (lang === "mn") {
    return `${h} ц ${pad(m)} мин ${pad(s)} с`;
  }
  return `${h}h ${pad(m)}m ${pad(s)}s`;
}
