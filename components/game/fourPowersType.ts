export const POWERS = 4;
export const WIN_SCORE = 7;
export const MAX_ENERGY = 6;
export const ROUND_REGEN = 2;

export type PowerId = 0 | 1 | 2 | 3;
export type Seat4 = [number, number, number, number];
export type EffectId = "tempo" | "drain" | "shield" | "recover";

export type PowerSpec = {
  id: PowerId;
  nameMn: string;
  nameEn: string;
  subMn: string;
  subEn: string;
  cost: number;
  effect: EffectId;
};

export type RoundState = {
  totals: Seat4;
  energy: Seat4;
  streak: Seat4;
  round: number;
};

export type RoundResolved = {
  appliedChoices: Seat4;
  deltas: Seat4;
  nextState: RoundState;
  notes: string[];
};

export const POWER_SPECS: readonly PowerSpec[] = [
  {
    id: 0,
    nameMn: "Морь",
    nameEn: "Horse",
    subMn: "Хурдны цохилт",
    subEn: "Tempo strike",
    cost: 3,
    effect: "tempo",
  },
  {
    id: 1,
    nameMn: "Тэмээ",
    nameEn: "Camel",
    subMn: "Энерги соролт",
    subEn: "Energy drain",
    cost: 2,
    effect: "drain",
  },
  {
    id: 2,
    nameMn: "Үхэр",
    nameEn: "Ox",
    subMn: "Бамбай хамгаалалт",
    subEn: "Shield guard",
    cost: 2,
    effect: "shield",
  },
  {
    id: 3,
    nameMn: "Хонь",
    nameEn: "Sheep",
    subMn: "Сэргээх урсгал",
    subEn: "Recovery flow",
    cost: 1,
    effect: "recover",
  },
] as const;

const EMPTY4: Seat4 = [0, 0, 0, 0];

export function makeInitialRoundState(): RoundState {
  return {
    totals: [0, 0, 0, 0],
    energy: [4, 4, 4, 4],
    streak: [0, 0, 0, 0],
    round: 1,
  };
}

export function beats(a: number, b: number): boolean {
  return ((a + 1) | 0) % POWERS === (b | 0);
}

export function resolveRoundWithEffects(
  state: RoundState,
  requestedChoices: Seat4,
): RoundResolved {
  const notes: string[] = [];
  const applied: Seat4 = [...requestedChoices] as Seat4;
  const effectiveEnergy: Seat4 = [...state.energy] as Seat4;
  const shielded = [false, false, false, false];
  const deltas: Seat4 = [0, 0, 0, 0];
  const nextEnergy: Seat4 = [0, 0, 0, 0];
  const nextStreak: Seat4 = [0, 0, 0, 0];

  // Cost/payment + affordability fallback.
  for (let i = 0; i < 4; i++) {
    const req = requestedChoices[i] as PowerId;
    const reqCost = POWER_SPECS[req].cost;
    if (effectiveEnergy[i] < reqCost) {
      let fallback: PowerId = 3;
      for (let p = 3; p >= 0; p--) {
        if (POWER_SPECS[p].cost <= effectiveEnergy[i]) {
          fallback = p as PowerId;
          break;
        }
      }
      if (fallback !== req) {
        applied[i] = fallback;
        notes.push(`P${i + 1} fallback`);
      }
    }
    const chosen = applied[i];
    effectiveEnergy[i] -= POWER_SPECS[chosen].cost;
  }

  // Base cycle scoring (1 point per beaten opponent).
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      if (i === j) continue;
      if (beats(applied[i], applied[j])) deltas[i] += 1;
    }
  }

  // Effects: shield/recover/tempo/drain.
  for (let i = 0; i < 4; i++) {
    const eff = POWER_SPECS[applied[i]].effect;
    if (eff === "shield" && deltas[i] > 0) {
      shielded[i] = true;
      notes.push(`P${i + 1} shield`);
    }
  }
  for (let i = 0; i < 4; i++) {
    const eff = POWER_SPECS[applied[i]].effect;
    if (eff === "recover") {
      effectiveEnergy[i] = Math.min(MAX_ENERGY, effectiveEnergy[i] + 1);
      notes.push(`P${i + 1} recover`);
    }
  }
  for (let i = 0; i < 4; i++) {
    const eff = POWER_SPECS[applied[i]].effect;
    if (eff === "tempo" && deltas[i] > 0) {
      deltas[i] += 1;
      notes.push(`P${i + 1} tempo+1`);
    }
  }
  for (let i = 0; i < 4; i++) {
    const eff = POWER_SPECS[applied[i]].effect;
    if (eff !== "drain" || deltas[i] <= 0) continue;
    const target = (i + 1) % 4;
    if (!shielded[target]) {
      effectiveEnergy[target] = Math.max(0, effectiveEnergy[target] - 1);
      notes.push(`P${i + 1} drain->P${target + 1}`);
    }
  }

  for (let i = 0; i < 4; i++) {
    const won = deltas[i] > 0;
    nextStreak[i] = won ? state.streak[i] + 1 : 0;
    nextEnergy[i] = Math.min(
      MAX_ENERGY,
      Math.max(0, effectiveEnergy[i]) + ROUND_REGEN + (won ? 1 : 0),
    );
  }

  return {
    appliedChoices: applied,
    deltas,
    nextState: {
      totals: addTotals(state.totals, deltas),
      energy: nextEnergy,
      streak: nextStreak,
      round: state.round + 1,
    },
    notes,
  };
}

