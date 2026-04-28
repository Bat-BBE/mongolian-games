/** Дөрвөн эрхэ: морь → тэмээ → үхэр → хонь → морь (4-way cycle) */

export const POWERS = 4;
export const WIN_SCORE = 7;

export type PowerId = 0 | 1 | 2 | 3;

export function beats(a: number, b: number): boolean {
  return ((a + 1) | 0) % POWERS === (b | 0);
}

export function roundPoints(
  choices: [number, number, number, number],
): [number, number, number, number] {
  const out: [number, number, number, number] = [0, 0, 0, 0];
  const cnt = [0, 0, 0, 0];
  for (const c of choices) {
    if (c < 0 || c > 3) return out;
    cnt[c] += 1;
  }
  const present: number[] = [];
  for (let i = 0; i < POWERS; i++) {
    if (cnt[i] > 0) present.push(i);
  }
  if (present.length === 1) return out;
  if (present.length === 4) return out;

  if (present.length === 2) {
    const a = present[0];
    const b = present[1];
    const nA = cnt[a];
    const nB = cnt[b];
    if (nA === 2 && nB === 2) {
      if (beats(a, b)) {
        for (let i = 0; i < 4; i++) if (choices[i] === a) out[i] += 2;
      } else {
        for (let i = 0; i < 4; i++) if (choices[i] === b) out[i] += 2;
      }
      return out;
    }
    if (nA === 3 && nB === 1) {
      const singleIdx = choices.indexOf(b);
      if (beats(b, a)) out[singleIdx] += 3;
      else for (let i = 0; i < 4; i++) if (choices[i] === a) out[i] += 1;
      return out;
    }
    if (nA === 1 && nB === 3) {
      const singleIdx = choices.indexOf(a);
      if (beats(a, b)) out[singleIdx] += 3;
      else for (let i = 0; i < 4; i++) if (choices[i] === b) out[i] += 1;
      return out;
    }
  }
  return out;
}

export function addTotals(
  t: [number, number, number, number],
  d: [number, number, number, number],
): [number, number, number, number] {
  return [t[0] + d[0], t[1] + d[1], t[2] + d[2], t[3] + d[3]];
}

export function firstWinner(
  scores: [number, number, number, number],
  target: number = WIN_SCORE,
): number {
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
  const M = [
    { name: "Морь", sub: "Тэнгэр, хурд" },
    { name: "Тэмээ", sub: "Алс нутаг" },
    { name: "Үхэр", sub: "Тэвшин тэнхрэл" },
    { name: "Хонь", sub: "Өргөө" },
  ] as const;
  const E = [
    { name: "Horse", sub: "Speed & open sky" },
    { name: "Camel", sub: "The long steppe" },
    { name: "Ox", sub: "Endurance" },
    { name: "Sheep", sub: "The herd & home" },
  ] as const;
  const row = lang === "mn" ? M : E;
  return row[i] ?? { name: "?", sub: "" };
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
