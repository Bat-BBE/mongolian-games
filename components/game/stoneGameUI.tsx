"use client";

import {
  GameState,
  MAX_STONES,
  getPossibleTotals,
  WIN_SCORE,
} from "./stoneType";
import { useApp } from "@/components/AppContext";

interface Props {
  state: GameState;
  onPick: (n: number) => void;
  onGuess: (n: number) => void;
  onNext: () => void;
  onRestart: () => void;
  rewardEvents?: { id: string; text: string; kind: "coins" | "gems" }[];
  sessionGain?: { coins: number; gems: number };
}

type StoneI18n = {
  title: string;
  subtitle: string;
  player: string;
  computer: string;
  round: string;
  upTo: string;
  pickLabel: string;
  pickHint: string;
  pickChosen: (n: number) => string;
  guessLabel: (n: number) => string;
  guessRange: string;
  playerWin: string;
  computerWin: string;
  tie: string;
  youGuessed: (a: number, b: number) => string;
  playerGrabbed: (n: number) => string;
  computerGrabbed: (n: number) => string;
  equals: string;
  youWon: string;
  computerWonGame: string;
  restart: string;
  nextRound: string;
  rulesTitle: string;
  rules: { n: string; t: string; d: string }[];
  hideNote: string;
  rewardLabel: string;
  won: string;
  lost: string;
  draw: string;
};

function useStoneI18n(): StoneI18n {
  const { language } = useApp();
  if (language === "en") {
    return {
      title: "🪨 GUESS STONES",
      subtitle: "MONGOLIAN STONE GAME",
      player: "PLAYER",
      computer: "COMPUTER",
      round: "Round",
      upTo: `/ first to ${WIN_SCORE}`,
      pickLabel: "CHOOSE HOW MANY STONES TO GRAB",
      pickHint: "Pick 0 to 5 stones.",
      pickChosen: (n) => `✓ ${n} stones chosen — grabbing...`,
      guessLabel: (n) => `GUESS THE TOTAL (you grabbed ${n}🪨)`,
      guessRange: `Possible values: 0 – ${MAX_STONES * 2}`,
      playerWin: "You guessed right!",
      computerWin: "Computer guessed right!",
      tie: "Both were wrong",
      youGuessed: (a, b) =>
        `You guessed ${a}, robot guessed ${b}`,
      playerGrabbed: (n) => `You ${n}🪨`,
      computerGrabbed: (n) => `Computer ${n}🪨`,
      equals: "=",
      youWon: "You won!",
      computerWonGame: "Computer wins!",
      restart: "🔄 Restart",
      nextRound: "Next round →",
      rulesTitle: "HOW TO PLAY",
      rules: [
        { n: "①", t: "Pick stones", d: "Grab 0–5 stones" },
        { n: "②", t: "Reveal hands", d: "Both open together" },
        { n: "③", t: "Guess the sum", d: "Pick 0–10" },
        { n: "④", t: "Win", d: `First to ${WIN_SCORE} rounds` },
      ],
      hideNote: "Robot hides its stones. You only guess the sum.",
      rewardLabel: "REWARD (SESSION)",
      won: "won",
      lost: "lost",
      draw: "tie",
    };
  }
  return {
    title: "🪨 ЧУЛУУ ТАА",
    subtitle: "MONGOLIAN STONE GAME",
    player: "ТОГЛОГЧ",
    computer: "КОМПЬЮТЕР",
    round: "Раунд",
    upTo: `/${WIN_SCORE} хүртэл`,
    pickLabel: "АТГАХ ЧУЛУУГАА СОНГО",
    pickHint: "0-аас 5 хүртэл чулуу сонгоно уу.",
    pickChosen: (n) => `✓ ${n} чулуу сонгосон — чулуу атгаж байна...`,
    guessLabel: (n) => `НИЙЛБЭРИЙГ ТАА (та ${n}🪨 атгасан)`,
    guessRange: `Боломжит утга: 0 – ${MAX_STONES * 2}`,
    playerWin: "Та зөв таалаа!",
    computerWin: "Компьютер зөв таалаа!",
    tie: "Хоёулаа буруу",
    youGuessed: (a, b) => `Та ${a}, Robot ${b} гэж таалаа`,
    playerGrabbed: (n) => `Та ${n}🪨`,
    computerGrabbed: (n) => `Компьютер ${n}🪨`,
    equals: "=",
    youWon: "Та ялалт байгуулав!",
    computerWonGame: "Компьютер ялав!",
    restart: "🔄 Дахин тоглох",
    nextRound: "Дараагийн раунд →",
    rulesTitle: "ТОГЛООМЫН ДҮРЭМ",
    rules: [
      { n: "①", t: "Чулуугаа сонгоно", d: "0–5 чулуу атга" },
      { n: "②", t: "Атган чулуугаа нээнэ", d: "Хоёулаа зэрэг" },
      { n: "③", t: "Нийлбэр таана", d: "0–10 тоо сонго" },
      { n: "④", t: "Хожих", d: `${WIN_SCORE} раунд хожно` },
    ],
    hideNote: "Робот чулуугаа нууна. Та зөвхөн нийлбэрийг таана.",
    rewardLabel: "ШАГНАЛ (SESSION)",
    won: "хожсон",
    lost: "хожигдсон",
    draw: "тэнцсэн",
  };
}