export function addTotals(t: Seat4, d: Seat4): Seat4 {
  return [t[0] + d[0], t[1] + d[1], t[2] + d[2], t[3] + d[3]];
}

export function firstWinner(scores: Seat4, target: number = WIN_SCORE): number {
  const hi = Math.max(...scores);
  if (hi < target) return -1;
  const atTop = scores.map((s, i) => (s === hi ? i : -1)).filter((x) => x >= 0);
  if (atTop.length !== 1) return -1;
  return atTop[0]!;
}

export function powerLabel(
  i: number,
  lang: "mn" | "en",
): { name: string; sub: string } {
  const row = POWER_SPECS[i];
  if (!row) return { name: "?", sub: "" };
  return lang === "mn"
    ? { name: row.nameMn, sub: row.subMn }
    : { name: row.nameEn, sub: row.subEn };
}

export function mulberry32(a: number): () => number {
  return () => {
    let t = (a + 0x6d2b79f5) | 0;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickBotPower(rng: () => number, hint?: number): number {
  if (typeof hint === "number" && rng() < 0.34) {
    if (rng() < 0.5) return (hint + 1) % POWERS;
    if (rng() < 0.5) return (hint + POWERS - 1) % POWERS;
  }
  return Math.min(POWERS - 1, Math.floor(rng() * POWERS));
}

export function suggestMovesForSeat(
  state: RoundState,
  seat: number,
): {
  best: PowerId;
  safe: PowerId;
  risk: PowerId;
} {
  let best: PowerId = 3;
  let bestScore = -1e9;
  let safe: PowerId = 3;
  let safeScore = -1e9;
  let risk: PowerId = 0;
  let riskScore = -1e9;
  const opponentLikely = (seat + 1) % 4;

  for (let p = 0; p < 4; p++) {
    const spec = POWER_SPECS[p];
    if (spec.cost > state.energy[seat]) continue;
    const req: Seat4 = [3, 3, 3, 3];
    req[seat] = p;
    req[opponentLikely] = ((p + 1) % 4) as PowerId;
    const sim = resolveRoundWithEffects(state, req);
    const delta = sim.deltas[seat];
    const energyAfter = sim.nextState.energy[seat];
    const score = delta * 10 + energyAfter;
    if (score > bestScore) {
      bestScore = score;
      best = p as PowerId;
    }
    const safeCandidate = energyAfter + (delta > 0 ? 1 : 0);
    if (safeCandidate > safeScore) {
      safeScore = safeCandidate;
      safe = p as PowerId;
    }
    const riskCandidate = delta * 15 - spec.cost;
    if (riskCandidate > riskScore) {
      riskScore = riskCandidate;
      risk = p as PowerId;
    }
  }
  return { best, safe, risk };
}
