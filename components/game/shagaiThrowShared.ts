/**
 * Дөрвөн шагайтай тоглоомууд (дөрвөн бэрх, анхны шагай, морины уралдаан гэх мэт)
 * ижил шидэлтийн хурд/spread ашигвал газарт буух талын хуваарь ойролцоо болно.
 */
export const SHAGAI_THROW_START_POSITIONS: [number, number, number][] = [
  [-2.0, 4.5, -1.0],
  [-0.7, 5.0, 0.3],
  [0.7, 5.5, -0.4],
  [2.0, 4.8, 0.9],
];

/**
 * Морины уралдааны шидэлтийн овал +Z талд (RaceMat-ийн throw zone).
 * Дөрвөн бэрхтэй ижил харьцаатай байрлал, зөвхөн Z-г шилжүүлсэн (хэвийн төв ≈ +2.0).
 */
const HORSE_RACE_THROW_Z_OFFSET = 2.075;
export const SHAGAI_HORSE_RACE_THROW_START_POSITIONS: [number, number, number][] =
  SHAGAI_THROW_START_POSITIONS.map(([x, y, z]) => [
    x,
    y,
    z + HORSE_RACE_THROW_Z_OFFSET,
  ]);

const HR = SHAGAI_HORSE_RACE_THROW_START_POSITIONS;
/** 12 жил: 2–4 шагайн шидэлт — байрлал (морин уралдааны зурвас) */
export function getTwelveThrowStartPositions(
  n: 2 | 3 | 4,
): [number, number, number][] {
  if (n === 2) return [HR[0]!, HR[2]!];
  if (n === 3) return [HR[0]!, HR[1]!, HR[2]!];
  return [HR[0]!, HR[1]!, HR[2]!, HR[3]!];
}

const BERKH12 = SHAGAI_HORSE_RACE_THROW_START_POSITIONS;
/** 12 бэрх: 3×4 сүлжээний бүх байрлал (урт шидэлтэнд). */
export function getBerkhTwelveThrowStartPositions(): [number, number, number][] {
  const out: [number, number, number][] = [];
  for (let row = 0; row < 3; row++) {
    for (let c = 0; c < 4; c++) {
      const base = BERKH12[c] ?? BERKH12[0]!;
      out.push([
        base[0] + (c - 1.5) * 0.35,
        base[1] + row * 0.2,
        base[2] - row * 0.48,
      ] as [number, number, number]);
    }
  }
  return out;
}

/** 12 бэрх: нэг шидэлтэнд 4 шагай — эхний эгнээ. */
export function getBerkhThrowStartPositions(): [number, number, number][] {
  return getBerkhTwelveThrowStartPositions().slice(0, 4) as [
    number,
    number,
    number,
  ][];
}

/** spread = 2.5 — анхны 2.2-той харьцuuлахад дөрвөн бэрхтэй нэгэн адил */
export function getShagaiThrowParams(): {
  vel: [number, number, number];
  angVel: [number, number, number];
} {
  const spread = 2.5;
  return {
    vel: [
      (Math.random() - 0.5) * spread * 2,
      6 + Math.random() * 4,
      (Math.random() - 0.5) * spread * 2,
    ],
    angVel: [
      (Math.random() - 0.5) * 22,
      (Math.random() - 0.5) * 18,
      (Math.random() - 0.5) * 22,
    ],
  };
}
