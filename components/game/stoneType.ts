export type GamePhase =
  | "pick" 
  | "guess" 
  | "result";

export interface RoundResult {
  playerStones: number; 
  computerStones: number; 
  total: number; 
  playerGuess: number; 
  computerGuess: number; 
  outcome: "player" | "computer" | "none"; 
}

export interface GameState {
  phase: GamePhase;
  playerStones: number | null; 
  computerStones: number | null; 
  playerGuess: number | null; 
  computerGuess: number | null; 
  score: { player: number; computer: number };
  round: number;
  history: RoundResult[];
  message: string;
}

export const MAX_STONES = 5;
export const WIN_SCORE = 3;

export function computerPickStones(history: RoundResult[]): number {
  if (history.length < 3) {
    return Math.floor(Math.random() * (MAX_STONES + 1));
  }

  const recent = history.slice(-3);
  const avgPlayer =
    recent.reduce((s, r) => s + r.playerStones, 0) / recent.length;

  const base = Math.round(MAX_STONES - avgPlayer);
  const jitter = Math.floor(Math.random() * 3) - 1;

  return Math.max(0, Math.min(MAX_STONES, base + jitter));
}

export function computerGuessTotal(args: {
  playerStones: number;
  computerStones: number;
  playerGuess: number;
}): number {
  const { playerStones, computerStones, playerGuess } = args;
  const min = Math.max(computerStones + 1, 0);
  const max = MAX_STONES * 2;
  const expected = Math.min(max, Math.max(min, playerStones + computerStones));
  const candidates = Array.from(
    { length: max - min + 1 },
    (_, i) => min + i,
  ).filter((n) => n !== playerGuess);
  if (candidates.length === 0) return expected;
  const pick = () => {
    const r = Math.random();
    const span = Math.max(1, Math.round((max - min) * 0.35));
    const delta = Math.round((r - 0.5) * 2 * span);
    const v = expected + delta;
    const clamped = Math.max(min, Math.min(max, v));
    return candidates.includes(clamped)
      ? clamped
      : candidates[Math.floor(Math.random() * candidates.length)]!;
  };
  return pick();
}

export function getPossibleTotals(): number[] {
  return Array.from({ length: MAX_STONES * 2 + 1 }, (_, i) => i);
}

export function buildMessage(result: RoundResult): string {
  const {
    playerStones,
    computerStones,
    total,
    playerGuess,
    computerGuess,
    outcome,
  } = result;
  if (outcome === "player") {
    return `Та зөв таалаа! ${playerStones} + ${computerStones} = ${total} (Та: ${playerGuess}, COM: ${computerGuess})`;
  }
  if (outcome === "computer") {
    return `Робот зөв таалаа. ${playerStones} + ${computerStones} = ${total} (Та: ${playerGuess}, COM: ${computerGuess})`;
  }
  return `Хоёулаа буруу. ${playerStones} + ${computerStones} = ${total} (Та: ${playerGuess}, COM: ${computerGuess})`;
}

export const INITIAL_STATE: GameState = {
  phase: "pick",
  playerStones: null,
  computerStones: null,
  playerGuess: null,
  computerGuess: null,
  score: { player: 0, computer: 0 },
  round: 1,
  history: [],
  message: "",
};
