import { countHorses } from "./horseRaceType";
import type { ShagaiSide } from "./shagai";

export { countHorses };
export type { ShagaiSide };

export const TWELVE_TARGET = 12;
export type TwelvePick = 2 | 3 | 4;

export type TwelvePhase =
  | "idle"
  | "throwing"
  | "settling"
  | "result"
  | "cpuWait"
  | "matchOver";

export type TwelveMode = "local2" | "vsCpu";
export type TurnSlot = 0 | 1;

export function isTwelveGameOver(
  a: number,
  b: number,
): { over: boolean; winner: 0 | 1 | null } {
  if (a >= TWELVE_TARGET) return { over: true, winner: 0 };
  if (b >= TWELVE_TARGET) return { over: true, winner: 1 };
  return { over: false, winner: null };
}
