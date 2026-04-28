export type ShagaiSide = "horse" | "sheep" | "goat" | "camel";

export interface ShagaiThrow {
  id: number;
  side: ShagaiSide;
  settled: boolean;
}

export type RoundTurn = "player" | "robot";

export interface RoundResult {
  turn: RoundTurn;
  sides: ShagaiSide[];
  isDorvenBerkh: boolean;
  points: number;
  throwNumber: number;
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
  lastPlayerPoints: number;
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
  return language === "en"
    ? SHAGAI_INFO[side].nameEn
    : SHAGAI_INFO[side].nameMn;
}

import { detectShagaiSide, weightedTraditionalSide } from "./shagai";

export function detectSide(rotX: number, rotZ: number): ShagaiSide {
  return detectShagaiSide(rotX, rotZ);
}

export function isDorvenBerkh(sides: ShagaiSide[]): boolean {
  if (sides.length < 4) return false;
  const set = new Set(sides);
  return set.size === 4;
}

export function scoreRoll(sides: ShagaiSide[]): {
  points: number;
  unique: number;
} {
  const unique = new Set(sides).size;
  if (unique === 4) return { points: 12, unique };
  if (unique === 3) return { points: 5, unique };
  if (unique === 2) return { points: 2, unique };
  return { points: 8, unique };
}

/** Generate a robot roll of 4 shagai using the shared traditional probabilities. */
export function rollRobotSides(): ShagaiSide[] {
  return [0, 1, 2, 3].map(() => weightedTraditionalSide() as ShagaiSide);
}

/** First side to reach this wins the match. */
export const TARGET_SCORE = 30;

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
  lastPlayerPoints: 0,
};
