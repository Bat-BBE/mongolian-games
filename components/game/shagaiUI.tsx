"use client";

import { ShagaiResult, SHAgAI_SIDES, ShagaiSide } from "./shagai";
import { useState, useEffect, type CSSProperties } from "react";
import { playButtonClick } from "@/lib/uiSounds";
import {
  gamePanelLeftDesktop,
  gamePanelPlayNarrowBottom,
  gamePanelRightDesktop,
} from "./gamePanelLayout";
import { useGameUiNarrow } from "./useGameUiNarrow";
import GameRulesSheet from "./GameRulesSheet";
import GameRulesFab from "./GameRulesFab";
import { useApp } from "@/components/AppContext";
import {
  GAME_CTA_PRIMARY,
  GAME_PANEL_CHROME,
  GAME_PANEL_OVERLINE_CLASS,
} from "./gameUiTheme";
import { cn } from "@/lib/utils";

const SIDE_SPRITE_X: Record<ShagaiSide, string> = {
  camel: "5%",
  horse: "34%",
  sheep: "64%",
  goat: "95%",
};

export function ShagaiSideImage({
  side,
  size = 80,
  highlight = false,
}: {
  side: ShagaiSide;
  size?: number;
  highlight?: boolean;
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        backgroundImage: "url('/images/shagai-sides.png')",
        backgroundSize: "440% 260%",
        backgroundPosition: `${SIDE_SPRITE_X[side]} 42%`,
        backgroundRepeat: "no-repeat",
        borderRadius: 12,
        border: highlight
          ? "2px solid rgba(240,192,64,0.9)"
          : "2px solid rgba(200,160,48,0.35)",
        boxShadow: highlight
          ? "0 0 22px rgba(240,192,64,0.45), inset 0 0 8px rgba(0,0,0,0.3)"
          : "0 4px 10px rgba(0,0,0,0.35)",
        transition: "all 0.35s ease",
      }}
    />
  );
}

function SidesLegend({ activeSide }: { activeSide: ShagaiSide | null }) {
  const items: ShagaiSide[] = ["horse", "sheep", "goat", "camel"];
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 6,
        marginTop: 8,
      }}
    >
      {items.map((s) => {
        const info = SHAgAI_SIDES[s];
        const active = activeSide === s;
        return (
          <div
            key={s}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
              opacity: activeSide ? (active ? 1 : 0.35) : 1,
              transition: "opacity 0.35s ease",
            }}
          >
            <ShagaiSideImage side={s} size={44} highlight={active} />
            <span
              style={{
                fontSize: 10,
                letterSpacing: 1,
                color: active ? "#f0c040" : "#aaa",
                fontFamily: "var(--font-inter), -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
              }}
            >
              {info.name}
            </span>
          </div>
        );
      })}
    </div>
  );
}

interface ShagaiUIProps {
  result: ShagaiResult | null;
  isRolling: boolean;
  throwCount: number;
  score: Record<ShagaiSide, number>;
  onThrow: () => void;
  onReset: () => void;
}

const SIDE_ORDER: ShagaiSide[] = ["horse", "sheep", "goat", "camel"];

function GoldDivider() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        margin: "10px 0",
      }}
    >
      <div
        style={{
          flex: 1,
          height: 1,
          background: "linear-gradient(to right, transparent, #c8a030)",
        }}
      />
      <span style={{ color: "#c8a030", fontSize: 10 }}>❖</span>
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

function ScoreRow({
  side,
  count,
  total,
  isActive,
}: {
  side: ShagaiSide;
  count: number;
  total: number;
  isActive: boolean;
}) {
  const info = SHAgAI_SIDES[side];
  const pct = total > 0 ? (count / total) * 100 : 0;
  const sideColor =
    side === "horse"
      ? "#f0c040"
      : side === "sheep"
        ? "#90d890"
        : side === "goat"
          ? "#c8956a"
          : "#e0a050";

  return (
    <div style={{ marginBottom: 10 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 3,
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontSize: 13,
            color: isActive ? sideColor : "#bbb",
            transition: "color .3s",
            display: "flex",
            alignItems: "center",
            gap: 5,
          }}
        >
          <span style={{ fontSize: 16 }}>{info.symbol}</span>
          <span
            style={{
              fontFamily: "var(--font-inter), -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
              letterSpacing: 1,
            }}
          >
            {info.name}
          </span>
        </span>
        <span
          style={{
            color: sideColor,
            fontWeight: "bold",
            fontSize: 15,
            minWidth: 22,
            textAlign: "right",
          }}
        >
          {count}
        </span>
      </div>
      <div
        style={{
          height: 4,
          background: "rgba(255,255,255,0.07)",
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: sideColor,
            borderRadius: 3,
            transition: "width .6s ease",
            boxShadow: isActive ? `0 0 8px ${sideColor}88` : "none",
          }}
        />
      </div>
    </div>
  );
}

