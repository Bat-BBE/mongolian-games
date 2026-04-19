"use client";

import { useMemo, useState } from "react";
import {
  GuessState,
  INITIAL_STACK,
  Phase,
  RoundRecord,
  TOTAL_SHAGAI,
} from "./shagaiGuessType";
import { useApp } from "@/components/AppContext";

interface Props {
  state: GuessState;
  onStartRound: () => void;
  onCommit: (hidden: number, guess: number) => void;
  onNextRound: () => void;
  onReset: () => void;
  robotThinking: boolean;
  revealHidden: { player: number; robot: number } | null;
  rewardEvents?: { id: string; text: string; kind: "coins" | "gems" }[];
  sessionGain?: { coins: number; gems: number };
}

type I18n = {
  title: string;
  subtitle: string;
  overline: string;
  yourStack: string;
  robotStack: string;
  round: string;
  startRound: string;
  chooseHidden: string;
  chooseGuess: string;
  commit: string;
  confirmReveal: string;
  nextRound: string;
  robotThinking: string;
  youWon: string;
  youLost: string;
  roundWonBy: (
    who: "player" | "robot" | "both" | "none",
    total: number,
  ) => string;
  howToPlayTitle: string;
  howToPlaySteps: { t: string; d: string }[];
  statistic: string;
  playerLabel: string;
  robotLabel: string;
  playerHeld: string;
  robotHeld: string;
  playerGuess: string;
  robotGuess: string;
  trueTotal: string;
  historyTitle: string;
  historyEmpty: string;
  resetBtn: string;
  hiddenRange: (max: number) => string;
  guessRange: (max: number) => string;
  transferNote: (who: "player" | "robot", amount: number) => string;
  outcomeTagPlayer: string;
  outcomeTagRobot: string;
  outcomeTagBoth: string;
  outcomeTagNone: string;
  roundsWon: string;
  totalShagai: string;
};

