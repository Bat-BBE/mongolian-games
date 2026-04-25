import { mulberry32 } from "./fourPowersType";

export const STONE_COUNT = 5;
export const WIN_LEVEL = 10;

/** Deterministic stone index 0..4 for position i in the growing sequence. */
export function stoneAt(i: number, baseSeed: number): number {
  return Math.min(
    STONE_COUNT - 1,
    Math.floor(mulberry32(baseSeed + i * 7919)() * STONE_COUNT),
  );
}

export function buildSeq(len: number, baseSeed: number): number[] {
  return Array.from({ length: len }, (_, i) => stoneAt(i, baseSeed));
}