function ResultDisplay({
  result,
  isRolling,
}: {
  result: ShagaiResult | null;
  isRolling: boolean;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (result && !isRolling) {
      setVisible(false);
      const t = setTimeout(() => setVisible(true), 50);
      return () => clearTimeout(t);
    } else {
      setVisible(false);
    }
  }, [result, isRolling]);

  if (isRolling) {
    return (
      <div style={{ textAlign: "center", padding: "20px 0" }}>
        <div
          style={{
            fontSize: 42,
            lineHeight: 1,
            marginBottom: 8,
            animation: "bounce 0.4s infinite alternate",
          }}
        >
          💢
        </div>
        <div style={{ color: "#aaa", fontSize: 14, letterSpacing: 3 }}>
          Бууж байна...
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div style={{ textAlign: "center", padding: "20px 0", opacity: 0.5 }}>
        <div className="mb-1.5 text-[clamp(1.5rem,5vw,2rem)]">🦴</div>
        <div className="text-[0.75rem] tracking-wide text-zinc-500 sm:text-xs">
          Шагай шидэж эхэл
        </div>
      </div>
    );
  }

  const sideColor =
    result.side === "horse"
      ? "#f0c040"
      : result.side === "sheep"
        ? "#90d890"
        : result.side === "goat"
          ? "#c8956a"
          : "#e0a050";

  return (
    <div
      style={{
        textAlign: "center",
        padding: "16px 0",
        opacity: visible ? 1 : 0,
        transform: visible ? "scale(1)" : "scale(0.8)",
        transition: "all 0.35s cubic-bezier(0.34,1.56,0.64,1)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: 10,
          filter: `drop-shadow(0 0 18px ${sideColor}88)`,
        }}
      >
        <ShagaiSideImage side={result.side} size={92} highlight />
      </div>
      <div
        style={{
          color: sideColor,
          fontSize: "clamp(1rem, 4vw, 1.35rem)",
          fontWeight: "bold",
          fontFamily:
            "var(--font-inter), -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
          letterSpacing: "0.08em",
          textShadow: `0 0 20px ${sideColor}88`,
          marginBottom: 8,
        }}
      >
        {result.symbol} {result.name}
      </div>
      <GoldDivider />
      <div
        style={{
          color: "#c8a030",
          fontSize: 12,
          fontStyle: "italic",
          lineHeight: 1.6,
          padding: "0 8px",
        }}
      >
        ✨ {result.luck}
      </div>
      <div
        style={{
          color: "#555",
          fontSize: 11,
          marginTop: 8,
          lineHeight: 1.5,
          padding: "0 4px",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          paddingTop: 8,
        }}
      >
        "{result.description}"
      </div>
    </div>
  );
}

