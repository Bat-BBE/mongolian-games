export const LIVESTOCK_COIN_PRICES = {
  sheep: 120,
  goat: 110,
  cow: 420,
  horse: 650,
  camel: 820,
} as const;

export type LivestockKind = keyof typeof LIVESTOCK_COIN_PRICES;

export function gerUpgradeCost(gerLevel: number): {
  coins: number;
  kp: number;
} {
  const lvl = Math.max(1, Math.floor(gerLevel));
  return { coins: 200 + lvl * 80, kp: 60 + lvl * 15 };
}

/** Чулуу → зоос солих ханш (тоглоомын API-тай ижил) */
export const WEALTH_COINS_PER_GEM = 25;

/**
 * Leaderboard `wealthScore`-д эрдэнэ оруулах жин (чулуу→зоосын 25-тай адил биш —
 * нийт үнэлгээг бага тоонд барина).
 */
export const WEALTH_SCORE_GEM_WEIGHT = 10;
