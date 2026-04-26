import type { ShagaiSide } from "./shagai";

export type { ShagaiSide };

/** Нийт дэвсгэрт байгаа «морь»-ны тоо (төв сан). */
export const BERKH12_TOTAL_MORIES = 48;
/** 12 бэрх: нэг удаа орхих шагайн тоо. */
export const BERKH12_PIECE_COUNT = 12;
/** Сүүлд хааяа тоглолт дуусгах. */
export const BERKH12_MAX_TURNS = 200;

export type Berkh12Phase =
  | "idle"
  | "throwing"
  | "settling"
  | "result"
  | "botWait"
  | "matchOver";

export type LocalPlayerCount = 2 | 3 | 4;
export type Berkh12Mode = "local" | "vsCpu";

export function countHorses(sides: ShagaiSide[]): number {
  return sides.filter((s) => s === "horse").length;
}

export function countCamels(sides: ShagaiSide[]): number {
  return sides.filter((s) => s === "camel").length;
}

/**
 * «Эсрэг нар» — ээлжийн дараалалд (p-1, p-2, …) эхний эсэргээр.
 * Тэмээгээр нэг мори тутамд: эхний нэг, дараа нь дараагийн гэх мэргэжилтэй.
 */
export function counterSunOrder(nPlayers: number, p: number): number[] {
  const o: number[] = [];
  for (let k = 1; k < nPlayers; k++) {
    o.push((p - k + nPlayers * 4) % nPlayers);
  }
  return o;
}

export function nextClockwiseActive(
  nPlayers: number,
  from: number,
  active: (boolean | undefined)[] | boolean[],
): number {
  for (let k = 1; k <= nPlayers; k++) {
    const j = (from + k) % nPlayers;
    if (active[j] !== false) return j;
  }
  return from;
}

export type ApplyTurnState = {
  mories: number[];
  center: number;
  active: boolean[];
  h: number;
  c: number;
  eliminated: number;
};

/**
 * h морь: төвөөс morie авна. c тэмээ: сөрөгчдөд 1-ээр, эсрэг нарын дарааллаар;
 * нийлүүлэх морьгүй бол хасагдана, үлдсэн нь төврүү.
 */
export function applyBerkhTurn(
  mories: number[],
  center: number,
  active: boolean[],
  p: number,
  sides: ShagaiSide[],
  nPlayers: number,
): ApplyTurnState {
  const h = countHorses(sides);
  const c = countCamels(sides);
  const nextM = mories.map((x) => x);
  const nextA = active.map((x) => x);
  let nextC = center;
  let elim = -1;

  if (!nextA[p] || p < 0) {
    return {
      mories: nextM,
      center: nextC,
      active: nextA,
      h,
      c,
      eliminated: -1,
    };
  }

  if (c > 0) {
    if (nextM[p]! < c) {
      nextC += nextM[p]!;
      nextM[p] = 0;
      nextA[p] = false;
      elim = p;
    } else {
      const order = counterSunOrder(nPlayers, p);
      for (let i = 0; i < c; i++) {
        const t = order[i % order.length] ?? order[0]!;
        if (t !== p) nextM[t] = (nextM[t] ?? 0) + 1;
      }
      nextM[p]! -= c;
    }
  }

  if (nextA[p] && h > 0) {
    const take = Math.min(h, nextC);
    nextM[p]! += take;
    nextC -= take;
  }

  return {
    mories: nextM,
    center: nextC,
    active: nextA,
    h,
    c,
    eliminated: elim,
  };
}

export function hasFullWin(mories: number[], p: number, total: number): boolean {
  return (mories[p] ?? 0) >= total;
}

export function countActivePlayers(active: boolean[]): number {
  return active.filter(Boolean).length;
}

export function rollBerkh12Side(): ShagaiSide {
  const r = Math.random();
  if (r < 0.25) return "horse";
  if (r < 0.5) return "sheep";
  if (r < 0.75) return "goat";
  return "camel";
}

export function rollBerkh12Sides(n = BERKH12_PIECE_COUNT): ShagaiSide[] {
  return Array.from({ length: n }, () => rollBerkh12Side());
}
