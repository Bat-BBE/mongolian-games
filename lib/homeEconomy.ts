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

/**
 * Leaderboard `wealthScore` tootsoolol: gems * 25, coins * 1 — 1 erdeniin chuluu
 */
export const WEALTH_COINS_PER_GEM = 25;
