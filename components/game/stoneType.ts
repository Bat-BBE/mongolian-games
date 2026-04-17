// ═══════════════════════════════════════════════
//  stone-types.ts  –  Чулуу таах тоглоомын логик
// ═══════════════════════════════════════════════

export type GamePhase =
  | "pick"      // Тоглогч чулуу сонгож байна
  | "guess"     // Тоглогч нийлбэрийг таана
  | "result"    // Үр дүн харагдаж байна

export interface RoundResult {
  playerStones:   number   // Тоглогчийн чулуу
  computerStones: number   // Компьютерийн чулуу
  total:          number   // Нийлбэр
  playerGuess:    number   // Тоглогчийн таасан тоо
  computerGuess:  number   // Компьютерийн таасан тоо
  outcome: "player" | "computer" | "none"; // Раундын дүн
}

export interface GameState {
  phase:          GamePhase
  playerStones:   number | null   // Тоглогчийн сонгосон чулуу
  computerStones: number | null   // Компьютерийн нуусан чулуу
  playerGuess:    number | null   // Тоглогчийн таасан тоо
  computerGuess:  number | null   // Компьютерийн таасан тоо
  score:          { player: number; computer: number }
  round:          number
  history:        RoundResult[]
  message:        string
}

export const MAX_STONES = 5   // Нэг тоглогч хамгийн ихдээ 5 чулуу атгана
export const WIN_SCORE  = 3   // Хэдэн раунд хожсон бол ялна

// ── AI логик ──────────────────────────────────
// Компьютер ухаалаг байдлаар чулуу сонгоно
export function computerPickStones(history: RoundResult[]): number {
  if (history.length < 3) {
    // Эхний раундуудад санамсаргүй
    return Math.floor(Math.random() * (MAX_STONES + 1))
  }

  // Тоглогчийн сүүлийн 3 раундын дундажаар тооцоолно
  const recent = history.slice(-3)
  const avgPlayer = recent.reduce((s, r) => s + r.playerStones, 0) / recent.length

  // Тоглогч ихэвчлэн их чулуу атгадаг бол компьютер бага атгаж,
  // нийлбэрийг тааходоо хэцүүлнэ
  const base = Math.round(MAX_STONES - avgPlayer)
  const jitter = Math.floor(Math.random() * 3) - 1  // -1, 0, 1

  return Math.max(0, Math.min(MAX_STONES, base + jitter))
}

/** Компьютерийн таалт: өөрийн атгасан чулуундаа (>= stones+1) суурилж таана. */
export function computerGuessTotal(args: {
  playerStones: number;
  computerStones: number;
  playerGuess: number;
}): number {
  const { playerStones, computerStones, playerGuess } = args;
  const min = Math.max(computerStones + 1, 0);
  const max = MAX_STONES * 2;
  // Prefer plausible totals (close to expectation), avoid copying player guess if possible.
  const expected = Math.min(max, Math.max(min, playerStones + computerStones));
  const candidates = Array.from({ length: max - min + 1 }, (_, i) => min + i)
    .filter((n) => n !== playerGuess);
  if (candidates.length === 0) return expected;
  // Weighted pick around expected.
  const pick = () => {
    const r = Math.random();
    const span = Math.max(1, Math.round((max - min) * 0.35));
    const delta = Math.round((r - 0.5) * 2 * span);
    const v = expected + delta;
    const clamped = Math.max(min, Math.min(max, v));
    return candidates.includes(clamped) ? clamped : candidates[Math.floor(Math.random() * candidates.length)]!;
  };
  return pick();
}

// ── Тоглогчийн таах боломжит тоонууд ─────────
// Хоёр тоглогч тус бүр 0-5 чулуу → нийлбэр 0-10
export function getPossibleTotals(): number[] {
  return Array.from({ length: MAX_STONES * 2 + 1 }, (_, i) => i)
}

// ── Раундын мэдэгдэл үүсгэх ──────────────────
export function buildMessage(result: RoundResult): string {
  const { playerStones, computerStones, total, playerGuess, computerGuess, outcome } = result
  if (outcome === "player") {
    return `🎉 Та зөв таалаа! ${playerStones} + ${computerStones} = ${total} (Та: ${playerGuess}, COM: ${computerGuess})`
  }
  if (outcome === "computer") {
    return `😔 Компьютер зөв таалаа. ${playerStones} + ${computerStones} = ${total} (Та: ${playerGuess}, COM: ${computerGuess})`
  }
  return `🤝 Хоёулаа буруу. ${playerStones} + ${computerStones} = ${total} (Та: ${playerGuess}, COM: ${computerGuess})`
}

export const INITIAL_STATE: GameState = {
  phase:          "pick",
  playerStones:   null,
  computerStones: null,
  playerGuess:    null,
  computerGuess:  null,
  score:          { player: 0, computer: 0 },
  round:          1,
  history:        [],
  message:        "",
}