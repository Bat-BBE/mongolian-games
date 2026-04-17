"use client"

import { GameState, MAX_STONES, getPossibleTotals, WIN_SCORE } from "./stoneType"

interface Props {
  state:     GameState
  onPick:    (n: number) => void
  onGuess:   (n: number) => void
  onNext:    () => void
  onRestart: () => void
  rewardEvents?: { id: string; text: string; kind: "coins" | "gems" }[]
  sessionGain?: { coins: number; gems: number }
}

function Divider() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "12px 0" }}>
      <div style={{ flex: 1, height: 1, background: "linear-gradient(to right, transparent, #c8a030)" }} />
      <span style={{ color: "#c8a030", fontSize: 10 }}>◆</span>
      <div style={{ flex: 1, height: 1, background: "linear-gradient(to left, transparent, #c8a030)" }} />
    </div>
  )
}

function ScoreBar({ score, round }: { score: { player: number; computer: number }; round: number }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ color: "#60c060", fontSize: 22, fontWeight: "bold" }}>{score.player}</div>
        <div style={{ color: "#888", fontSize: 10, letterSpacing: 2 }}>ТОГЛОГЧ</div>
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ color: "#c8a030", fontSize: 13, letterSpacing: 2 }}>Раунд {round}</div>
        <div style={{ color: "#555", fontSize: 10 }}>/{WIN_SCORE} хүртэл</div>
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ color: "#e06050", fontSize: 22, fontWeight: "bold" }}>{score.computer}</div>
        <div style={{ color: "#888", fontSize: 10, letterSpacing: 2 }}>КОМПЬЮТЕР</div>
      </div>
    </div>
  )
}

