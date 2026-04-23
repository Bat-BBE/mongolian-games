// ---------------------------------------------------------------------------
// Shagai Guessing ("Шагай таалцах") – game rules & state machine.
//
// Traditional Mongolian game. Each player starts with the same number of
// shagai. On each round both players secretly grab some of their shagai in
// their fist and then *guess* the combined total held by all players. If
// only one side guesses the true total correctly they win and transfer
// shagai from the loser to themselves; both-correct / both-wrong rounds
// leave the stacks untouched. A player with zero shagai is out. The
// winner is the player who ends up holding all the shagai.
// ---------------------------------------------------------------------------

export type Player = "player" | "robot";

export type Phase =
  // Between rounds – waiting for the player to start.
  | "idle"
  // Player is choosing how many to hide + their guess.
  | "hiding"
  // Robot "thinking" visual pause before the reveal.
  | "robotThinking"
  // Animate the reveal (hands open + totals shown).
  | "revealing"
  // Show the round outcome, wait for next round.
  | "result"
  // One side has run out of shagai.
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
  // Most recently committed round (null before any round resolves).
  lastRound: RoundRecord | null;
  history: RoundRecord[];
  winner: Player | null;
  // Rolling counters used by the UI header.
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

// ---------------------------------------------------------------------------
// Robot behaviour.
// ---------------------------------------------------------------------------

/** Pick a reasonable hidden count – random in [0, stack], slightly biased
 *  toward keeping half in hand so rounds stay interesting. */
export function robotPickHidden(stack: number): number {
  if (stack <= 0) return 0;
  // 70% pick in the middle band [1, stack], 30% edge (0 or all).
  const edge = Math.random();
  if (edge < 0.08) return 0;
  if (edge < 0.15) return stack;
  // Slight preference for ~half with a binomial-ish spread.
  const mid = stack / 2;
  const noise = (Math.random() + Math.random() + Math.random()) / 3 - 0.5;
  const picked = Math.round(mid + noise * stack);
  return Math.max(0, Math.min(stack, picked));
}

/** Pick a guess – the robot "knows" how many it's holding and guesses the
 *  player's hidden count using a centred Gaussian-ish spread around
 *  `playerStack/2`, then adds its own held count. Within legal bounds. */
export function robotPickGuess(
  robotHeld: number,
  playerStack: number,
): number {
  const mid = playerStack / 2;
  const noise = (Math.random() + Math.random() + Math.random()) / 3 - 0.5;
  const playerGuess = Math.round(mid + noise * playerStack);
  const clampedPlayer = Math.max(0, Math.min(playerStack, playerGuess));
  return robotHeld + clampedPlayer;
}

// ---------------------------------------------------------------------------
// Round resolution.
// ---------------------------------------------------------------------------

export interface ResolveInput {
  playerHeld: number;
  playerGuess: number;
  robotHeld: number;
  robotGuess: number;
  playerStack: number;
  robotStack: number;
  round: number;
}

/**
 * Determine the winner of a round and how many shagai move between piles.
 *
 * Transfer rule: the correct guesser takes the total number of shagai that
 * were actually revealed (`total`) from the loser's remaining pile. If the
 * loser doesn't have that many left in their pile the transfer is clamped
 * to whatever they still have. Both-correct / both-wrong → no transfer.
 */
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

// ---------------------------------------------------------------------------
// Apply a resolved round to the overall game state.
// ---------------------------------------------------------------------------

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
  const playerWins =
    state.playerWins + (record.outcome === "player" ? 1 : 0);
  const robotWins =
    state.robotWins + (record.outcome === "robot" ? 1 : 0);
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