export default function ShagaiUI({
  result,
  isRolling,
  throwCount,
  score,
  onThrow,
  onReset,
}: ShagaiUIProps) {
  const { language } = useApp();
  const total = Object.values(score).reduce((a, b) => a + b, 0);
  const narrowUi = useGameUiNarrow();
  const [statsOpen, setStatsOpen] = useState(false);
  const statsFabLabel = language === "mn" ? "Мэдээлэл" : "Stats";
  const mainChrome = narrowUi
    ? gamePanelPlayNarrowBottom()
    : gamePanelLeftDesktop(270);
  const mainPad: CSSProperties = narrowUi
    ? { padding: "12px 12px 14px" }
    : {};

  return (
    <>
      <div
        style={{
          ...mainChrome,
          ...mainPad,
          ...GAME_PANEL_CHROME,
          padding: "18px 18px 14px",
          color: "white",
          zIndex: 10,
        }}
      >
        <div className="mb-1 text-center">
          <span className={cn(GAME_PANEL_OVERLINE_CLASS, "text-zinc-500")}>
            ШАГАЙ НААДАМ
          </span>
        </div>

        <GoldDivider />
        <ResultDisplay result={result} isRolling={isRolling} />
        <SidesLegend activeSide={result?.side ?? null} />
        <GoldDivider />

        <button
          type="button"
          onClick={() => {
            playButtonClick();
            onThrow();
          }}
          disabled={isRolling}
          className={GAME_CTA_PRIMARY}
        >
          {isRolling ? "🎲 Нисэж байна..." : "🦴 Шагай шидэх"}
        </button>

        <div
          style={{
            color: "#555",
            fontSize: 11,
            textAlign: "center",
            marginTop: 8,
          }}
        >
          Шагай дээр дарж ч шидэж болно
        </div>
      </div>

      {!narrowUi ? (
        <div
          style={{
            ...gamePanelRightDesktop(220),
            ...GAME_PANEL_CHROME,
            padding: "16px 16px 12px",
            color: "white",
            zIndex: 10,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 4,
            }}
          >
            <div className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-amber-500/90 sm:text-xs">
              СТАТИСТИК
            </div>
            <div
              style={{
                color: "#c8a030",
                fontSize: 12,
                background: "rgba(200,160,48,0.1)",
                borderRadius: 10,
                padding: "2px 10px",
              }}
            >
              {total} удаа
            </div>
          </div>

          <GoldDivider />

          {SIDE_ORDER.map((side) => (
            <ScoreRow
              key={side}
              side={side}
              count={score[side]}
              total={total}
              isActive={result?.side === side}
            />
          ))}

          {total > 0 && (
            <>
              <GoldDivider />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 12,
                }}
              >
                <span style={{ color: "#888" }}>Морийн хувь</span>
                <span style={{ color: "#f0c040", fontWeight: "bold" }}>
                  {total > 0 ? ((score.horse / total) * 100).toFixed(1) : "0.0"}%
                </span>
              </div>
            </>
          )}

          {total > 0 && (
            <button
              type="button"
              onClick={() => {
                playButtonClick();
                onReset();
              }}
              style={{
                width: "100%",
                marginTop: 12,
                padding: "8px 0",
                fontSize: 12,
                letterSpacing: 1,
                background: "rgba(255,255,255,0.05)",
                color: "#888",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
                cursor: "pointer",
                fontFamily:
                  "var(--font-inter), -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
              }}
            >
              Шинээр эхлэх
            </button>
          )}
        </div>
      ) : (
        <>
          <GameRulesFab
            onClick={() => {
              playButtonClick();
              setStatsOpen(true);
            }}
            label={statsFabLabel}
          />
          <GameRulesSheet
            open={statsOpen}
            onClose={() => setStatsOpen(false)}
            title={language === "mn" ? "Статистик" : "Statistics"}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 4,
              }}
            >
              <div style={{ color: "#c8a030", fontSize: 12, letterSpacing: 3 }}>
                {language === "mn" ? "Нийт шидэлт" : "Throws"}
              </div>
              <div
                style={{
                  color: "#c8a030",
                  fontSize: 12,
                  background: "rgba(200,160,48,0.1)",
                  borderRadius: 10,
                  padding: "2px 10px",
                }}
              >
                {total} {language === "mn" ? "удаа" : "total"}
              </div>
            </div>

            <GoldDivider />

            {SIDE_ORDER.map((side) => (
              <ScoreRow
                key={side}
                side={side}
                count={score[side]}
                total={total}
                isActive={result?.side === side}
              />
            ))}

            {total > 0 && (
              <>
                <GoldDivider />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 12,
                  }}
                >
                  <span style={{ color: "#888" }}>Морийн хувь</span>
                  <span style={{ color: "#f0c040", fontWeight: "bold" }}>
                    {total > 0 ? ((score.horse / total) * 100).toFixed(1) : "0.0"}%
                  </span>
                </div>
              </>
            )}

            {total > 0 && (
              <button
                type="button"
                onClick={() => {
                  playButtonClick();
                  onReset();
                  setStatsOpen(false);
                }}
                style={{
                  width: "100%",
                  marginTop: 12,
                  padding: "8px 0",
                  fontSize: 12,
                  letterSpacing: 1,
                  background: "rgba(255,255,255,0.05)",
                  color: "#888",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontFamily:
                    "var(--font-inter), -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
                }}
              >
                Шинээр эхлэх
              </button>
            )}
          </GameRulesSheet>
        </>
      )}

      <style>{`
        @keyframes bounce {
          from { transform: translateY(0); }
          to { transform: translateY(-8px); }
        }
      `}</style>
    </>
  );
}
