import type { ShagaiSide } from "./shagai";

export type { ShagaiSide };

export const BERKH12_START_STACK = 8;
/** Нэг ээлжинд газарт унагах шагай (уламжлал: 4-өөр тоолно) */
export const BERKH12_THROW_COUNT = 4;
/** Хуучин нэршилтэй нийцүүлэх (шидэлт = THROW_COUNT) */
export const BERKH12_PIECE_COUNT = BERKH12_THROW_COUNT;
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

export type Berkh12TransferSummary = {
  /** Морь авсан суудал (өмнөх идэвхтэй), байхгүй бол null */
  horseFromSeat: number | null;
  horsesTaken: number;
  /** Тэмээ төлсөн суудал (дараагийн идэвхтэй), байхгүй бол null */
  camelToSeat: number | null;
  camelsGiven: number;
};

export type ApplyTurnState = {
  mories: number[];
  center: number;
  active: boolean[];
  h: number;
  c: number;
  eliminated: number;
  transfer: Berkh12TransferSummary;
};

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
  const transfer: Berkh12TransferSummary = {
    horseFromSeat: null,
    horsesTaken: 0,
    camelToSeat: null,
    camelsGiven: 0,
  };

  if (!nextA[p] || p < 0) {
    return {
      mories: nextM,
      center: nextC,
      active: nextA,
      h,
      c,
      eliminated: -1,
      transfer,
    };
  }

  const prevActive = (from: number): number => {
    for (let k = 1; k <= nPlayers; k++) {
      const j = (from - k + nPlayers * 4) % nPlayers;
      if (nextA[j] !== false) return j;
    }
    return from;
  };
  const nextActiveIdx = (from: number): number => {
    for (let k = 1; k <= nPlayers; k++) {
      const j = (from + k) % nPlayers;
      if (nextA[j] !== false) return j;
    }
    return from;
  };

  if (h > 0) {
    const donor = prevActive(p);
    if (donor !== p) {
      const take = Math.min(h, nextM[donor] ?? 0);
      nextM[donor] = Math.max(0, (nextM[donor] ?? 0) - take);
      nextM[p] = (nextM[p] ?? 0) + take;
      if (take > 0) {
        transfer.horseFromSeat = donor;
        transfer.horsesTaken = take;
      }
    }
  }

  if (c > 0) {
    const recv = nextActiveIdx(p);
    if (recv !== p) {
      const give = Math.min(c, nextM[p] ?? 0);
      nextM[p] = Math.max(0, (nextM[p] ?? 0) - give);
      nextM[recv] = (nextM[recv] ?? 0) + give;
      if (give > 0) {
        transfer.camelToSeat = recv;
        transfer.camelsGiven = give;
      }
    }
  }

  for (let i = 0; i < nPlayers; i++) {
    if (nextA[i] && (nextM[i] ?? 0) <= 0) {
      nextM[i] = 0;
      nextA[i] = false;
      if (elim < 0) elim = i;
    }
  }

  return {
    mories: nextM,
    center: nextC,
    active: nextA,
    h,
    c,
    eliminated: elim,
    transfer,
  };
}

export function hasFullWin(
  mories: number[],
  p: number,
  total: number,
): boolean {
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
