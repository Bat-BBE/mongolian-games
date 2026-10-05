const ALPH = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Mirrors lib/stationMatchCode.ts's deriveStationGameMatchCode pattern.
 * Sorts the two ids first so both sides of a duel compute the same code
 * regardless of who challenged whom — no coordination round-trip needed. */
export function deriveDuelMatchCode(idA: string, idB: string): string {
  const [a, b] = [idA.trim(), idB.trim()].sort();
  const s = `duel|${a}|${b}`;
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let x = h >>> 0;
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += ALPH[x % ALPH.length]!;
    x = (Math.imul(x, 31) + i + 13) >>> 0;
  }
  return code;
}
