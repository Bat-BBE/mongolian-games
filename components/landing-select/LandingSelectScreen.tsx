"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import {
  listStationMarkers,
  normToWorld,
  clampToPickableArea,
  worldToNorm,
  isLandingSpotValid,
  type WorldPoint,
} from "./landingSpotGeometry";

const STATION_MARKERS = listStationMarkers();

/**
 * Pre-game "choose your landing spot" screen — shown once per `/home` session,
 * before `MapArea` mounts (see `GameDashboard.tsx`). Produces a world (x, z)
 * point that `useThreeScene`'s `spawnOverride` option spawns the hero at; the
 * player's permanent home ger stays at its existing hash-anchored position,
 * unaffected by this choice.
 */
export function LandingSelectScreen({
  onConfirm,
}: {
  onConfirm: (point: WorldPoint) => void;
}) {
  const [pending, setPending] = useState<{ world: WorldPoint; valid: boolean } | null>(null);

  const pick = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const u = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const v = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    const world = clampToPickableArea(normToWorld({ u, v }));
    setPending({ world, valid: isLandingSpotValid(world) });
  };

  const pendingNorm = pending ? worldToNorm(pending.world) : null;

  return (
    <div style={rootStyle}>
      <div className="glass-card" style={panelStyle}>
        <p className="text-gold" style={eyebrowStyle}>
          ⚡ Бургэдийн нүднээс ⚡
        </p>
        <h1 style={titleStyle}>Буух цэгээ сонго</h1>
        <p style={subtitleStyle}>
          Газрын зураг дээр товшиж буух цэгээ тэмдэглээд, "Буух!" дарна уу. Энэ бол зөвхөн энэ удаагийн
          эхлэх байрлал — таны байнгын гэр хуучин газраа хэвээр үлдэнэ.
        </p>

        <div style={mapWrapStyle} onPointerDown={pick}>
          <div style={mapFrameStyle}>
            {STATION_MARKERS.map((m) => (
              <div
                key={m.id}
                style={{
                  ...stationDotStyle,
                  left: `${m.norm.u * 100}%`,
                  top: `${m.norm.v * 100}%`,
                }}
                title={m.id}
              >
                {m.icon}
              </div>
            ))}
            {pendingNorm && (
              <div
                style={{
                  ...pendingMarkerStyle,
                  left: `${pendingNorm.u * 100}%`,
                  top: `${pendingNorm.v * 100}%`,
                  borderColor: pending?.valid ? "#f3c23c" : "#e05a5a",
                  boxShadow: `0 0 14px ${pending?.valid ? "rgba(243,194,60,0.8)" : "rgba(224,90,90,0.8)"}`,
                }}
              />
            )}
          </div>
        </div>

        {pending && !pending.valid && (
          <p style={warnStyle}>Өртөөнд хэт ойр байна — өөр цэг сонгоно уу.</p>
        )}

        <button
          className="btn-gold"
          style={
            !pending || !pending.valid
              ? { ...confirmBtnStyle, opacity: 0.45, cursor: "not-allowed" }
              : confirmBtnStyle
          }
          disabled={!pending || !pending.valid}
          onClick={() => pending && pending.valid && onConfirm(pending.world)}
        >
          ⚔ Буух! ⚔
        </button>
      </div>
    </div>
  );
}

const rootStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 500,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 16,
  background:
    "radial-gradient(ellipse at center, rgba(20,16,4,0.88) 0%, rgba(4,3,1,0.97) 100%)",
};

const panelStyle: CSSProperties = {
  width: "100%",
  maxWidth: 560,
  borderRadius: 24,
  padding: "28px 28px 24px",
  textAlign: "center",
};

const eyebrowStyle: CSSProperties = {
  fontSize: "0.7rem",
  letterSpacing: "0.3em",
  textTransform: "uppercase",
  fontWeight: 700,
  marginBottom: 6,
};

const titleStyle: CSSProperties = {
  fontSize: "1.5rem",
  fontWeight: 800,
  color: "var(--foreground)",
  marginBottom: 10,
};

const subtitleStyle: CSSProperties = {
  fontSize: "0.85rem",
  lineHeight: 1.5,
  color: "var(--muted-foreground)",
  marginBottom: 18,
};

const mapWrapStyle: CSSProperties = {
  width: "100%",
  aspectRatio: "12 / 10",
  cursor: "crosshair",
  marginBottom: 14,
};

const mapFrameStyle: CSSProperties = {
  position: "relative",
  width: "100%",
  height: "100%",
  borderRadius: 16,
  overflow: "hidden",
  background:
    "radial-gradient(ellipse at 50% 45%, #3a4a28 0%, #2b3a1f 55%, #1c2614 100%)",
  border: "1px solid color-mix(in oklch, var(--primary) 35%, transparent)",
};

const stationDotStyle: CSSProperties = {
  position: "absolute",
  transform: "translate(-50%, -50%)",
  fontSize: "0.85rem",
  filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.6))",
  pointerEvents: "none",
};

const pendingMarkerStyle: CSSProperties = {
  position: "absolute",
  width: 18,
  height: 18,
  borderRadius: "50%",
  border: "2px solid #f3c23c",
  transform: "translate(-50%, -50%)",
  background: "rgba(243,194,60,0.25)",
  pointerEvents: "none",
};

const warnStyle: CSSProperties = {
  color: "#f29a9a",
  fontSize: "0.78rem",
  marginBottom: 10,
};

const confirmBtnStyle: CSSProperties = {
  width: "100%",
  minHeight: 46,
  borderRadius: 14,
  fontSize: "0.95rem",
};
