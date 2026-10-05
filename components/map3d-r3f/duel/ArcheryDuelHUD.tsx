"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { seededTarget, type useArcheryDuel } from "./useArcheryDuel";
import type { DuelDrawState } from "./duelDrawState";
import {
  GAME_PANEL_CHROME_GLASS,
  GAME_CTA_PRIMARY,
  GAME_CTA_SECONDARY,
  GAME_PANEL_HEADING_CLASS,
  GAME_TEXT_LEAD,
  GAME_CALLOUT_EMERALD_COMPACT,
  GAME_CALLOUT_ERROR,
} from "@/components/game/gameUiTheme";

const CHARGE_MS = 1100;
/** Visual width of the "sweet spot" band shown on both bars — the same
 * window shotAccuracy() rewards, just surfaced so aiming feels skill-based
 * rather than a blind guess. */
const SWEET = 0.14;

/** 2D overlay for the aiming + resolved phases. Draw-aim-release: hold the
 * button to charge power, drag the bar above it to set angle, release to
 * fire. Writes live power/angle into `myDrawRef` every frame while charging
 * so ArcheryDuelScene can animate the bow string without re-rendering React. */
export function ArcheryDuelHUD({
  duel,
  myDrawRef,
}: {
  duel: ReturnType<typeof useArcheryDuel>;
  myDrawRef: React.RefObject<DuelDrawState>;
}) {
  const { phase, matchSeed, myShot, result, iWon, opponentName } = duel;
  const [angle, setAngle] = useState(0);
  const [power, setPower] = useState(0);
  const chargingRef = useRef(false);
  const chargeStartRef = useRef(0);
  const angleRef = useRef(0);
  angleRef.current = angle;

  const target = matchSeed != null ? seededTarget(matchSeed) : null;

  useEffect(() => {
    if (phase !== "aiming") {
      chargingRef.current = false;
      setPower(0);
      return;
    }
    let raf = 0;
    const tick = () => {
      if (chargingRef.current) {
        const t = Math.min(1, (performance.now() - chargeStartRef.current) / CHARGE_MS);
        setPower(t);
        const draw = myDrawRef.current;
        if (draw) {
          draw.power = t;
          draw.angle = angleRef.current;
          draw.charging = true;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, myDrawRef]);

  if (phase !== "aiming" && phase !== "resolved") return null;

  if (phase === "resolved" && result) {
    return (
      <div style={bottomPanelPos}>
        <div
          style={{
            ...GAME_PANEL_CHROME_GLASS,
            padding: "14px 20px",
            textAlign: "center",
            minWidth: 240,
          }}
        >
          <div className={GAME_PANEL_HEADING_CLASS}>
            {iWon ? `Та ${opponentName}-г ялав!` : `${opponentName} таныг ялав`}
          </div>
          <div
            className={iWon ? GAME_CALLOUT_EMERALD_COMPACT : GAME_CALLOUT_ERROR}
            style={{ marginTop: 8 }}
          >
            Таны нарийвчлал: {(result.myAccuracy * 100).toFixed(0)}% / Өрсөлдөгч:{" "}
            {(result.opponentAccuracy * 100).toFixed(0)}%
          </div>
          <button className={GAME_CTA_SECONDARY} style={{ marginTop: 10 }} onClick={() => duel.cancel()}>
            Хаах
          </button>
        </div>
      </div>
    );
  }

  const startCharge = () => {
    if (myShot) return;
    chargingRef.current = true;
    chargeStartRef.current = performance.now();
  };
  const releaseCharge = () => {
    if (!chargingRef.current || myShot) return;
    chargingRef.current = false;
    const draw = myDrawRef.current;
    if (draw) draw.charging = false;
    duel.fireShot(power, angle);
  };

  const onAngleDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (myShot) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const next = pct * 2 - 1;
    setAngle(next);
    const draw = myDrawRef.current;
    if (draw) draw.angle = next;
  };

  return (
    <div style={bottomPanelPos}>
      <div style={{ ...GAME_PANEL_CHROME_GLASS, padding: "14px 18px", width: 280 }}>
        <div className={GAME_TEXT_LEAD} style={{ marginBottom: 8, textAlign: "center" }}>
          {myShot ? `${opponentName}-ийг хүлээж байна...` : "Чиглэл тохируулж, татаад буулга"}
        </div>

        <div
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            onAngleDrag(e);
          }}
          onPointerMove={(e) => {
            if (e.buttons === 1) onAngleDrag(e);
          }}
          style={{
            position: "relative",
            height: 26,
            borderRadius: 8,
            background: "rgba(255,255,255,0.08)",
            marginBottom: 12,
            cursor: myShot ? "default" : "pointer",
            overflow: "hidden",
          }}
        >
          {target && (
            <div
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: `${((target.angle - SWEET + 1) / 2) * 100}%`,
                width: `${SWEET * 100}%`,
                background: "rgba(243,194,60,0.35)",
              }}
            />
          )}
          <div
            style={{
              position: "absolute",
              top: -2,
              bottom: -2,
              width: 4,
              borderRadius: 2,
              background: "#f3c23c",
              left: `calc(${((angle + 1) / 2) * 100}% - 2px)`,
            }}
          />
        </div>

        <div
          style={{
            position: "relative",
            height: 14,
            borderRadius: 7,
            background: "rgba(255,255,255,0.08)",
            marginBottom: 12,
            overflow: "hidden",
          }}
        >
          {target && (
            <div
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: `${Math.max(0, target.power - SWEET) * 100}%`,
                width: `${SWEET * 2 * 100}%`,
                background: "rgba(243,194,60,0.35)",
              }}
            />
          )}
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: 0,
              width: `${power * 100}%`,
              background: "#c8a030",
            }}
          />
        </div>

        <button
          className={GAME_CTA_PRIMARY}
          disabled={!!myShot}
          onPointerDown={startCharge}
          onPointerUp={releaseCharge}
          onPointerLeave={() => {
            if (chargingRef.current) releaseCharge();
          }}
        >
          {myShot ? "Буудлаа" : "Барь, Тат, Суллаа"}
        </button>
      </div>
    </div>
  );
}

const bottomPanelPos: CSSProperties = {
  position: "fixed",
  bottom: 24,
  left: "50%",
  transform: "translateX(-50%)",
  zIndex: 950,
};