function Divider() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        margin: "12px 0",
      }}
    >
      <div
        style={{
          flex: 1,
          height: 1,
          background: "linear-gradient(to right, transparent, #c8a030)",
        }}
      />
      <span style={{ color: "#c8a030", fontSize: 10 }}>◆</span>
      <div
        style={{
          flex: 1,
          height: 1,
          background: "linear-gradient(to left, transparent, #c8a030)",
        }}
      />
    </div>
  );
}

function ScoreBar({
  score,
  round,
  t,
}: {
  score: { player: number; computer: number };
  round: number;
  t: StoneI18n;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 4,
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div style={{ color: "#60c060", fontSize: 22, fontWeight: "bold" }}>
          {score.player}
        </div>
        <div style={{ color: "#888", fontSize: 10, letterSpacing: 2 }}>
          {t.player}
        </div>
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ color: "#c8a030", fontSize: 13, letterSpacing: 2 }}>
          {t.round} {round}
        </div>
        <div style={{ color: "#555", fontSize: 10 }}>{t.upTo}</div>
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ color: "#e06050", fontSize: 22, fontWeight: "bold" }}>
          {score.computer}
        </div>
        <div style={{ color: "#888", fontSize: 10, letterSpacing: 2 }}>
          {t.computer}
        </div>
      </div>
    </div>
  );
}