function useI18n(): I18n & { language: "mn" | "en" } {
  const { language } = useApp();
  const en: I18n = {
    title: "SHAGAI GUESS",
    subtitle: "TAALCAH · VS ROBOT",
    overline: "ᠰᠢᠭᠠᠢ ᠲᠠᠭᠠᠯᠴᠠᠬᠤ",
    yourStack: "Your stack",
    robotStack: "Robot stack",
    round: "Round",
    startRound: "Start round",
    chooseHidden: "How many to hide?",
    chooseGuess: "Guess the combined total",
    commit: "Hide & guess",
    confirmReveal: "Reveal hands",
    nextRound: "Next round",
    robotThinking: "Robot is picking…",
    youWon: "YOU WIN!",
    youLost: "ROBOT WINS",
    roundWonBy: (who, total) => {
      if (who === "player") return `You guessed ${total}! Shagai move to you.`;
      if (who === "robot")
        return `Robot guessed ${total}. Shagai move to robot.`;
      if (who === "both") return `Both correct — no transfer.`;
      return `Nobody guessed ${total}.`;
    },
    howToPlayTitle: "HOW TO PLAY",
    howToPlaySteps: [
      {
        t: "Hide some shagai",
        d: `Secretly pick between 0 and your remaining pile to keep in your fist.`,
      },
      {
        t: "Guess the total",
        d: `Guess the number of shagai hidden by BOTH players combined.`,
      },
      {
        t: "Only one correct wins",
        d: `The correct guesser takes that many shagai from the loser. Both-correct / both-wrong leaves stacks as-is.`,
      },
      {
        t: "Last pile standing",
        d: `A pile that hits 0 is out. Whoever ends up with all ${TOTAL_SHAGAI} shagai wins.`,
      },
    ],
    statistic: "STATS",
    playerLabel: "YOU",
    robotLabel: "ROBOT",
    playerHeld: "You hid",
    robotHeld: "Robot hid",
    playerGuess: "Your guess",
    robotGuess: "Robot guess",
    trueTotal: "Actual total",
    historyTitle: "ROUNDS",
    historyEmpty: "No rounds played yet.",
    resetBtn: "Reset match",
    hiddenRange: (max) => `0 … ${max}`,
    guessRange: (max) => `0 … ${max}`,
    transferNote: (who, amount) =>
      who === "player" ? `+${amount} to your pile` : `+${amount} to robot`,
    outcomeTagPlayer: "You",
    outcomeTagRobot: "Robot",
    outcomeTagBoth: "Draw",
    outcomeTagNone: "Miss",
    roundsWon: "Rounds won",
    totalShagai: "Pile size",
  };
  const mn: I18n = {
    title: "ШАГАЙ ТААЛЦАХ",
    subtitle: "ТААЛЦАХ · РОБОТТОЙ",
    overline: "ᠰᠢᠭᠠᠢ ᠲᠠᠭᠠᠯᠴᠠᠬᠤ",
    yourStack: "Таны шагай",
    robotStack: "Роботын шагай",
    round: "Үе шат",
    startRound: "Дараагийн үе шат эхлүүлэх",
    chooseHidden: "Хэдэн шагай нуух вэ?",
    chooseGuess: "Нийт хэдэн шагай атгасан болохыг таа",
    commit: "Нуух ба таах",
    confirmReveal: "Нээх",
    nextRound: "Дараагийн үе шат",
    robotThinking: "Робот бодож байна…",
    youWon: "ТА ХОЖЛОО!",
    youLost: "РОБОТ ХОЖЛОО",
    roundWonBy: (who, total) => {
      if (who === "player")
        return `Та ${total}-ийг зөв таалаа! Шагай танд очно.`;
      if (who === "robot")
        return `Робот ${total}-ийг зөв таалаа. Шагай роботод очно.`;
      if (who === "both") return `Хоёулаа зөв — хэнч шагай очихгүй.`;
      return `Хэн ч ${total}-ийг таагаагүй.`;
    },
    howToPlayTitle: "ТОГЛОХ ДҮРЭМ",
    howToPlaySteps: [
      {
        t: "Шагайгаа нуу",
        d: "Өөрийн үлдсэн шагайнаас 0-оос бүгдийг нь хүртэл атгана.",
      },
      {
        t: "Нийт тоог таа",
        d: "Хоёр талын атгаж байгаа шагайны НИЙТ тоог таамаглах.",
      },
      {
        t: "Зөв таасан нь шагайг авна",
        d: "Зөв таасан талд тэр тооны шагайг авна. Хоёулаа зөв буюу хоёулаа буруу бол шагайг авахгүй.",
      },
      {
        t: "Бүх шагайг цуглуулна",
        d: `0 болсон тал хасагдана. Бүх ${TOTAL_SHAGAI} шагайг цуглуулсан нь хожно.`,
      },
    ],
    statistic: "СТАТИСТИК",
    playerLabel: "ТА",
    robotLabel: "РОБОТ",
    playerHeld: "Таны атгасан",
    robotHeld: "Роботын атгасан",
    playerGuess: "Таны таавар",
    robotGuess: "Роботын таавар",
    trueTotal: "Нийт",
    historyTitle: "ҮЕ ШАТУУД",
    historyEmpty: "Үе шат өрнөөгүй байна.",
    resetBtn: "Тоглоомыг дахин эхлүүлэх",
    hiddenRange: (max) => `0 … ${max}`,
    guessRange: (max) => `0 … ${max}`,
    transferNote: (who, amount) =>
      who === "player" ? `+${amount} танд` : `+${amount} роботод`,
    outcomeTagPlayer: "Та",
    outcomeTagRobot: "Робот",
    outcomeTagBoth: "Хоёулаа",
    outcomeTagNone: "Алдаа",
    roundsWon: "Энэ үе шатанд хожсон",
    totalShagai: "Шагайны тоо",
  };
  return { language, ...(language === "en" ? en : mn) };
}

function GoldDivider() {
  return (
    <div
      style={{
        height: 1,
        background:
          "linear-gradient(90deg, transparent, #c8a03055, transparent)",
        margin: "8px 0",
      }}
    />
  );
}

function StackBar({
  label,
  value,
  total,
  color,
  emoji,
  glow,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
  emoji: string;
  glow: string;
}) {
  const pct = Math.max(0, Math.min(1, value / total));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          color: "#d8c488",
          fontSize: 11,
          letterSpacing: 1.4,
          textTransform: "uppercase",
        }}
      >
        <span>
          {emoji} {label}
        </span>
        <span style={{ color, fontWeight: 700, fontSize: 14 }}>
          {value}
          <span style={{ opacity: 0.45, fontSize: 11 }}> / {total}</span>
        </span>
      </div>
      <div
        style={{
          height: 8,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(200,160,48,0.15)",
          borderRadius: 4,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div
          style={{
            width: `${pct * 100}%`,
            height: "100%",
            background: color,
            boxShadow: `0 0 12px ${glow}`,
            transition: "width 0.35s ease",
          }}
        />
      </div>
    </div>
  );
}

