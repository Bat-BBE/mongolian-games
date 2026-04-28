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
  /** In multiplayer, who threw (when set, UI shows a name). */
  throwerId?: string;
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
