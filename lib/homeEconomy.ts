/** Тоглоомын орлоготой зэрэгцүүлсэн үнэ (7 хоногт олон тоглолт/тоглоом — `lib/stationWeeklyPlayCap.ts`). */
export const LIVESTOCK_COIN_PRICES = {
  sheep: 85,
  goat: 78,
  cow: 300,
  horse: 480,
  camel: 600,
} as const;

export type LivestockKind = keyof typeof LIVESTOCK_COIN_PRICES;

export function gerUpgradeCost(gerLevel: number): {
  coins: number;
  kp: number;
} {
  const lvl = Math.max(1, Math.floor(gerLevel));
  return { coins: 130 + lvl * 52, kp: 42 + lvl * 11 };
}

/** Чулуу → зоос солих ханш (тоглоомын API-тай ижил) */
export const WEALTH_COINS_PER_GEM = 25;

/**
 * Leaderboard `wealthScore`-д эрдэнэ оруулах жин (чулуу→зоосын 25-тай адил биш —
 * нийт үнэлгээг бага тоонд барина).
 */
export const WEALTH_SCORE_GEM_WEIGHT = 10;
