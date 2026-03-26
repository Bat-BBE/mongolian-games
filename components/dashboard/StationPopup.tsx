"use client";

import { X, Star, Gamepad2, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UrtuuStation } from "./UrtuuNode";

interface StationPopupProps {
  station: UrtuuStation | null;
  onClose: () => void;
  onPlay: (id: string) => void;
  loreLabel: string;
  minigameLabel: string;
  /** Зөвхөн одоогийн өртөө дээр тоглоом эхлүүлэх */
  canPlay?: boolean;
}

export function StationPopup({
  station,
  onClose,
  onPlay,
  loreLabel,
  minigameLabel,
  canPlay = true,
}: StationPopupProps) {
  if (!station) return null;

  return (
    <>
      <div
        className="absolute inset-0 z-40"
        onClick={onClose}
      />
      <div
        className={cn(
          "absolute bottom-6 left-1/2 -translate-x-1/2 z-50 w-[480px]",
          "glass rounded-3xl border border-primary/30 p-6",
          "animate-fade-up shadow-2xl"
        )}
        style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(212,175,55,0.08)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full glass hover:bg-white/10 transition-all"
        >
          <X className="w-3.5 h-3.5 text-muted-foreground" />
        </button>

        <div className="flex gap-5 items-start">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0 border border-primary/20 text-4xl"
            style={{ background: "color-mix(in oklch, var(--primary) 15%, transparent)" }}
          >
            {station.icon}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-display text-xl text-foreground tracking-wide">{station.name}</h4>
              <span className="text-[9px] bg-primary text-black px-2 py-0.5 rounded font-bold uppercase tracking-tighter">
                {station.gameName}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mb-4 leading-relaxed">{station.gameDesc}</p>

            <div className="flex gap-4 mb-4">
              <div className="flex items-center gap-1 text-[9px] text-primary font-bold uppercase tracking-widest">
                <Gamepad2 className="w-3 h-3" />
                {minigameLabel}: {station.gameName}
              </div>
              <div className="flex items-center gap-1 text-[9px] text-muted-foreground font-bold uppercase tracking-widest">
                <BookOpen className="w-3 h-3" />
                {loreLabel}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-[10px] font-bold text-primary">
                <Star className="w-3.5 h-3.5" />
                {station.reward}
              </div>
              <button
                type="button"
                disabled={!canPlay}
                onClick={() => canPlay && onPlay(station.id)}
                className={cn(
                  "px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                  canPlay
                    ? "text-black hover:scale-105"
                    : "text-muted-foreground cursor-not-allowed opacity-60",
                )}
                style={
                  canPlay ? { background: "var(--gold-gradient)" } : undefined
                }
              >
                {canPlay
                  ? `${station.gameName} →`
                  : station.isDone
                    ? "Дууссан"
                    : "Хүлээгдэж буй"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}