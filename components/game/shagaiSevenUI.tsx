"use client";

import { useMemo } from "react";
import type { ShagaiSide } from "./shagaiTargetType";
import { SHAGAI_INFO } from "./shagaiTargetType";
import type { SevenPhase } from "./shagaiSevenType";
import { SEVEN_COUNT, SEVEN_PATH_MIN_POINTS } from "./shagaiSevenType";
import { playButtonClick } from "@/lib/uiSounds";
import { GamePanelResultCard } from "./GamePanelResultCard";
import { GAME_UI_FONT_FAMILY } from "./gameUiTheme";

/** Зөвхөн монгол (document.lang-аас хамаардаггүй — SSR/клиент ижил). */
const T = {
  title: "Дуугүй долоо",
  throwBtn: "Шагай орхих",
  reset: "Дахин эхлэх",
  picking: "Ижил талтай хосуудыг дараалан сонгоно уу.",
  pickHint:
    "Нэг дээр дараад ижил талтай (жишээ нь хоёр морь 🐎🐎) нөгөөгөө сонгоно — дараа нь замаа зурж «Няслах».",
  paired: "Нясалсан хосууд",
  wonTitle: "ХОЖЛОО!",
  won: "Бүх хосыг зөв сонгож дуусгалаа — та яллав.",
  lostTitle: "ХОЖИГДЛОО",
  lostWrong: "Өөр талтай хос сонгосон тул тоглоом дууслаа.",
  lostStuck: "Цааш ижил талтай хос байхгүй боллоо.",
  idleHint:
    "Долоон шагай орхиод, буусан тал бүрт ижил хосуудыг сонгон «Нясална».",
  winding: "Гарт халхалж байна — удахгүй шиднэ…",
  settling: "Шагайнууд бууж байна…",
  orphanWin: "Нэг шагай үлд — шууд хожлоо!",
  drawHint:
    "Эхний шагай сонгогдлоо: ногоон дээр дарж чирээд зам зурна уу (бусад шагайг онож болохгүй), дараа нь хосыг дарна.",
  pathClear: "Зам арилгах",
  pathPoints: "Замын цэг",
  badPath:
    "Зам тохирохгүй байна — эхлэл/төгсгөл зөв шагай дээр очих, зам дээр бусад шагайд хүрэхгүй байх ёстой.",
  positionsWait:
    "Шагайн байрлал бүрэн ачаалагдаагүй байна — түр хүлээгээд дахин оролдоно уу.",
  nysrekh: "Няслах",
  nysrekhHint:
    "Сонгосон шагай замаар хос руу очиж мөргөнө. Зам зөв эсэхийг энд дарж баталгаажуулна.",
  takePickHint:
    "Хос нясаллаа. Аль нэгийг нь аваад нөгөө нь талбарт үлдэнэ — дараа нь дахин хос олно.",
  takeThis: "Энийг авах",
  knockSettling:
    "Мөргөлдөөний дараа шагайнууд дахин бууж байна — түр хүлээнэ үү.",
  collecting: "Сонгосон шагайг аваад байна…",
  collected: "Авсан талууд",
  knocking: "Хос нясаллаа…",
} as const;

export type ShagaiSevenUIProps = {
  phase: SevenPhase;
  settledSides: (ShagaiSide | null)[];
  activeIds: number[];
  pairedPairs: [number, number][];
  selection: [number | null, number | null];
  loseReason: "wrong" | "stuck" | null;
  onThrow: () => void;
  onReset: () => void;
  onPickIndex: (index: number) => void;
  pathPointCount: number;
  onClearPath: () => void;
  pairFeedbackKey: "bad_path" | "positions" | null;
  onNysrekh: () => void;
  pairAnimating: boolean;
  takePick: { a: number; b: number } | null;
  onTakeFromPair: (index: number) => void;
  collectedSides: ShagaiSide[];
  collectAnimating: boolean;
};

