import { countHorses } from "./horseRaceType";
import type { ShagaiSide } from "./shagai";

export { countHorses };
export type { ShagaiSide };

export const TWELVE_TARGET = 12;
export type TwelvePick = 2 | 3 | 4;

/** Эхнээс: 4 удаа 4 шагай, 3 удаа 3 шагай, дараа нь 2-оор (хязгааргүй). */
export const TWELVE_TIER1_THROWS = 4;
export const TWELVE_TIER2_THROWS = 3;

/** `completed` = энэ удаа шидэхээр дууссан шидэлтийн тоо. */
export function getRequiredPickAfterThrows(
  completedThrows: number,
): TwelvePick {
  if (completedThrows < TWELVE_TIER1_THROWS) return 4;
  if (
    completedThrows <
    TWELVE_TIER1_THROWS + TWELVE_TIER2_THROWS
  ) {
    return 3;
  }
  return 2;
}

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