function StonePicker({
  selected,
  onPick,
  label,
}: {
  selected: number | null;
  onPick: (n: number) => void;
  label: string;
}) {
  return (
    <div>
      <div
        style={{
          color: "#aaa",
          fontSize: 12,
          marginBottom: 8,
          letterSpacing: 1,
        }}
      >
        {label}
      </div>
      <div
        style={{
          display: "flex",
          gap: 8,
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        {Array.from({ length: MAX_STONES + 1 }, (_, i) => (
          <button
            key={i}
            onClick={() => onPick(i)}
            style={{
              width: 46,
              height: 46,
              borderRadius: 12,
              border:
                selected === i
                  ? "2px solid #c8a030"
                  : "2px solid rgba(255,255,255,0.1)",
              background:
                selected === i
                  ? "rgba(200,160,48,0.25)"
                  : "rgba(255,255,255,0.05)",
              color: selected === i ? "#f0c040" : "#ccc",
              fontSize: 18,
              fontWeight: "bold",
              cursor: "pointer",
              transition: "all 0.18s",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
              fontFamily: "var(--font-inter), -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
              boxShadow:
                selected === i ? "0 0 12px rgba(200,160,48,0.3)" : "none",
            }}
          >
            <span>{i}</span>
            <span style={{ fontSize: 8, color: "#666" }}>
              {"🪨".repeat(Math.min(i, 3))}
              {i > 3 ? "+" : ""}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function GuessPicker({
  selected,
  onGuess,
  label,
  rangeLabel,
}: {
  selected: number | null;
  onGuess: (n: number) => void;
  label: string;
  rangeLabel: string;
}) {
  const totals = getPossibleTotals();

  return (
    <div>
      <div
        style={{
          color: "#aaa",
          fontSize: 12,
          marginBottom: 4,
          letterSpacing: 1,
        }}
      >
        {label}
      </div>
      <div style={{ color: "#666", fontSize: 11, marginBottom: 8 }}>
        {rangeLabel}
      </div>
      <div
        style={{
          display: "flex",
          gap: 6,
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        {totals.map((n) => (
          <button
            key={n}
            onClick={() => onGuess(n)}
            style={{
              width: 38,
              height: 38,
              borderRadius: 8,
              border:
                selected === n
                  ? "2px solid #c8a030"
                  : "2px solid rgba(255,255,255,0.08)",
              background:
                selected === n
                  ? "rgba(200,160,48,0.25)"
                  : "rgba(255,255,255,0.04)",
              color: selected === n ? "#f0c040" : "#bbb",
              fontSize: 15,
              fontWeight: "bold",
              cursor: "pointer",
              transition: "all 0.15s",
              fontFamily: "var(--font-inter), -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
            }}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

function ResultPanel({
  state,
  onNext,
  onRestart,
  t,
}: {
  state: GameState;
  onNext: () => void;
  onRestart: () => void;
  t: StoneI18n;
}) {
  const last = state.history[state.history.length - 1];
  const gameOver =
    state.score.player >= WIN_SCORE || state.score.computer >= WIN_SCORE;
  const playerWins = state.score.player >= WIN_SCORE;

  return (
    <div style={{ textAlign: "center" }}>
      {gameOver ? (
        <>
          <div style={{ fontSize: 52, marginBottom: 8 }}>
            {playerWins ? "🏆" : "😔"}
          </div>
          <div
            style={{
              color: playerWins ? "#f0c040" : "#e06050",
              fontSize: 22,
              fontWeight: "bold",
              letterSpacing: 2,
              marginBottom: 6,
              fontFamily: "var(--font-inter), -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
            }}
          >
            {playerWins ? t.youWon : t.computerWonGame}
          </div>
          <div style={{ color: "#888", fontSize: 13, marginBottom: 16 }}>
            {state.score.player} : {state.score.computer}
          </div>
          <button onClick={onRestart} style={primaryBtn("#c8a030", "#1a0e00")}>
            {t.restart}
          </button>
        </>
      ) : (
        <>
          {last && (
            <div
              style={{
                background:
                  last.outcome === "player"
                    ? "rgba(96,192,96,0.12)"
                    : last.outcome === "computer"
                      ? "rgba(224,96,80,0.12)"
                      : "rgba(200,160,48,0.10)",
                border:
                  last.outcome === "player"
                    ? "1px solid #60c06044"
                    : last.outcome === "computer"
                      ? "1px solid #e0605044"
                      : "1px solid rgba(200,160,48,0.22)",
                borderRadius: 12,
                padding: "12px 16px",
                marginBottom: 14,
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 6 }}>
                {last.outcome === "player"
                  ? "✅"
                  : last.outcome === "computer"
                    ? "❌"
                    : "🤝"}
              </div>
              <div
                style={{
                  color:
                    last.outcome === "player"
                      ? "#60c060"
                      : last.outcome === "computer"
                        ? "#e06050"
                        : "#f0c040",
                  fontSize: 16,
                  fontWeight: "bold",
                  marginBottom: 4,
                }}
              >
                {last.outcome === "player"
                  ? t.playerWin
                  : last.outcome === "computer"
                    ? t.computerWin
                    : t.tie}
              </div>
              <div style={{ color: "#ccc", fontSize: 13, lineHeight: 1.6 }}>
                {t.playerGrabbed(last.playerStones)}{" "}
                <b style={{ color: "#f0c040" }}>+</b>{" "}
                {t.computerGrabbed(last.computerStones)}{" "}
                <b style={{ color: "#f0c040" }}>=</b>{" "}
                <b style={{ color: "#f0c040" }}>{last.total}</b>
              </div>
              <div style={{ color: "#888", fontSize: 12, marginTop: 4 }}>
                {t.youGuessed(last.playerGuess, last.computerGuess)}
              </div>
            </div>
          )}
          <button onClick={onNext} style={primaryBtn("#c8a030", "#1a0e00")}>
            {t.nextRound}
          </button>
        </>
      )}
    </div>
  );
}

function primaryBtn(bg: string, fg: string): React.CSSProperties {
  return {
    width: "100%",
    padding: "12px 0",
    background: `linear-gradient(135deg, ${bg}, #f0c040 50%, ${bg})`,
    color: fg,
    border: "none",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: "bold",
    cursor: "pointer",
    letterSpacing: 1,
    fontFamily: "var(--font-inter), -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
    boxShadow: "0 4px 16px rgba(200,160,48,0.3)",
  };
}

function HistoryDots({
  history,
  t,
}: {
  history: GameState["history"];
  t: StoneI18n;
}) {
  if (history.length === 0) return null;
  return (
    <div
      style={{
        display: "flex",
        gap: 4,
        justifyContent: "center",
        marginTop: 8,
      }}
    >
      {history.map((r, i) => {
        const won = r.outcome === "player";
        const lost = r.outcome === "computer";
        const label = won ? t.won : lost ? t.lost : t.draw;
        const bg = won ? "#60c060" : lost ? "#e06050" : "#c8a030";
        return (
          <div
            key={i}
            title={`${t.round} ${i + 1}: ${label}`}
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: bg,
              opacity: 0.8,
            }}
          />
        );
      })}
    </div>
  );
}

export default function StoneGameUI({
  state,
  onPick,
  onGuess,
  onNext,
  onRestart,
  rewardEvents = [],
  sessionGain,
}: Props) {
  const t = useStoneI18n();
  const panel: React.CSSProperties = {
    position: "absolute",
    background: "rgba(6,4,2,0.90)",
    border: "1px solid rgba(200,160,48,0.30)",
    borderRadius: 16,
    padding: "18px 18px 14px",
    backdropFilter: "blur(16px)",
    boxShadow: "0 8px 40px rgba(0,0,0,0.7)",
    fontFamily: "var(--font-inter), -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
    color: "white",
    zIndex: 10,
    maxHeight: "calc(100% - 40px)",
    overflowY: "auto",
    overflowX: "hidden",
    scrollbarWidth: "thin",
    scrollbarColor: "rgba(200,160,48,0.35) transparent",
  };

  return (
    <>
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 20,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 18,
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          {rewardEvents.map((e) => (
            <div
              key={e.id}
              style={{
                marginBottom: 8,
                display: "flex",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  padding: "8px 12px",
                  borderRadius: 999,
                  border:
                    e.kind === "coins"
                      ? "1px solid rgba(240,192,64,0.55)"
                      : "1px solid rgba(96,192,255,0.55)",
                  background:
                    e.kind === "coins"
                      ? "linear-gradient(135deg, rgba(200,160,48,0.26), rgba(240,192,64,0.12))"
                      : "linear-gradient(135deg, rgba(96,192,255,0.22), rgba(180,220,255,0.10))",
                  color: e.kind === "coins" ? "#f0c040" : "#bfe6ff",
                  fontSize: 13,
                  fontWeight: 900,
                  letterSpacing: 1.2,
                  fontFamily: "var(--font-inter), -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
                  boxShadow:
                    e.kind === "coins"
                      ? "0 10px 40px rgba(200,160,48,0.18)"
                      : "0 10px 40px rgba(96,192,255,0.14)",
                  animation: "rewardFloat 1.25s ease forwards",
                }}
              >
                {e.text}
              </div>
            </div>
          ))}
        </div>

        {sessionGain && (sessionGain.coins > 0 || sessionGain.gems > 0) ? (
          <div
            style={{
              position: "absolute",
              top: 18,
              right: 18,
              padding: "10px 12px",
              borderRadius: 14,
              background: "rgba(6,4,2,0.78)",
              border: "1px solid rgba(200,160,48,0.22)",
              backdropFilter: "blur(14px)",
              boxShadow: "0 10px 40px rgba(0,0,0,0.55)",
              color: "white",
              fontFamily: "var(--font-inter), -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
            }}
          >
            <div
              style={{
                color: "#c8a030",
                fontSize: 10,
                letterSpacing: 3,
                marginBottom: 4,
              }}
            >
              {t.rewardLabel}
            </div>
            <div
              style={{ display: "flex", gap: 10, fontSize: 12, color: "#ddd" }}
            >
              <span style={{ color: "#f0c040", fontWeight: "bold" }}>
                🪙 +{sessionGain.coins}
              </span>
              <span style={{ color: "#bfe6ff", fontWeight: "bold" }}>
                💎 +{sessionGain.gems}
              </span>
            </div>
          </div>
        ) : null}
      </div>

      <div
        className="stone-game-panel"
        style={{ ...panel, top: 20, left: 20, width: 290 }}
      >
        <div style={{ textAlign: "center", marginBottom: 6 }}>
          <div
            style={{
              color: "#c8a030",
              fontSize: 18,
              fontWeight: "bold",
              letterSpacing: 3,
            }}
          >
            {t.title}
          </div>
          <div style={{ color: "#666", fontSize: 10, letterSpacing: 4 }}>
            {t.subtitle}
          </div>
        </div>

        <Divider />
        <ScoreBar score={state.score} round={state.round} t={t} />
        <HistoryDots history={state.history} t={t} />
        <Divider />

        {state.phase === "pick" && (
          <div>
            <StonePicker
              selected={state.playerStones}
              onPick={onPick}
              label={t.pickLabel}
            />
            {state.playerStones === null && (
              <div
                style={{
                  color: "#555",
                  fontSize: 11,
                  textAlign: "center",
                  marginTop: 10,
                }}
              >
                {t.pickHint}
              </div>
            )}
            {state.playerStones !== null && (
              <div
                style={{
                  color: "#c8a030",
                  fontSize: 12,
                  textAlign: "center",
                  marginTop: 10,
                  animation: "pulse 1s infinite",
                }}
              >
                {t.pickChosen(state.playerStones)}
              </div>
            )}
          </div>
        )}

        {state.phase === "guess" && (
          <GuessPicker
            selected={state.playerGuess}
            onGuess={onGuess}
            label={t.guessLabel(state.playerStones ?? 0)}
            rangeLabel={t.guessRange}
          />
        )}

        {state.phase === "result" && (
          <ResultPanel
            state={state}
            onNext={onNext}
            onRestart={onRestart}
            t={t}
          />
        )}
      </div>

      <div
        className="stone-game-panel"
        style={{ ...panel, top: 20, right: 20, width: 200 }}
      >
        <div
          style={{
            color: "#c8a030",
            fontSize: 11,
            letterSpacing: 3,
            marginBottom: 8,
          }}
        >
          {t.rulesTitle}
        </div>
        <Divider />
        {t.rules.map((r) => (
          <div
            key={r.n}
            style={{
              display: "flex",
              gap: 10,
              marginBottom: 10,
              alignItems: "flex-start",
            }}
          >
            <span style={{ color: "#c8a030", fontSize: 14, minWidth: 18 }}>
              {r.n}
            </span>
            <div>
              <div style={{ color: "#ddd", fontSize: 12 }}>{r.t}</div>
              <div style={{ color: "#666", fontSize: 11 }}>{r.d}</div>
            </div>
          </div>
        ))}

        <Divider />
        <div
          style={{
            color: "#666",
            fontSize: 11,
            textAlign: "center",
            lineHeight: 1.5,
          }}
        >
          {t.hideNote}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes rewardFloat {
          0%   { opacity: 0; transform: translateY(10px) scale(0.98); }
          15%  { opacity: 1; transform: translateY(0px)  scale(1); }
          70%  { opacity: 1; transform: translateY(-18px) scale(1.02); }
          100% { opacity: 0; transform: translateY(-32px) scale(1.03); }
        }
        .stone-game-panel::-webkit-scrollbar {
          width: 6px;
        }
        .stone-game-panel::-webkit-scrollbar-track {
          background: transparent;
        }
        .stone-game-panel::-webkit-scrollbar-thumb {
          background: rgba(200,160,48,0.35);
          border-radius: 3px;
        }
        .stone-game-panel::-webkit-scrollbar-thumb:hover {
          background: rgba(200,160,48,0.55);
        }
      `}</style>
    </>
  );
}
