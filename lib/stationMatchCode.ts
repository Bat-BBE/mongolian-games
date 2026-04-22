/** Серверийн match өрөөний кодтой ижил үсэг (matchRooms CODE_ALPHABET). */
const ALPH = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/**
 * Ижил өртөө + ижил тоглоом → бүх клиентэд ижил 6 тэмдэгт (public өрөө).
 * Эхлэгч «Өрөө нээх» дарахад энэ кодыг ашиглана; хоёр дахь нь ижил кодоор нэгдэнэ.
 */
export function deriveStationGameMatchCode(
  stationSlug: string,
  gameSlug: string,
): string {
  const s = `${stationSlug.trim().toLowerCase()}|${gameSlug.trim().toLowerCase()}`;
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