function StonePicker({
  selected,
  onPick,
  label,
}: {
  selected: number | null
  onPick:   (n: number) => void
  label:    string
}) {
  return (
    <div>
      <div style={{ color: "#aaa", fontSize: 12, marginBottom: 8, letterSpacing: 1 }}>{label}</div>
      <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
        {Array.from({ length: MAX_STONES + 1 }, (_, i) => (
          <button
            key={i}
            onClick={() => onPick(i)}
            style={{
              width: 46,
              height: 46,
              borderRadius: 12,
              border: selected === i
                ? "2px solid #c8a030"
                : "2px solid rgba(255,255,255,0.1)",
              background: selected === i
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
              fontFamily: "'Noto Serif', Georgia, serif",
              boxShadow: selected === i ? "0 0 12px rgba(200,160,48,0.3)" : "none",
            }}
          >
            <span>{i}</span>
            <span style={{ fontSize: 8, color: "#666" }}>{"🪨".repeat(Math.min(i, 3))}{i > 3 ? "+" : ""}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function GuessPicker({
  selected,
  onGuess,
  playerStones,
}: {
  selected:     number | null
  onGuess:      (n: number) => void
  playerStones: number
}) {
  const totals = getPossibleTotals()

  return (
    <div>
      <div style={{ color: "#aaa", fontSize: 12, marginBottom: 4, letterSpacing: 1 }}>
        НИЙЛБЭРИЙГ ТАА (та {playerStones}🪨 атгасан)
      </div>
      <div style={{ color: "#666", fontSize: 11, marginBottom: 8 }}>
        Боломжит утга: 0 – {MAX_STONES * 2}
      </div>
      <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" }}>
        {totals.map((n) => (
          <button
            key={n}
            onClick={() => onGuess(n)}
            style={{
              width: 38,
              height: 38,
              borderRadius: 8,
              border: selected === n
                ? "2px solid #c8a030"
                : "2px solid rgba(255,255,255,0.08)",
              background: selected === n
                ? "rgba(200,160,48,0.25)"
                : "rgba(255,255,255,0.04)",
              color: selected === n ? "#f0c040" : "#bbb",
              fontSize: 15,
              fontWeight: "bold",
              cursor: "pointer",
              transition: "all 0.15s",
              fontFamily: "'Noto Serif', Georgia, serif",
            }}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  )
}

function ResultPanel({
  state,
  onNext,
  onRestart,
}: {
  state:     GameState
  onNext:    () => void
  onRestart: () => void
}) {
  const last     = state.history[state.history.length - 1]
  const gameOver = state.score.player >= WIN_SCORE || state.score.computer >= WIN_SCORE
  const playerWins = state.score.player >= WIN_SCORE

  return (
    <div style={{ textAlign: "center" }}>
      {gameOver ? (
        <>
          <div style={{ fontSize: 52, marginBottom: 8 }}>
            {playerWins ? "🏆" : "😔"}
          </div>
          <div style={{
            color: playerWins ? "#f0c040" : "#e06050",
            fontSize: 22,
            fontWeight: "bold",
            letterSpacing: 2,
            marginBottom: 6,
            fontFamily: "'Noto Serif', Georgia, serif",
          }}>
            {playerWins ? "Та ялалт байгуулав!" : "Компьютер ялав!"}
          </div>
          <div style={{ color: "#888", fontSize: 13, marginBottom: 16 }}>
            {state.score.player} : {state.score.computer}
          </div>
          <button onClick={onRestart} style={primaryBtn("#c8a030", "#1a0e00")}>
            🔄 Дахин тоглох
          </button>
        </>
      ) : (
        <>
          {last && (
            <div style={{
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
            }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>
                {last.outcome === "player"
                  ? "✅"
                  : last.outcome === "computer"
                    ? "❌"
                    : "🤝"}
              </div>
              <div style={{
                color:
                  last.outcome === "player"
                    ? "#60c060"
                    : last.outcome === "computer"
                      ? "#e06050"
                      : "#f0c040",
                fontSize: 16,
                fontWeight: "bold",
                marginBottom: 4,
              }}>
                {last.outcome === "player"
                  ? "Та зөв таалаа!"
                  : last.outcome === "computer"
                    ? "Компьютер зөв таалаа!"
                    : "Хоёулаа буруу"}
              </div>
              <div style={{ color: "#ccc", fontSize: 13, lineHeight: 1.6 }}>
                Та <b style={{ color: "#f0c040" }}>{last.playerStones}</b>🪨 +
                Компьютер <b style={{ color: "#f0c040" }}>{last.computerStones}</b>🪨
                = <b style={{ color: "#f0c040" }}>{last.total}</b>
              </div>
              <div style={{ color: "#888", fontSize: 12, marginTop: 4 }}>
                Та <b>{last.playerGuess}</b>, COM <b>{last.computerGuess}</b> гэж таалаа
              </div>
            </div>
          )}
          <button onClick={onNext} style={primaryBtn("#c8a030", "#1a0e00")}>
            Дараагийн раунд →
          </button>
        </>
      )}
    </div>
  )
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
    fontFamily: "'Noto Serif', Georgia, serif",
    boxShadow: "0 4px 16px rgba(200,160,48,0.3)",
  }
}

function HistoryDots({ history }: { history: GameState["history"] }) {
  if (history.length === 0) return null
  return (
    <div style={{ display: "flex", gap: 4, justifyContent: "center", marginTop: 8 }}>
      {history.map((r, i) => {
        const won = r.outcome === "player"
        const lost = r.outcome === "computer"
        const label = won ? "хожсон" : lost ? "хожигдсон" : "тэнцсэн"
        const bg = won ? "#60c060" : lost ? "#e06050" : "#c8a030"
        return (
          <div
            key={i}
            title={`Раунд ${i + 1}: ${label}`}
            style={{
              width: 10, height: 10,
              borderRadius: "50%",
              background: bg,
              opacity: 0.8,
            }}
          />
        )
      })}
    </div>
  )
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
  const panel: React.CSSProperties = {
    position: "absolute",
    background: "rgba(6,4,2,0.90)",
    border: "1px solid rgba(200,160,48,0.30)",
    borderRadius: 16,
    padding: "18px 18px 14px",
    backdropFilter: "blur(16px)",
    boxShadow: "0 8px 40px rgba(0,0,0,0.7)",
    fontFamily: "'Noto Serif', Georgia, serif",
    color: "white",
    zIndex: 10,
  }

  return (
    <>
      {/* ── Reward toasts (floating +3 coins, +1 gem) ── */}
      <div
        style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 20 }}
      >
        <div style={{ position: "absolute", top: 18, left: "50%", transform: "translateX(-50%)" }}>
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
                    fontFamily: "'Noto Serif', Georgia, serif",
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

        {/* Session gain chip (realtime feel) */}
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
              fontFamily: "'Noto Serif', Georgia, serif",
            }}
          >
            <div style={{ color: "#c8a030", fontSize: 10, letterSpacing: 3, marginBottom: 4 }}>
              ШАГНАЛ (SESSION)
            </div>
            <div style={{ display: "flex", gap: 10, fontSize: 12, color: "#ddd" }}>
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

      {/* ── Зүүн самбар: тоглоомын удирдлага ── */}
      <div style={{ ...panel, top: 20, left: 20, width: 290 }}>

        {/* Гарчиг */}
        <div style={{ textAlign: "center", marginBottom: 6 }}>
          <div style={{ color: "#c8a030", fontSize: 18, fontWeight: "bold", letterSpacing: 3 }}>
            🪨 ЧУЛУУ ТАА
          </div>
          <div style={{ color: "#666", fontSize: 10, letterSpacing: 4 }}>MONGOLIAN STONE GAME</div>
        </div>

        <Divider />
        <ScoreBar score={state.score} round={state.round} />
        <HistoryDots history={state.history} />
        <Divider />

        {/* Үе тус бүрийн UI */}
        {state.phase === "pick" && (
          <div>
            <StonePicker
              selected={state.playerStones}
              onPick={onPick}
              label="АТГАХ ЧУЛУУГАА СОНГО"
            />
            {state.playerStones === null && (
              <div style={{ color: "#555", fontSize: 11, textAlign: "center", marginTop: 10 }}>
                0-аас 5 хүртэл чулуу сонго
              </div>
            )}
            {state.playerStones !== null && (
              <div style={{ color: "#c8a030", fontSize: 12, textAlign: "center", marginTop: 10, animation: "pulse 1s infinite" }}>
                ✓ {state.playerStones} чулуу сонгосон — нударгаа зангидаж байна...
              </div>
            )}
          </div>
        )}

        {state.phase === "guess" && (
          <GuessPicker
            selected={state.playerGuess}
            onGuess={onGuess}
            playerStones={state.playerStones ?? 0}
          />
        )}

        {state.phase === "result" && (
          <ResultPanel state={state} onNext={onNext} onRestart={onRestart} />
        )}
      </div>

      {/* ── Баруун самбар: дүрэм ── */}
      <div style={{ ...panel, top: 20, right: 20, width: 200 }}>
        <div style={{ color: "#c8a030", fontSize: 11, letterSpacing: 3, marginBottom: 8 }}>
          ТОГЛООМЫН ДҮРЭМ
        </div>
        <Divider />
        {[
          { n: "①", t: "Чулуу нуу", d: "0–5 чулуу атга" },
          { n: "②", t: "Нударга нээ", d: "Хоёулаа зэрэг" },
          { n: "③", t: "Нийлбэр тааа", d: "0–10 тоо сонго" },
          { n: "④", t: "Хожих", d: `${WIN_SCORE} раунд хожно` },
        ].map((r) => (
          <div key={r.n} style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start" }}>
            <span style={{ color: "#c8a030", fontSize: 14, minWidth: 18 }}>{r.n}</span>
            <div>
              <div style={{ color: "#ddd", fontSize: 12 }}>{r.t}</div>
              <div style={{ color: "#666", fontSize: 11 }}>{r.d}</div>
            </div>
          </div>
        ))}

        <Divider />
        {/* Requirement: 컴-ийн атгасан чулууг UI дээр урьдчилж харуулахгүй */}
        <div style={{ color: "#666", fontSize: 11, textAlign: "center", lineHeight: 1.5 }}>
          COM чулуугаа нууна. Та зөвхөн нийлбэрийг таана.
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
      `}</style>
    </>
  )
}