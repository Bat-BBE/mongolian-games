"use client";

import { LuX as X, LuStar as Star, LuGamepad2 as Gamepad2, LuBookOpen as BookOpen } from "react-icons/lu";
import { cn } from "@/lib/utils";
import type { UrtuuStation } from "./UrtuuNode";

interface StationPopupProps {
  station: UrtuuStation | null;
  onClose: () => void;
  onPlay: (gameSlug: string, gameName?: string) => void;
  loreLabel: string;
  minigameLabel: string;
  regionLabel: string;
  gamesSectionLabel: string;
  lockedHint: string;
  doneHint: string;
  /** Одоогийн өртөө эсэх — энд л тоглоом эхлүүлэх */
  canPlay?: boolean;
}

export function StationPopup({
  station,
  onClose,
  onPlay,
  loreLabel,
  minigameLabel,
  regionLabel,
  gamesSectionLabel,
  lockedHint,
  doneHint,
  canPlay = true,
}: StationPopupProps) {
  if (!station) return null;

  const list =
    station.games && station.games.length > 0
      ? station.games
      : [
          {
            slug: station.gameSlug ?? "",
            name: station.gameName,
            desc: station.gameDesc,
            reward: station.reward,
          },
        ];

  return (
    <>
      <div className="absolute inset-0 z-40" onClick={onClose} />
      <div
        className={cn(
          "absolute bottom-6 left-1/2 -translate-x-1/2 z-50 w-[min(520px,calc(100vw-1.5rem))] max-h-[min(70vh,560px)] overflow-y-auto",
          "glass rounded-3xl border border-primary/30 p-6",
          "animate-fade-up shadow-2xl",
        )}
        style={{
          boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(212,175,55,0.08)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-7 h-7 flex items-center justify-center rounded-full glass hover:bg-white/10 transition-all"
        >
          <X className="w-3.5 h-3.5 text-muted-foreground" />
        </button>

        <div className="flex gap-5 items-start">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0 border border-primary/20 text-4xl"
            style={{
              background: "color-mix(in oklch, var(--primary) 15%, transparent)",
            }}
          >
            {station.icon}
          </div>

          <div className="flex-1 min-w-0 pr-8">
            <h4 className="font-display text-xl text-foreground tracking-wide">
              {station.name}
            </h4>
            {station.region ? (
              <p className="text-[10px] uppercase tracking-[0.2em] text-primary/80 mt-1">
                {regionLabel}: {station.region}
              </p>
            ) : null}

            <div className="flex gap-4 mt-3 mb-2 text-[9px] text-muted-foreground font-bold uppercase tracking-widest">
              <span className="flex items-center gap-1">
                <Gamepad2 className="w-3 h-3 text-primary" />
                {minigameLabel}
              </span>
              <span className="flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                {loreLabel}
              </span>
            </div>

            <p className="text-[11px] font-display tracking-[0.12em] text-primary/90 mb-3">
              {gamesSectionLabel} ({list.length})
            </p>

            <ul className="space-y-3">
              {list.map((g) => (
                <li
                  key={`${station.id}-${g.slug || g.name}`}
                  className="rounded-2xl border border-white/10 bg-black/20 p-3"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-[11px] font-bold text-foreground">
                      {g.name}
                    </span>
                    <span className="flex items-center gap-0.5 text-[10px] font-bold text-primary shrink-0">
                      <Star className="w-3 h-3" />
                      {g.reward}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed mb-2">
                    {g.desc}
                  </p>
                  <button
                    type="button"
                    disabled={!canPlay || !g.slug}
                    onClick={() => canPlay && g.slug && onPlay(g.slug, g.name)}
                    className={cn(
                      "w-full px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                      canPlay && g.slug
                        ? "text-black hover:scale-[1.01]"
                        : "text-muted-foreground cursor-not-allowed opacity-60",
                    )}
                    style={
                      canPlay && g.slug
                        ? { background: "var(--gold-gradient)" }
                        : undefined
                    }
                  >
                    {canPlay && g.slug
                      ? `${g.name} →`
                      : station.isDone
                        ? doneHint
                        : lockedHint}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
