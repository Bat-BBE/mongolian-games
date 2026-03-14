// ═══════════════════════════════════════════════
//  stone-types.ts  –  Чулуу таах тоглоомын логик
// ═══════════════════════════════════════════════

export type GamePhase =
  | "pick"      // Тоглогч чулуу сонгож байна
  | "reveal"    // Хоёулаа нударга нээж байна
  | "guess"     // Тоглогч нийлбэрийг таана
  | "result"    // Үр дүн харагдаж байна

export interface RoundResult {
  playerStones:   number   // Тоглогчийн чулуу
  computerStones: number   // Компьютерийн чулуу
  total:          number   // Нийлбэр
  playerGuess:    number   // Тоглогчийн таасан тоо
  playerWon:      boolean  // Тоглогч хожсон уу
}

export interface GameState {
  phase:          GamePhase
  playerStones:   number | null   // Тоглогчийн сонгосон чулуу
  computerStones: number | null   // Компьютерийн нуусан чулуу
  playerGuess:    number | null   // Тоглогчийн таасан тоо
  score:          { player: number; computer: number }
  round:          number
  history:        RoundResult[]
  message:        string
}

export const MAX_STONES = 5   // Нэг тоглогч хамгийн ихдээ 5 чулуу атгана
export const WIN_SCORE  = 5   // Хэдэн раунд хожсон бол ялна

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

// ── Тоглогчийн таах боломжит тоонууд ─────────
// Хоёр тоглогч тус бүр 0-5 чулуу → нийлбэр 0-10
export function getPossibleTotals(): number[] {
  return Array.from({ length: MAX_STONES * 2 + 1 }, (_, i) => i)
}

// ── Раундын мэдэгдэл үүсгэх ──────────────────
export function buildMessage(result: RoundResult): string {
  const { playerStones, computerStones, total, playerGuess, playerWon } = result
  if (playerWon) {
    return `🎉 Зөв! ${playerStones} + ${computerStones} = ${total}. Та хожлоо!`
  }
  return `❌ Буруу. ${playerStones} + ${computerStones} = ${total}, та ${playerGuess} гэж тааж байв.`
}

export const INITIAL_STATE: GameState = {
  phase:          "pick",
  playerStones:   null,
  computerStones: null,
  playerGuess:    null,
  score:          { player: 0, computer: 0 },
  round:          1,
  history:        [],
  message:        "",
}