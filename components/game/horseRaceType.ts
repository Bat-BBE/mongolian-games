import type { ShagaiSide } from "./shagai";

export type { ShagaiSide };

export type Racer = "player" | "robot";

export type MatchPhase =
  | "idle"
  | "throwing"
  | "settling"
  | "playerResult"
  | "robotThinking"
  | "robotResult"
  | "matchOver";

export interface RaceTurnResult {
  turn: Racer;
  sides: ShagaiSide[];
  horseCount: number;
  fromPosition: number;
  toPosition: number;
  throwNumber: number;
}

export interface RaceState {
  phase: MatchPhase;
  history: RaceTurnResult[];
  totalThrows: number;
  playerPosition: number;
  robotPosition: number;
  robotSides: ShagaiSide[] | null;
  robotHorseCount: number;
  lastPlayerHorseCount: number;
  winner: Racer | null;
}

// Track length: 20 "horse-landed" shagai laid in a row form the racing
// course. A racer wins once their piece reaches or passes the final shagai.
export const TRACK_LENGTH = 20;

export const INITIAL_RACE_STATE: RaceState = {
  phase: "idle",
  history: [],
  totalThrows: 0,
  playerPosition: 0,
  robotPosition: 0,
  robotSides: null,
  robotHorseCount: 0,
  lastPlayerHorseCount: 0,
  winner: null,
};

export function countHorses(sides: ShagaiSide[]): number {
  return sides.filter((s) => s === "horse").length;
}

// Tuned weights so a race lasts a reasonable number of turns (roughly
// 1.2 horses per 4-shagai throw on average → ~17 throws to finish the
// 20-shagai track). Horse is noticeably more common than in the base
// shagai distribution because every throw that yields zero horses is a
// wasted turn for the player.
export function rollHorseRaceSide(): ShagaiSide {
  const r = Math.random();
  if (r < 0.3) return "horse";
  if (r < 0.55) return "sheep";
  if (r < 0.85) return "goat";
  return "camel";
}

export function rollHorseRaceSides(): ShagaiSide[] {
  return [0, 1, 2, 3].map(() => rollHorseRaceSide());
}
