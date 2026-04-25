import { mulberry32 } from "./fourPowersType";

export const ROUNDS_TO_WIN = 5;

export function rollD6(rng: () => number): number {
  return Math.min(6, Math.floor(rng() * 6) + 1);
}

export function rollTriple(
  rng: () => number,
): [number, number, number] {
  return [rollD6(rng), rollD6(rng), rollD6(rng)];
}

export function sum3(t: [number, number, number]): number {
  return t[0] + t[1] + t[2];
}

export function makeRng(seed: number, round: number, salt: number) {
  return mulberry32(seed + round * 19_999 + salt * 127);
}
