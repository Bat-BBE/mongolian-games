import type { ShagaiSide } from "./shagai";

export type { ShagaiSide };

export type Racer = "player" | "robot";

type MatchPhase =
  | "idle"
  | "throwing"
  | "settling"
  | "playerResult"
  | "robotThinking"
  | "robotResult"
  | "matchOver";

export interface RaceTurnResult {
  turn: Racer;
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

