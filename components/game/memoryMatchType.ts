import type { ShagaiSide } from "./fourBonusType";

export const GRID_SIZE = 16;
export const PAIR_COUNT = 8;
/** Seconds to find all pairs (1 minute) */
export const MATCH_TIME_LIMIT_SEC = 60;

export interface MemoryCard {
  id: number;
  side: ShagaiSide;
  /** Index within same side (0,1) for each of two pairs per symbol */
  pairGroup: number;
}

/** Two copies of each animal pair → 4 cards per side → 8 pairs / 16 cards */
export function buildDeck(): MemoryCard[] {
  const sides: ShagaiSide[] = ["sheep", "horse", "goat", "camel"];
  const out: MemoryCard[] = [];
  let id = 0;
  for (const side of sides) {
    for (let pairGroup = 0; pairGroup < 2; pairGroup++) {
      out.push({ id: id++, side, pairGroup });
      out.push({ id: id++, side, pairGroup });
    }
  }
  return out;
}

export function shuffleDeck<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/** Mulberry32 — ижил seed → ижил дараалал (online хос ол). */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffleDeckSeeded<T>(arr: T[], seed: number): T[] {
  const rand = mulberry32(seed >>> 0);
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}
