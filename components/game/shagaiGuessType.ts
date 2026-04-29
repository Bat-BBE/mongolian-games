export type Player = "player" | "robot";

export type Phase =
  | "idle"
  | "hiding"
  | "robotThinking"
  | "revealing"
  | "result"
  | "matchOver";

export interface RoundRecord {
  round: number;
  playerHeld: number;
  robotHeld: number;
  total: number;
  playerGuess: number;
  robotGuess: number;
  outcome: "player" | "robot" | "both" | "none";
  transferredTo: Player | null;
  transferredAmount: number;
}

export interface GuessState {
  phase: Phase;
  round: number;
  playerStack: number;
  robotStack: number;
  lastRound: RoundRecord | null;
  history: RoundRecord[];
  winner: Player | null;
  playerWins: number;
  robotWins: number;
}

export const INITIAL_STACK = 8;
export const TOTAL_SHAGAI = INITIAL_STACK * 2;

export const INITIAL_GUESS_STATE: GuessState = {
  phase: "idle",
  round: 0,
  playerStack: INITIAL_STACK,
  robotStack: INITIAL_STACK,
  lastRound: null,
  history: [],
  winner: null,
  playerWins: 0,
  robotWins: 0,
};

export function robotPickHidden(stack: number): number {
  if (stack <= 0) return 0;
  const edge = Math.random();
  if (edge < 0.08) return 0;
  if (edge < 0.15) return stack;
  const mid = stack / 2;
  const noise = (Math.random() + Math.random() + Math.random()) / 3 - 0.5;
  const picked = Math.round(mid + noise * stack);
  return Math.max(0, Math.min(stack, picked));
}

export function robotPickGuess(robotHeld: number, playerStack: number): number {
  const mid = playerStack / 2;
  const noise = (Math.random() + Math.random() + Math.random()) / 3 - 0.5;
  const playerGuess = Math.round(mid + noise * playerStack);
  const clampedPlayer = Math.max(0, Math.min(playerStack, playerGuess));
  return robotHeld + clampedPlayer;
}

export interface ResolveInput {
  playerHeld: number;
  playerGuess: number;
  robotHeld: number;
  robotGuess: number;
  playerStack: number;
  robotStack: number;
  round: number;
}

export function resolveRound(input: ResolveInput): RoundRecord {
  const {
    playerHeld,
    playerGuess,
    robotHeld,
    robotGuess,
    playerStack,
    robotStack,
    round,
  } = input;
  const total = playerHeld + robotHeld;
  const playerCorrect = playerGuess === total;
  const robotCorrect = robotGuess === total;
  let outcome: RoundRecord["outcome"];
  let transferredTo: Player | null = null;
  let transferredAmount = 0;
  if (playerCorrect && robotCorrect) {
    outcome = "both";
  } else if (playerCorrect) {
    outcome = "player";
    transferredTo = "player";
    transferredAmount = Math.min(total, robotStack);
  } else if (robotCorrect) {
    outcome = "robot";
    transferredTo = "robot";
    transferredAmount = Math.min(total, playerStack);
  } else {
    outcome = "none";
  }
  return {
    round,
    playerHeld,
    robotHeld,
    total,
    playerGuess,
    robotGuess,
    outcome,
    transferredTo,
    transferredAmount,
  };
}

export function applyRound(state: GuessState, record: RoundRecord): GuessState {
  let nextPlayer = state.playerStack;
  let nextRobot = state.robotStack;
  if (record.transferredTo === "player") {
    nextPlayer += record.transferredAmount;
    nextRobot -= record.transferredAmount;
  } else if (record.transferredTo === "robot") {
    nextRobot += record.transferredAmount;
    nextPlayer -= record.transferredAmount;
  }
  const playerWins = state.playerWins + (record.outcome === "player" ? 1 : 0);
  const robotWins = state.robotWins + (record.outcome === "robot" ? 1 : 0);
  let winner: Player | null = null;
  if (nextPlayer <= 0) winner = "robot";
  else if (nextRobot <= 0) winner = "player";
  return {
    ...state,
    playerStack: Math.max(0, nextPlayer),
    robotStack: Math.max(0, nextRobot),
    lastRound: record,
    history: [...state.history, record],
    playerWins,
    robotWins,
    winner,
    phase: winner ? "matchOver" : "result",
  };
}
