import { detectShagaiSide, weightedTraditionalSide } from "./shagai";

export type ShagaiSide = "horse" | "sheep" | "goat" | "camel";

export type RoundTurn = "player" | "robot";

export interface RoundResult {
  turn: RoundTurn;
  sides: ShagaiSide[];
  points: number;
  /** Localized short label describing which scoring rule matched (or ""). */
  label: string;
  throwNumber: number;
  /** The throw pushed the cumulative score past TARGET_SCORE. */
  bust: boolean;
  /** The cumulative score landed exactly on TARGET_SCORE. */
  exactWin: boolean;
  /** 4 морь — тоглоом шууд дуусч энэ ээлжийн тоглогч ялна. */
  instantMatchWin?: boolean;
}

export type MatchPhase =
  | "idle"
  | "throwing"
  | "settling"
  | "playerResult"
  | "robotThinking"
  | "robotResult"
  | "matchOver";

export interface GameState {
  phase: MatchPhase;
  history: RoundResult[];
  totalThrows: number;
  playerScore: number;
  robotScore: number;
  streak: number;
  bestStreak: number;
  robotSides: ShagaiSide[] | null;
  robotPoints: number;
  robotLabel: string;
  lastPlayerPoints: number;
  lastPlayerLabel: string;
  winner: "player" | "robot" | null;
}

export const SHAGAI_INFO: Record<
  ShagaiSide,
  {
    nameMn: string;
    nameEn: string;
    symbol: string;
    color: string;
    glow: string;
    mongol: string;
  }
> = {
  horse: {
    nameMn: "Морь",
    nameEn: "Horse",
    symbol: "🐴",
    color: "#f0c040",
    glow: "rgba(240,192,64,0.6)",
    mongol: "ᠮᠣᠷᠢ",
  },
  sheep: {
    nameMn: "Хонь",
    nameEn: "Sheep",
    symbol: "🐑",
    color: "#90d890",
    glow: "rgba(144,216,144,0.6)",
    mongol: "ᠬᠣᠨᠢ",
  },
  goat: {
    nameMn: "Ямаа",
    nameEn: "Goat",
    symbol: "🐐",
    color: "#c8956a",
    glow: "rgba(200,149,106,0.6)",
    mongol: "ᠢᠮᠠᠭ᠎ᠠ",
  },
  camel: {
    nameMn: "Тэмээ",
    nameEn: "Camel",
    symbol: "🐫",
    color: "#e0a050",
    glow: "rgba(224,160,80,0.6)",
    mongol: "ᠲᠡᠮᠡᠭᠡ",
  },
};

export function sideName(side: ShagaiSide, language: "mn" | "en"): string {
  return language === "en" ? SHAGAI_INFO[side].nameEn : SHAGAI_INFO[side].nameMn;
}

export function detectSide(rotX: number, rotZ: number): ShagaiSide {
  return detectShagaiSide(rotX, rotZ);
}

/**
 * Scoring table for the "Target 32" (Homboroi) mode.
 *
 * - 4 морь → шууд ялалт (`instantMatchWin`, оноо нэмэхгүй)
 * - Four distinct sides → 8 pts ("Дөрвөн бэрх")
 * - Four identical (4 хонь / 4 тэмээ / 4 ямаа) → 4 pts
 * - Ямар ч 2+2 хос (хоёр төрөл тус бүр 2) → 2 pts
 * - Everything else → 0 pts
 */
export type ScoreLabelKey =
  | ""
  | "berkh"
  | "ijil"
  | "hoyorHoyor"
  | "durvenMori";

export function scoreTarget(sides: ShagaiSide[]): {
  points: number;
  labelKey: ScoreLabelKey;
  instantMatchWin: boolean;
} {
  if (sides.length !== 4)
    return { points: 0, labelKey: "", instantMatchWin: false };
  const counts: Record<ShagaiSide, number> = {
    horse: 0,
    sheep: 0,
    goat: 0,
    camel: 0,
  };
  for (const s of sides) counts[s]++;
  const unique = (Object.values(counts) as number[]).filter((c) => c > 0).length;

  if (counts.horse === 4) {
    return { points: 0, labelKey: "durvenMori", instantMatchWin: true };
  }
  if (unique === 4) return { points: 8, labelKey: "berkh", instantMatchWin: false };
  if (unique === 1) return { points: 4, labelKey: "ijil", instantMatchWin: false };

  const nonZero = (Object.values(counts) as number[]).filter((c) => c > 0);
  const isTwoPairs =
    nonZero.length === 2 && nonZero.every((c) => c === 2);
  if (isTwoPairs) {
    return { points: 2, labelKey: "hoyorHoyor", instantMatchWin: false };
  }

  return { points: 0, labelKey: "", instantMatchWin: false };
}

/** Generate a 4-shagai roll for the robot using the shared weighted
 *  traditional probabilities so the robot's throws "feel" like a real human's. */
export function rollRobotSides(): ShagaiSide[] {
  return [0, 1, 2, 3].map(() => weightedTraditionalSide() as ShagaiSide);
}

/** Exact score required to win. Over this value = bust. */
export const TARGET_SCORE = 32;

export const INITIAL_STATE: GameState = {
  phase: "idle",
  history: [],
  totalThrows: 0,
  playerScore: 0,
  robotScore: 0,
  streak: 0,
  bestStreak: 0,
  robotSides: null,
  robotPoints: 0,
  robotLabel: "",
  lastPlayerPoints: 0,
  lastPlayerLabel: "",
  winner: null,
};
