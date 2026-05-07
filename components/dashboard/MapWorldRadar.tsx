"use client";

import { cn } from "@/lib/utils";

/** PUBG-тай ойролцох: газрын дэвсэр дээр тусдаа float радар (жижиг зураг) */
export function MapWorldRadar({
  className,
  heroPoint,
  stationPoints,
  peerPoints,
  nearbyStationId,
}: {
  className?: string;
  heroPoint?: { x: number; y: number } | null;
  stationPoints?: Record<string, { x: number; y: number }>;
  peerPoints?: { x: number; y: number }[];
  nearbyStationId?: string | null;
}) {
  const hp = heroPoint ?? { x: 0.5, y: 0.5 };
  const left = `${Math.round(hp.x * 100)}%`;
  const top = `${Math.round(hp.y * 100)}%`;
  const entries = Object.entries(stationPoints ?? {});
  return (
    <div
      className={cn(
        "pointer-events-none select-none drop-shadow-[0_6px_20px_rgba(0,0,0,0.45)]",
        className,
      )}
      aria-hidden
    >
      <div className="map-radar-frame relative h-[5.75rem] w-[5.75rem] overflow-hidden rounded-lg border-2 border-[color:var(--map-ui-border-bright)] sm:h-[6.75rem] sm:w-[6.75rem]">
        <div className="map-radar-inner absolute inset-0" />
        <div className="pointer-events-none absolute inset-[6%] rounded-md border border-dotted border-white/25" />
        <div className="pointer-events-none absolute left-1/2 top-[8%] -translate-x-1/2 text-[8px] font-bold uppercase tracking-[0.2em] text-white/70">
          N
        </div>
        <div className="absolute left-1/2 top-1/2 h-3 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/90 shadow-[0_0_6px_rgba(255,255,255,0.6)]" />
        <div className="absolute left-1/2 top-1/2 h-0.5 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/90 shadow-[0_0_6px_rgba(255,255,255,0.6)]" />
        <div className="absolute left-[18%] top-[30%] h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.75)]" />
        <div className="absolute right-[20%] top-[32%] h-1.5 w-1.5 rounded-full bg-rose-500/90" />
        <div className="absolute bottom-[28%] left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-amber-300/90" />
        <div className="absolute bottom-[22%] right-[24%] h-1.5 w-1.5 rounded-full bg-amber-600/85" />
        {entries.map(([id, pt]) => {
          const isHome = id === "home";
          const isNearby = nearbyStationId != null && nearbyStationId === id;
          return (
            <div
              key={`st-${id}`}
              className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full ${
                isHome
                  ? "h-3 w-3 border border-emerald-100/90 bg-emerald-400 shadow-[0_0_10px_rgba(74,222,128,0.9)]"
                  : isNearby
                    ? "h-2.5 w-2.5 border border-amber-100/80 bg-amber-400 shadow-[0_0_9px_rgba(251,191,36,0.85)]"
                    : "h-2 w-2 bg-white/80"
              }`}
              style={{
                left: `${Math.round(pt.x * 100)}%`,
                top: `${Math.round(pt.y * 100)}%`,
              }}
            />
          );
        })}
        {(peerPoints ?? []).map((pt, idx) => (
          <div
            key={`peer-${idx}`}
            className="absolute h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-fuchsia-300/90 shadow-[0_0_8px_rgba(232,121,249,0.75)]"
            style={{
              left: `${Math.round(pt.x * 100)}%`,
              top: `${Math.round(pt.y * 100)}%`,
            }}
          />
        ))}
        <div
          className="absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-200/80 bg-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.8)]"
          style={{ left, top }}
        />
      </div>
    </div>
  );
}
