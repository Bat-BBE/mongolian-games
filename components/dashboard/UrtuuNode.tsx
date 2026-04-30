"use client";

import { LuLock as Lock } from "react-icons/lu";
import { cn } from "@/lib/utils";

export interface UrtuuStation {
  id: string;
  name: string;
  region?: string;
  /** Энэ өртөөнд холбогдсон бүх тоглоом — popup-д харуулна. */
  games?: { slug: string; name: string; desc: string; reward: string }[];
  gameSlug?: string;
  gameName: string;
  gameDesc: string;
  reward: string;
  available: boolean;
  /** position on the pseudo-3D map as % */
  pos: { left: string; top: string };
  /** is this the current player location? */
  isCurrent?: boolean;
  /** already completed? */
  isDone?: boolean;
  icon?: string;
  /** API/admin map marker image (resolved absolute URL) */
  imageUrl?: string;
  distance?: string;
  /** Өртөөний товч түүх (API quest_hint / quest_desc) */
  questHint?: string | null;
  questDesc?: string | null;
}

interface UrtuuNodeProps {
  station: UrtuuStation;
  isSelected: boolean;
  onSelect: (id: string) => void;
  lockedLabel: string;
}

export function UrtuuNode({
  station,
  isSelected,
  onSelect,
  lockedLabel,
}: UrtuuNodeProps) {
  const {
    available,
    isCurrent,
    isDone,
    pos,
    name,
    icon = "location_on",
  } = station;

  return (
    <div
      className="absolute z-10 flex flex-col items-center"
      style={{
        left: pos.left,
        top: pos.top,
        transform: "translate(-50%, -50%)",
      }}
    >
      {/* Tooltip on hover */}
      <div
        className={cn(
          "absolute -top-16 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg whitespace-nowrap glass border border-primary/30 pointer-events-none transition-all duration-300",
          isSelected ? "opacity-100 scale-100" : "opacity-0 scale-90",
        )}
      >
        <p className="text-[9px] font-black text-primary uppercase tracking-widest">
          {name}
        </p>
        <p className="text-[8px] text-muted-foreground">{station.gameName}</p>
      </div>

      {/* Node button */}
      <button
        onClick={() => available && onSelect(station.id)}
        className={cn(
          "landmark-3d relative flex items-center justify-center rounded-full border-4 transition-all duration-300",
          isCurrent
            ? "w-20 h-20 shadow-[0_0_40px_rgba(230,57,70,0.7)]"
            : isDone
              ? "w-14 h-14 shadow-[0_0_20px_rgba(212,175,55,0.5)]"
              : available
                ? "w-16 h-16 hover:scale-110"
                : "w-12 h-12 opacity-35 grayscale cursor-not-allowed",
        )}
        style={
          isCurrent
            ? { background: "var(--accent-red, #E63946)", borderColor: "white" }
            : isDone
              ? {
                  background: "var(--gold-main, #D4AF37)",
                  borderColor: "var(--bg-abyss, #050608)",
                }
              : available
                ? {
                    background: isSelected
                      ? "var(--gold-main,#D4AF37)"
                      : "color-mix(in oklch, var(--primary) 30%, var(--card))",
                    borderColor: isSelected
                      ? "white"
                      : "var(--gold-dark,#AA8C2C)",
                  }
                : { background: "#1e293b", borderColor: "#334155" }
        }
      >
        {available ? (
          <span className="material-symbols-outlined text-white text-2xl">
            {icon}
          </span>
        ) : (
          <Lock className="w-5 h-5 text-slate-500" />
        )}

        {/* Pulse ring for current */}
        {isCurrent && (
          <span
            className="absolute inset-0 rounded-full animate-ping opacity-30"
            style={{ background: "var(--accent-red,#E63946)" }}
          />
        )}
      </button>

      {/* Label below */}
      <div
        className={cn(
          "mt-2 px-3 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest whitespace-nowrap",
          available
            ? "glass border-primary/30"
            : "bg-slate-900/60 border border-slate-700/40",
        )}
        style={{ color: available ? "white" : "#64748b" }}
      >
        {available ? name : lockedLabel}
      </div>
    </div>
  );
}
