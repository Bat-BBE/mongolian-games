import { countHorses } from "./horseRaceType";
import type { ShagaiSide } from "./shagai";

export { countHorses };
export type { ShagaiSide };

export const TWELVE_TARGET = 12;
export type TwelvePick = 2 | 3 | 4;

/**
 * Нийт квот: 4 шагайгаар яг 4 удаа, 3-аар яг 3 удаа шиднэ; дараа нь зөвхөн 2.
 * Эдгээр удаануудыг хэзээ, ямар дарааллаар ашиглахыг тоглогч сонгоно (2-оор
 * квот дуусах хүртэл 2/3/4-ийн аль нэгийг зөвшөөрнө).
 */
export const TWELVE_TIER1_THROWS = 4;
export const TWELVE_TIER2_THROWS = 3;

/** 4-өөр шидсэн дууссан удаа, 3-аар шидсэн дууссан удаа (2-оор квот тоолохгүй). */
export function getAllowedTwelvePicks(
  throwsAt4: number,
  throwsAt3: number,
): TwelvePick[] {
  const tier3Only =
    throwsAt4 >= TWELVE_TIER1_THROWS && throwsAt3 >= TWELVE_TIER2_THROWS;
  if (tier3Only) return [2];
  const out: TwelvePick[] = [];
  if (throwsAt4 < TWELVE_TIER1_THROWS) out.push(4);
  if (throwsAt3 < TWELVE_TIER2_THROWS) out.push(3);
  out.push(2);
  return out;
}

export function isTwelvePickAllowed(
  n: TwelvePick,
  throwsAt4: number,
  throwsAt3: number,
): boolean {
  return getAllowedTwelvePicks(throwsAt4, throwsAt3).includes(n);
}

/** Робот: боломжит хамгийн олон шагайгаар шиднө. */
export function pickCpuTwelveDefault(
  throwsAt4: number,
  throwsAt3: number,
): TwelvePick {
  const a = getAllowedTwelvePicks(throwsAt4, throwsAt3);
  return Math.max(...a) as TwelvePick;
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
