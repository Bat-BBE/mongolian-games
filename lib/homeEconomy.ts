export const LIVESTOCK_COIN_PRICES = {
  sheep: 85,
  goat: 78,
  cow: 300,
  horse: 480,
  camel: 600,
} as const;

export function gerUpgradeCost(gerLevel: number): {
  coins: number;
  kp: number;
} {
  const lvl = Math.max(1, Math.floor(gerLevel));
  return { coins: 130 + lvl * 52, kp: 42 + lvl * 11 };
}

export const WEALTH_COINS_PER_GEM = 25;