function PhaseBanner({
  state,
  robotThinking,
  t,
}: {
  state: GuessState;
  robotThinking: boolean;
  t: I18n;
}) {
  const phase = state.phase;
  let text = "";
  let color = "#d8c488";
  if (phase === "idle") {
    text = `${t.round} 1`;
  } else if (phase === "hiding") {
    text = `${t.round} ${state.round}`;
  } else if (robotThinking || phase === "robotThinking") {
    text = t.robotThinking;
    color = "#c8a030";
  } else if (phase === "revealing") {
    text = "…";
  } else if (phase === "result" && state.lastRound) {
    text = t.roundWonBy(state.lastRound.outcome, state.lastRound.total);
    color =
      state.lastRound.outcome === "player"
        ? "#60c060"
        : state.lastRound.outcome === "robot"
          ? "#e06050"
          : "#d8c488";
  } else if (phase === "matchOver") {
    text = state.winner === "player" ? t.youWon : t.youLost;
    color = state.winner === "player" ? "#60c060" : "#e06050";
  }
  return (
    <div
      style={{
        minHeight: 46,
        padding: "10px 14px",
        background: "rgba(0,0,0,0.35)",
        border: "1px solid rgba(200,160,48,0.18)",
        borderRadius: 8,
        color,
        fontSize: 13,
        lineHeight: 1.5,
        letterSpacing: 0.5,
      }}
    >
      {text}
    </div>
  );
}

function PhaseControls({
  state,
  robotThinking,
  revealHidden,
  onStartRound,
  onCommit,
  onNextRound,
  t,
  language,
}: {
  state: GuessState;
  robotThinking: boolean;
  revealHidden: { player: number; robot: number } | null;
  onStartRound: () => void;
  onCommit: (hidden: number, guess: number) => void;
  onNextRound: () => void;
  t: I18n;
  language: "mn" | "en";
}) {
  const [hidden, setHidden] = useState(0);
  const [guess, setGuess] = useState(0);
  const playerStack = state.playerStack;
  const maxGuess = state.playerStack + state.robotStack;
  const phase: Phase = state.phase;

  if (phase === "idle" || phase === "result") {
    const handleStart = () => {
      setHidden(0);
      setGuess(0);
      if (phase === "result") onNextRound();
      else onStartRound();
    };
    return (
      <PrimaryButton
        onClick={handleStart}
        disabled={state.winner !== null}
        label={phase === "result" ? t.nextRound : t.startRound}
      />
    );
  }

  if (phase === "matchOver") {
    return null;
  }

  if (phase === "robotThinking" || robotThinking || phase === "revealing") {
    return (
      <div
        style={{
          padding: "14px 12px",
          background: "rgba(200,160,48,0.08)",
          border: "1px dashed rgba(200,160,48,0.35)",
          borderRadius: 8,
          color: "#d8c488",
          textAlign: "center",
          fontSize: 12,
          letterSpacing: 1.4,
          textTransform: "uppercase",
        }}
      >
        {revealHidden
          ? `${t.playerHeld}: ${revealHidden.player} · ${t.robotHeld}: ${revealHidden.robot}`
          : t.robotThinking}
      </div>
    );
  }

  // phase === "hiding"
  const clampedHidden = Math.max(0, Math.min(playerStack, hidden));
  const clampedGuess = Math.max(0, Math.min(maxGuess, guess));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <NumberControl
        label={t.chooseHidden}
        value={clampedHidden}
        onChange={setHidden}
        min={0}
        max={playerStack}
        hint={t.hiddenRange(playerStack)}
        accent="#60c060"
      />
      <NumberControl
        label={t.chooseGuess}
        value={clampedGuess}
        onChange={setGuess}
        min={0}
        max={maxGuess}
        hint={t.guessRange(maxGuess)}
        accent="#c8a030"
      />
      <PrimaryButton
        onClick={() => onCommit(clampedHidden, clampedGuess)}
        label={t.commit}
      />
      <div
        style={{
          fontSize: 10,
          color: "#8c7a4a",
          letterSpacing: 0.3,
          lineHeight: 1.5,
        }}
      >
        {language === "mn"
          ? "Нуух тоог сонгоод таамгаа хатуулахад робот шидэлтээ шидэж, нээлт болно."
          : "Pick how many to hide, enter your guess, then hands open."}
      </div>
    </div>
  );
}

