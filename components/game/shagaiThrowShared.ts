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

/** spread = 2.5 — анхны 2.2-той харьцуулахад дөрвөн бэрхтэй нэгэн адил */
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