export default function ShagaiSevenUI({
  phase,
  settledSides,
  activeIds,
  pairedPairs,
  selection,
  loseReason,
  onThrow,
  onReset,
  onPickIndex,
  pathPointCount,
  onClearPath,
  pairFeedbackKey,
  onNysrekh,
  pairAnimating,
  takePick,
  onTakeFromPair,
  collectedSides,
  collectAnimating,
}: ShagaiSevenUIProps) {
  const t = T;
  const allSettled = useMemo(
    () => settledSides.every((s) => s !== null),
    [settledSides],
  );

  const canThrow = phase === "idle" || phase === "won" || phase === "lost";

  return (
    <div
      className="seven-shagai-panel"
      lang="mn"
      style={{
        position: "absolute",
        left: "auto",
        right: 12,
        top: 16,
        bottom: 12,
        width: "min(340px, calc(100vw - 24px))",
        maxWidth: "100%",
        margin: 0,
        padding: "14px 14px",
        borderRadius: 14,
        background:
          "linear-gradient(145deg, rgba(24,18,12,0.94), rgba(12,10,8,0.97))",
        border: "1px solid rgba(200,160,48,0.28)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.45)",
        color: "#e8e0d4",
        fontFamily: GAME_UI_FONT_FAMILY,
        fontSize: 13,
        lineHeight: 1.45,
        zIndex: 10,
        pointerEvents: "auto",
        overflowY: "auto",
        WebkitOverflowScrolling: "touch",
        boxSizing: "border-box",
      }}
    >
      <div
        className="mb-2 truncate text-center font-semibold uppercase tracking-[0.1em] text-amber-400/95"
        style={{
          fontSize: "clamp(0.78rem, 2.4vw, 0.88rem)",
          fontFamily: GAME_UI_FONT_FAMILY,
        }}
      >
        {t.title}
      </div>

      {phase === "won" && (
        <GamePanelResultCard
          variant="win"
          title={t.wonTitle}
          subtitle={t.won}
          className="mb-4"
        />
      )}
      {phase === "lost" && (
        <GamePanelResultCard
          variant="lose"
          title={t.lostTitle}
          subtitle={loseReason === "stuck" ? t.lostStuck : t.lostWrong}
          className="mb-4"
        />
      )}

      {phase === "picking" && allSettled && (
        <>
          <div style={{ marginBottom: 6 }}>{t.picking}</div>
          <div style={{ fontSize: 12, color: "#a09888", marginBottom: 10 }}>
            {t.pickHint}
            {activeIds.length === 1 && (
              <span style={{ color: "#f0c040" }}> {t.orphanWin}</span>
            )}
          </div>
          {selection[0] !== null && selection[1] === null && (
            <div
              style={{
                fontSize: 12,
                color: "#c8a880",
                marginBottom: 10,
                padding: "8px 10px",
                borderRadius: 8,
                background: "rgba(200,160,48,0.08)",
                border: "1px solid rgba(200,160,48,0.2)",
              }}
            >
              <div style={{ marginBottom: 6 }}>{t.drawHint}</div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <span style={{ fontSize: 11, color: "#908878" }}>
                  {t.pathPoints}: <strong>{pathPointCount}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    playButtonClick();
                    onClearPath();
                  }}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 8,
                    border: "1px solid rgba(200,160,48,0.35)",
                    background: "rgba(40,32,24,0.9)",
                    color: "#f0c040",
                    cursor: "pointer",
                    fontSize: 12,
                  }}
                >
                  {t.pathClear}
                </button>
              </div>
            </div>
          )}
          {pairFeedbackKey && (
            <div
              style={{
                color: "#e89870",
                fontSize: 13,
                marginBottom: 10,
                padding: "8px 10px",
                borderRadius: 8,
                background: "rgba(200,80,40,0.12)",
                border: "1px solid rgba(200,100,60,0.35)",
              }}
            >
              {pairFeedbackKey === "positions" ? t.positionsWait : t.badPath}
            </div>
          )}
          {selection[0] !== null && selection[1] !== null && !pairAnimating && (
            <div
              style={{
                marginBottom: 12,
                padding: "10px 12px",
                borderRadius: 10,
                background: "rgba(80,140,90,0.12)",
                border: "1px solid rgba(120,180,130,0.35)",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  color: "#a8c8a8",
                  marginBottom: 10,
                  lineHeight: 1.4,
                }}
              >
                {t.nysrekhHint}
              </div>
              <button
                type="button"
                onClick={() => {
                  playButtonClick();
                  onNysrekh();
                }}
                disabled={
                  pairAnimating || pathPointCount < SEVEN_PATH_MIN_POINTS
                }
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: 10,
                  border: "none",
                  background:
                    pairAnimating || pathPointCount < SEVEN_PATH_MIN_POINTS
                      ? "#444"
                      : "linear-gradient(180deg, #6ab86a, #3d7a44)",
                  color: "#0f140f",
                  fontWeight: 700,
                  fontSize: 15,
                  cursor:
                    pairAnimating || pathPointCount < SEVEN_PATH_MIN_POINTS
                      ? "not-allowed"
                      : "pointer",
                  opacity:
                    pairAnimating || pathPointCount < SEVEN_PATH_MIN_POINTS
                      ? 0.55
                      : 1,
                }}
              >
                {t.nysrekh}
              </button>
            </div>
          )}
          {pairAnimating && (
            <div
              style={{
                fontSize: 13,
                color: "#c8c030",
                marginBottom: 10,
                textAlign: "center",
              }}
            >
              {t.knocking}
            </div>
          )}
        </>
      )}

      {phase === "idle" && (
        <div style={{ fontSize: 13, color: "#a09888", marginBottom: 10 }}>
          {t.idleHint}
        </div>
      )}

      {phase === "winding_up" && (
        <div
          style={{
            fontSize: 13,
            color: "#d4c4a0",
            marginBottom: 10,
            padding: "10px 12px",
            borderRadius: 10,
            background: "rgba(200,160,48,0.1)",
            border: "1px solid rgba(200,160,48,0.25)",
          }}
        >
          {t.winding}
        </div>
      )}

      {(phase === "throwing" || phase === "settling") && (
        <div style={{ fontSize: 13, color: "#a09888", marginBottom: 10 }}>
          {t.settling}
        </div>
      )}

      {phase === "knock_settling" && (
        <div style={{ fontSize: 13, color: "#c8a880", marginBottom: 10 }}>
          {t.knockSettling}
        </div>
      )}

      {allSettled && phase === "take_pick" && takePick && (
        <div style={{ marginBottom: 12 }}>
          <div
            style={{
              fontSize: 13,
              color: "#d4c8a8",
              marginBottom: 12,
              lineHeight: 1.45,
            }}
          >
            {t.takePickHint}
          </div>
          {collectAnimating && (
            <div
              style={{
                fontSize: 13,
                color: "#c8c030",
                marginBottom: 10,
                textAlign: "center",
              }}
            >
              {t.collecting}
            </div>
          )}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {[takePick.a, takePick.b].map((idx) => {
              const side = settledSides[idx];
              const info = side ? SHAGAI_INFO[side] : null;
              return (
                <button
                  key={idx}
                  type="button"
                  disabled={collectAnimating}
                  onClick={() => {
                    playButtonClick();
                    onTakeFromPair(idx);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: "2px solid rgba(200,160,48,0.45)",
                    background: "rgba(200,160,48,0.12)",
                    color: "#f0ead8",
                    cursor: collectAnimating ? "not-allowed" : "pointer",
                    fontSize: 14,
                    opacity: collectAnimating ? 0.5 : 1,
                  }}
                >
                  <span style={{ fontSize: 11, color: "#a09888" }}>
                    #{idx + 1}
                  </span>
                  <span style={{ fontSize: 22 }}>{info?.symbol ?? "·"}</span>
                  <span style={{ fontWeight: 700, color: "#f0c040" }}>
                    {t.takeThis}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {allSettled && phase === "picking" && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            marginBottom: 10,
          }}
        >
          {Array.from({ length: SEVEN_COUNT }, (_, i) => {
            const side = settledSides[i];
            const active = activeIds.includes(i);
            const sel = selection[0] === i || selection[1] === i;
            const info = side ? SHAGAI_INFO[side] : null;
            return (
              <button
                key={i}
                type="button"
                disabled={!active || pairAnimating}
                onClick={() => {
                  playButtonClick();
                  onPickIndex(i);
                }}
                style={{
                  minWidth: 52,
                  padding: "8px 10px",
                  borderRadius: 10,
                  border: sel
                    ? "2px solid #f0c040"
                    : "1px solid rgba(200,160,48,0.35)",
                  background: active
                    ? sel
                      ? "rgba(200,160,48,0.2)"
                      : "rgba(40,32,24,0.9)"
                    : "rgba(24,20,16,0.5)",
                  color: active ? "#f0ead8" : "#555",
                  cursor: active ? "pointer" : "default",
                  opacity: active ? 1 : 0.45,
                  fontSize: 13,
                }}
              >
                <div style={{ fontSize: 11, color: "#888" }}>#{i + 1}</div>
                <div style={{ fontSize: 18 }}>{info?.symbol ?? "·"}</div>
              </button>
            );
          })}
        </div>
      )}

      {pairedPairs.length > 0 && (
        <div style={{ fontSize: 12, color: "#8a8278", marginBottom: 8 }}>
          {t.paired}:{" "}
          {pairedPairs
            .map(([a, b]) => {
              const sa = settledSides[a];
              const sym = sa ? SHAGAI_INFO[sa].symbol : "·";
              return `${sym}#${a + 1}–#${b + 1}`;
            })
            .join(", ")}
        </div>
      )}

      {collectedSides.length > 0 && (
        <div style={{ fontSize: 12, color: "#7a7868", marginBottom: 8 }}>
          {t.collected}:{" "}
          {collectedSides.map((s, i) => (
            <span key={`${s}-${i}`} style={{ marginRight: 6 }}>
              {SHAGAI_INFO[s].symbol}
            </span>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button
          type="button"
          disabled={!canThrow}
          onClick={() => {
            playButtonClick();
            onThrow();
          }}
          style={{
            padding: "10px 18px",
            borderRadius: 10,
            border: "none",
            background: canThrow
              ? "linear-gradient(180deg, #c8a030, #8a6820)"
              : "#444",
            color: "#1a1208",
            fontWeight: 600,
            cursor: canThrow ? "pointer" : "not-allowed",
            opacity: canThrow ? 1 : 0.5,
          }}
        >
          {t.throwBtn}
        </button>
        <button
          type="button"
          onClick={() => {
            playButtonClick();
            onReset();
          }}
          style={{
            padding: "10px 18px",
            borderRadius: 10,
            border: "1px solid rgba(200,160,48,0.35)",
            background: "transparent",
            color: "#c8a030",
            cursor: "pointer",
          }}
        >
          {t.reset}
        </button>
      </div>
    </div>
  );
}