function PrimaryButton({
  onClick,
  label,
  disabled = false,
}: {
  onClick: () => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        padding: "10px 14px",
        fontSize: 13,
        letterSpacing: 1.5,
        textTransform: "uppercase",
        background: disabled
          ? "rgba(80,70,40,0.4)"
          : "linear-gradient(180deg, #d4b040, #a07820)",
        color: disabled ? "#555" : "#1a1208",
        border: "1px solid rgba(200,160,48,0.7)",
        borderRadius: 6,
        cursor: disabled ? "not-allowed" : "pointer",
        fontWeight: 700,
        boxShadow: disabled ? "none" : "0 4px 16px rgba(200,160,48,0.25)",
      }}
    >
      {label}
    </button>
  );
}

function NumberControl({
  label,
  value,
  onChange,
  min,
  max,
  hint,
  accent,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min: number;
  max: number;
  hint: string;
  accent: string;
}) {
  const clamp = (n: number) => Math.max(min, Math.min(max, n));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          color: "#d8c488",
          fontSize: 11,
          letterSpacing: 1.2,
          textTransform: "uppercase",
        }}
      >
        <span>{label}</span>
        <span style={{ color: "#8c7a4a", fontSize: 10 }}>{hint}</span>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "rgba(0,0,0,0.35)",
          border: "1px solid rgba(200,160,48,0.2)",
          borderRadius: 6,
          padding: 4,
        }}
      >
        <StepButton label="−" onClick={() => onChange(clamp(value - 1))} />
        <div
          style={{
            flex: 1,
            textAlign: "center",
            color: accent,
            fontSize: 22,
            fontWeight: 700,
            lineHeight: "32px",
          }}
        >
          {value}
        </div>
        <StepButton label="+" onClick={() => onChange(clamp(value + 1))} />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(clamp(Number(e.target.value)))}
        style={{
          width: "100%",
          accentColor: accent,
        }}
      />
    </div>
  );
}

function StepButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 32,
        height: 32,
        background: "rgba(200,160,48,0.08)",
        border: "1px solid rgba(200,160,48,0.35)",
        borderRadius: 4,
        color: "#d8c488",
        fontSize: 16,
        cursor: "pointer",
        fontWeight: 700,
      }}
    >
      {label}
    </button>
  );
}

function RoundDetails({ round, t }: { round: RoundRecord; t: I18n }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 6,
        fontSize: 11,
        color: "#c0aa70",
        background: "rgba(0,0,0,0.25)",
        border: "1px solid rgba(200,160,48,0.12)",
        padding: "8px 10px",
        borderRadius: 6,
      }}
    >
      <Cell label={t.playerHeld} value={String(round.playerHeld)} />
      <Cell label={t.robotHeld} value={String(round.robotHeld)} />
      <Cell label={t.playerGuess} value={String(round.playerGuess)} accent />
      <Cell label={t.robotGuess} value={String(round.robotGuess)} accent />
      <div
        style={{
          gridColumn: "1 / -1",
          display: "flex",
          justifyContent: "space-between",
          paddingTop: 4,
          borderTop: "1px dashed rgba(200,160,48,0.15)",
        }}
      >
        <span>{t.trueTotal}</span>
        <span style={{ color: "#f0c040", fontWeight: 700 }}>{round.total}</span>
      </div>
      {round.transferredTo && (
        <div
          style={{
            gridColumn: "1 / -1",
            color: round.transferredTo === "player" ? "#60c060" : "#e06050",
            fontSize: 11,
          }}
        >
          ▲ {t.transferNote(round.transferredTo, round.transferredAmount)}
        </div>
      )}
    </div>
  );
}

function Cell({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <span style={{ opacity: 0.6 }}>{label}</span>
      <span style={{ color: accent ? "#f0c040" : "#d8c488", fontWeight: 600 }}>
        {value}
      </span>
    </div>
  );
}

