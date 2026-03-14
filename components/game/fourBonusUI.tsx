"use client"

import { GameState, SHAGAI_INFO, ShagaiSide } from "./fourBonusType"

interface Props {
  state:     GameState
  onThrow:   () => void
  onReset:   () => void
  settledSides: (ShagaiSide | null)[]  // 4 шагайн одоогийн тал
}

function GoldDivider() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "10px 0" }}>
      <div style={{ flex: 1, height: 1, background: "linear-gradient(to right, transparent, #c8a030)" }} />
      <span style={{ color: "#c8a030", fontSize: 10 }}>❖</span>
      <div style={{ flex: 1, height: 1, background: "linear-gradient(to left, transparent, #c8a030)" }} />
    </div>
  )
}

// 4 шагайн одоогийн үр дүн харуулах
function CurrentResult({ sides }: { sides: (ShagaiSide | null)[] }) {
  const isDone = sides.every(s => s !== null)
  const isWin  = isDone && new Set(sides).size === 4

  return (
    <div style={{ display: "flex", gap: 8, justifyContent: "center", margin: "10px 0" }}>
      {sides.map((side, i) => {
        const info = side ? SHAGAI_INFO[side] : null
        return (
          <div
            key={i}
            style={{
              width: 56,
              height: 64,
              borderRadius: 12,
              border: `2px solid ${info ? info.color + "88" : "rgba(255,255,255,0.1)"}`,
              background: info
                ? `rgba(${hexToRgb(info.color)},0.12)`
                : "rgba(255,255,255,0.03)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
              transition: "all 0.4s cubic-bezier(0.34,1.56,0.64,1)",
              transform: info && isWin ? "scale(1.1)" : "scale(1)",
              boxShadow: info && isWin ? `0 0 16px ${info.glow}` : "none",
            }}
          >
            <span style={{ fontSize: info ? 24 : 18, lineHeight: 1 }}>
              {info ? info.symbol : "❓"}
            </span>
            <span style={{
              fontSize: 10,
              color: info ? info.color : "#555",
              letterSpacing: 0.5,
              fontFamily: "'Noto Serif', Georgia, serif",
            }}>
              {info ? info.name : "—"}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// Түүхийн жагсаалт
function HistoryList({ history }: { history: GameState["history"] }) {
  if (history.length === 0) return (
    <div style={{ color: "#444", fontSize: 11, textAlign: "center", padding: "8px 0" }}>
      Түүх хоосон
    </div>
  )
  const recent = [...history].reverse().slice(0, 6)
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {recent.map((r, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "5px 8px",
            background: r.isDorvenBerkh
              ? "rgba(200,160,48,0.15)"
              : "rgba(255,255,255,0.03)",
            borderRadius: 8,
            border: r.isDorvenBerkh
              ? "1px solid rgba(200,160,48,0.4)"
              : "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <div style={{ display: "flex", gap: 3 }}>
            {r.sides.map((s, j) => (
              <span key={j} style={{ fontSize: 14 }}>{SHAGAI_INFO[s].symbol}</span>
            ))}
          </div>
          {r.isDorvenBerkh && (
            <span style={{ color: "#c8a030", fontSize: 10, letterSpacing: 1 }}>
              🏆 БЭРХ
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

export default function FourBonesUI({ state, onThrow, onReset, settledSides }: Props) {
  const canThrow = state.phase === "idle" || state.phase === "result"
  const isWin    = state.phase === "result" &&
    state.history.length > 0 &&
    state.history[state.history.length - 1].isDorvenBerkh

  const winRate = state.totalThrows > 0
    ? ((state.wins / state.totalThrows) * 100).toFixed(1)
    : "0.0"

  const panel: React.CSSProperties = {
    position:       "absolute",
    background:     "rgba(6,4,2,0.90)",
    border:         "1px solid rgba(200,160,48,0.28)",
    borderRadius:   16,
    padding:        "16px 16px 14px",
    backdropFilter: "blur(16px)",
    boxShadow:      "0 8px 40px rgba(0,0,0,0.7)",
    fontFamily:     "'Noto Serif', Georgia, serif",
    color:          "white",
    zIndex:         10,
  }

  return (
    <>
      {/* ── Зүүн самбар: үндсэн тоглоом ── */}
      <div style={{ ...panel, top: 20, left: 20, width: 280 }}>

        {/* Гарчиг */}
        <div style={{ textAlign: "center", marginBottom: 4 }}>
          <div style={{ color: "#c8a030", fontSize: 8, letterSpacing: 5, marginBottom: 2 }}>
            ᠳᠥᠷᠪᠡᠨ ᠪᠡᠷᠬᠡ
          </div>
          <div style={{
            color: "#f0c040",
            fontSize: 20,
            fontWeight: "bold",
            letterSpacing: 3,
            textShadow: "0 0 20px rgba(240,192,64,0.4)",
          }}>
            🦴 ДӨРВӨН БЭРХ
          </div>
          <div style={{ color: "#666", fontSize: 9, letterSpacing: 4 }}>
            4 MONGOLIAN SHAGAI
          </div>
        </div>

        <GoldDivider />

        {/* Одоогийн үр дүн */}
        <div style={{ marginBottom: 4 }}>
          <div style={{ color: "#888", fontSize: 11, textAlign: "center", marginBottom: 6, letterSpacing: 1 }}>
            {state.phase === "throwing" || state.phase === "settling"
              ? "⏳ Шагайнууд нисэж байна..."
              : state.phase === "result"
              ? (isWin ? "🎊 ДӨРВӨН БЭРХ ГАРЛАА!" : "Дахин оролдоорой")
              : "4 шагайг нэгэн зэрэг шид"}
          </div>
          <CurrentResult sides={settledSides} />
        </div>

        {/* Дөрвөн бэрхийн тайлбар */}
        {state.phase === "result" && isWin && (
          <div style={{
            background: "rgba(200,160,48,0.15)",
            border: "1px solid rgba(200,160,48,0.5)",
            borderRadius: 10,
            padding: "10px 12px",
            marginBottom: 10,
            textAlign: "center",
            animation: "glow 1.5s ease-in-out infinite alternate",
          }}>
            <div style={{ fontSize: 32, marginBottom: 4 }}>🏆</div>
            <div style={{ color: "#f0c040", fontSize: 15, fontWeight: "bold", letterSpacing: 2 }}>
              ДӨРВӨН БЭРХ!
            </div>
            <div style={{ color: "#c8a030", fontSize: 11, marginTop: 4 }}>
              Морь + Тэмээ + Хонь + Ямаа
            </div>
            {state.streak > 1 && (
              <div style={{ color: "#f0c040", fontSize: 12, marginTop: 4 }}>
                🔥 {state.streak} дараалсан!
              </div>
            )}
          </div>
        )}

        <GoldDivider />

        {/* Шидэх товч */}
        <button
          onClick={onThrow}
          disabled={!canThrow}
          style={{
            width: "100%",
            padding: "13px 0",
            fontSize: 15,
            fontWeight: "bold",
            letterSpacing: 2,
            fontFamily: "'Noto Serif', Georgia, serif",
            background: canThrow
              ? "linear-gradient(135deg, #c8a030, #f0c040 50%, #c8a030)"
              : "rgba(60,50,20,0.5)",
            color: canThrow ? "#1a0e00" : "#555",
            border: "none",
            borderRadius: 10,
            cursor: canThrow ? "pointer" : "not-allowed",
            transition: "all 0.2s",
            boxShadow: canThrow ? "0 4px 20px rgba(200,160,48,0.4)" : "none",
          }}
          onMouseEnter={e => { if (canThrow) (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.02)" }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)" }}
        >
          {state.phase === "throwing" || state.phase === "settling"
            ? "🎲 Нисэж байна..."
            : "🦴 4 Шагай шидэх"}
        </button>

        <div style={{ color: "#444", fontSize: 10, textAlign: "center", marginTop: 6 }}>
          Шагай дээр дарж ч шидэж болно
        </div>
      </div>

      {/* ── Баруун самбар: статистик + түүх ── */}
      <div style={{ ...panel, top: 20, right: 20, width: 220 }}>

        {/* Статистик */}
        <div style={{ color: "#c8a030", fontSize: 11, letterSpacing: 3, marginBottom: 8 }}>
          СТАТИСТИК
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
          {[
            { label: "Нийт шидэлт", value: state.totalThrows,    color: "#aaa"    },
            { label: "Дөрвөн бэрх", value: state.wins,           color: "#f0c040" },
            { label: "Азын хувь",   value: `${winRate}%`,        color: "#90d890" },
            { label: "Дараалсан",   value: `${state.streak}🔥`,  color: "#e0a050" },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 8,
                padding: "8px 10px",
                textAlign: "center",
              }}
            >
              <div style={{ color, fontSize: 18, fontWeight: "bold" }}>{value}</div>
              <div style={{ color: "#666", fontSize: 10, marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        {state.bestStreak > 0 && (
          <div style={{
            background: "rgba(200,160,48,0.08)",
            borderRadius: 8,
            padding: "6px 10px",
            textAlign: "center",
            marginBottom: 10,
            border: "1px solid rgba(200,160,48,0.15)",
          }}>
            <span style={{ color: "#888", fontSize: 11 }}>Хамгийн сайн дараалал: </span>
            <span style={{ color: "#c8a030", fontWeight: "bold" }}>{state.bestStreak}</span>
          </div>
        )}

        <GoldDivider />

        {/* Тал тус бүрийн тайлбар */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ color: "#666", fontSize: 10, letterSpacing: 2, marginBottom: 6 }}>
            ШАГАЙН ТАЛУУД
          </div>
          {(["horse","sheep","goat","camel"] as ShagaiSide[]).map(side => {
            const info = SHAGAI_INFO[side]
            const isSettled = settledSides.includes(side)
            return (
              <div
                key={side}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "4px 6px",
                  borderRadius: 6,
                  marginBottom: 3,
                  background: isSettled ? `rgba(${hexToRgb(info.color)},0.12)` : "transparent",
                  border: isSettled ? `1px solid ${info.color}44` : "1px solid transparent",
                  transition: "all 0.3s",
                }}
              >
                <span style={{ fontSize: 16 }}>{info.symbol}</span>
                <span style={{ color: isSettled ? info.color : "#666", fontSize: 12, flex: 1 }}>
                  {info.name}
                </span>
                {isSettled && (
                  <span style={{ color: info.color, fontSize: 14 }}>✓</span>
                )}
              </div>
            )
          })}
        </div>

        <GoldDivider />

        {/* Сүүлийн шидэлтүүд */}
        <div style={{ color: "#666", fontSize: 10, letterSpacing: 2, marginBottom: 6 }}>
          СҮҮЛИЙН ШИДЭЛТҮҮД
        </div>
        <HistoryList history={state.history} />

        {state.totalThrows > 0 && (
          <button
            onClick={onReset}
            style={{
              width: "100%",
              marginTop: 10,
              padding: "7px 0",
              fontSize: 11,
              letterSpacing: 1,
              background: "rgba(255,255,255,0.04)",
              color: "#666",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 8,
              cursor: "pointer",
              fontFamily: "'Noto Serif', Georgia, serif",
              transition: "all 0.2s",
            }}
            onMouseEnter={e => {
              const b = e.currentTarget as HTMLButtonElement
              b.style.color = "#c8a030"
              b.style.borderColor = "rgba(200,160,48,0.3)"
            }}
            onMouseLeave={e => {
              const b = e.currentTarget as HTMLButtonElement
              b.style.color = "#666"
              b.style.borderColor = "rgba(255,255,255,0.08)"
            }}
          >
            Шинээр эхлэх
          </button>
        )}
      </div>

      <style>{`
        @keyframes glow {
          from { box-shadow: 0 0 10px rgba(200,160,48,0.3); }
          to   { box-shadow: 0 0 30px rgba(200,160,48,0.7); }
        }
      `}</style>
    </>
  )
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1,3), 16)
  const g = parseInt(hex.slice(3,5), 16)
  const b = parseInt(hex.slice(5,7), 16)
  return `${r},${g},${b}`
}