function HistoryList({ state, t }: { state: GuessState; t: I18n }) {
  const items = useMemo(
    () => [...state.history].reverse().slice(0, 6),
    [state.history],
  );
  if (items.length === 0) {
    return (
      <div
        style={{
          color: "#7a6a3e",
          fontSize: 11,
          fontStyle: "italic",
          padding: "8px 0",
        }}
      >
        {t.historyEmpty}
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {items.map((r) => {
        const tag =
          r.outcome === "player"
            ? { label: t.outcomeTagPlayer, color: "#60c060" }
            : r.outcome === "robot"
              ? { label: t.outcomeTagRobot, color: "#e06050" }
              : r.outcome === "both"
                ? { label: t.outcomeTagBoth, color: "#d8c488" }
                : { label: t.outcomeTagNone, color: "#8c7a4a" };
        return (
          <div
            key={r.round}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(200,160,48,0.12)",
              borderRadius: 6,
              padding: "8px 10px",
              fontSize: 11,
            }}
          >
            <div
              style={{
                minWidth: 26,
                height: 26,
                borderRadius: 4,
                background: "rgba(200,160,48,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#c8a030",
                fontWeight: 700,
                fontSize: 11,
              }}
            >
              {r.round}
            </div>
            <div style={{ flex: 1, color: "#c0aa70" }}>
              <div>
                <span style={{ color: "#60c060" }}>{r.playerHeld}</span>
                <span style={{ opacity: 0.4 }}> + </span>
                <span style={{ color: "#e06050" }}>{r.robotHeld}</span>
                <span style={{ opacity: 0.4 }}> = </span>
                <span style={{ color: "#f0c040", fontWeight: 700 }}>
                  {r.total}
                </span>
              </div>
              <div style={{ fontSize: 10, opacity: 0.7 }}>
                {t.playerGuess}: {r.playerGuess} · {t.robotGuess}:{" "}
                {r.robotGuess}
              </div>
            </div>
            <div
              style={{
                color: tag.color,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: 1,
                textTransform: "uppercase",
                padding: "2px 6px",
                border: `1px solid ${tag.color}55`,
                borderRadius: 4,
              }}
            >
              {tag.label}
              {r.transferredAmount > 0 ? ` +${r.transferredAmount}` : ""}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function ShagaiGuessUI({
  state,
  onStartRound,
  onCommit,
  onNextRound,
  onReset,
  robotThinking,
  revealHidden,
  rewardEvents = [],
  sessionGain,
}: Props) {
  const t = useI18n();

  return (
    <>
      <div
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          bottom: 16,
          width: 340,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          padding: 14,
          background:
            "linear-gradient(180deg, rgba(20,14,8,0.96), rgba(14,10,6,0.92))",
          border: "1px solid rgba(200,160,48,0.28)",
          borderRadius: 10,
          color: "#d8c488",
          fontFamily:
            "var(--font-inter), -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
          overflowY: "auto",
          boxShadow: "0 0 40px rgba(0,0,0,0.6)",
          zIndex: 5,
        }}
      >
        <div>
          <div
            style={{
              color: "#c8a030",
              fontSize: 10,
              letterSpacing: 2.4,
              textAlign: "center",
              opacity: 0.8,
            }}
          >
            {t.overline}
          </div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: 2,
              textAlign: "center",
              color: "#f0c040",
              marginTop: 2,
            }}
          >
            {t.title}
          </div>
          <div
            style={{
              fontSize: 10,
              textAlign: "center",
              color: "#8c7a4a",
              letterSpacing: 1.4,
              marginTop: 2,
            }}
          >
            {t.subtitle}
          </div>
        </div>

        <GoldDivider />

        <StackBar
          label={t.yourStack}
          value={state.playerStack}
          total={TOTAL_SHAGAI}
          color="#60c060"
          emoji="👤"
          glow="rgba(96,192,96,0.45)"
        />
        <StackBar
          label={t.robotStack}
          value={state.robotStack}
          total={TOTAL_SHAGAI}
          color="#e06050"
          emoji="🤖"
          glow="rgba(224,96,80,0.45)"
        />

        <PhaseBanner state={state} robotThinking={robotThinking} t={t} />

        <PhaseControls
          state={state}
          robotThinking={robotThinking}
          revealHidden={revealHidden}
          onStartRound={onStartRound}
          onCommit={onCommit}
          onNextRound={onNextRound}
          t={t}
          language={t.language}
        />

        {state.lastRound && state.phase !== "hiding" && (
          <RoundDetails round={state.lastRound} t={t} />
        )}

        <GoldDivider />

        <div
          style={{
            color: "#c8a030",
            fontSize: 11,
            letterSpacing: 1.6,
            textTransform: "uppercase",
          }}
        >
          {t.statistic}
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 6,
          }}
        >
          <Stat
            label={t.roundsWon + " (" + t.playerLabel + ")"}
            value={state.playerWins}
            color="#60c060"
          />
          <Stat
            label={t.roundsWon + " (" + t.robotLabel + ")"}
            value={state.robotWins}
            color="#e06050"
          />
          <Stat label={t.round} value={state.round} color="#d8c488" />
        </div>

        <GoldDivider />

        <div
          style={{
            color: "#c8a030",
            fontSize: 11,
            letterSpacing: 1.6,
            textTransform: "uppercase",
          }}
        >
          {t.historyTitle}
        </div>
        <HistoryList state={state} t={t} />

        <GoldDivider />

        <div
          style={{
            color: "#c8a030",
            fontSize: 11,
            letterSpacing: 1.6,
            textTransform: "uppercase",
          }}
        >
          {t.howToPlayTitle}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {t.howToPlaySteps.map((s, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: 8,
                fontSize: 11,
                color: "#c0aa70",
                lineHeight: 1.5,
              }}
            >
              <div
                style={{
                  minWidth: 18,
                  height: 18,
                  borderRadius: "50%",
                  background: "rgba(200,160,48,0.15)",
                  color: "#f0c040",
                  fontWeight: 700,
                  fontSize: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  marginTop: 1,
                }}
              >
                {i + 1}
              </div>
              <div>
                <div style={{ color: "#d8c488", fontWeight: 600 }}>{s.t}</div>
                <div style={{ opacity: 0.7 }}>{s.d}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ flex: 1 }} />

        <button
          onClick={onReset}
          style={{
            padding: "8px 10px",
            fontSize: 10,
            letterSpacing: 1.6,
            textTransform: "uppercase",
            background: "transparent",
            color: "#8c7a4a",
            border: "1px solid rgba(200,160,48,0.25)",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          {t.resetBtn}
        </button>
      </div>

      {/* Reward toasts + session gain pill (player side only). */}
      {sessionGain && (sessionGain.coins > 0 || sessionGain.gems > 0) && (
        <div
          style={{
            position: "absolute",
            top: 16,
            left: 16,
            padding: "6px 12px",
            background: "rgba(0,0,0,0.6)",
            border: "1px solid rgba(200,160,48,0.3)",
            borderRadius: 999,
            color: "#f0c040",
            fontSize: 12,
            letterSpacing: 1,
            zIndex: 5,
          }}
        >
          +{sessionGain.coins} 🪙
          {sessionGain.gems > 0 ? ` · +${sessionGain.gems} 💎` : ""}
        </div>
      )}
      <style>{`
        @keyframes fadeOutSlideUp {
          0%   { opacity: 0; transform: translateY(12px); }
          20%  { opacity: 1; transform: translateY(0); }
          70%  { opacity: 1; transform: translateY(-6px); }
          100% { opacity: 0; transform: translateY(-14px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.55; }
        }
      `}</style>

      {rewardEvents.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: 60,
            left: 16,
            display: "flex",
            flexDirection: "column",
            gap: 6,
            zIndex: 5,
          }}
        >
          {rewardEvents.map((e) => (
            <div
              key={e.id}
              style={{
                padding: "4px 10px",
                background: "rgba(0,0,0,0.55)",
                border: `1px solid ${e.kind === "gems" ? "#a070d0aa" : "#c8a030aa"}`,
                borderRadius: 999,
                color: e.kind === "gems" ? "#d0b0f0" : "#f0c040",
                fontSize: 12,
                letterSpacing: 1,
                animation: "fadeOutSlideUp 1.35s forwards",
              }}
            >
              {e.text}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div
      style={{
        background: "rgba(0,0,0,0.3)",
        border: "1px solid rgba(200,160,48,0.15)",
        borderRadius: 6,
        padding: "6px 8px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div style={{ color, fontSize: 18, fontWeight: 700 }}>{value}</div>
      <div
        style={{
          fontSize: 9,
          color: "#8c7a4a",
          letterSpacing: 0.5,
          textTransform: "uppercase",
          textAlign: "center",
          lineHeight: 1.2,
        }}
      >
        {label}
      </div>
    </div>
  );
}
