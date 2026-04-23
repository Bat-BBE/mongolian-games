"use client";

import { LuEye as Eye, LuBookOpen as BookOpen, LuZap as Zap, LuLock as Lock } from "react-icons/lu";
import type { DashStrings } from "./dashboard-strings";

interface RightPanelProps {
  t: DashStrings;
  stationsTotal: number;
  stationsFound: number;
  activeSeason: "spring" | "summer" | "autumn" | "winter";
  onSeasonChange: (s: "spring" | "summer" | "autumn" | "winter") => void;
}

const MASTERY_UNLOCKED = [
  { Icon: Zap, title: "The Swift Rider" },
  { Icon: BookOpen, title: "Empire Historian" },
  { Icon: Eye, title: "Eagle Hunter" },
];

const SEASONS = ["spring", "summer", "autumn", "winter"] as const;

export function RightPanel({
  t, stationsTotal, stationsFound, activeSeason, onSeasonChange,
}: RightPanelProps) {
  return (
    <aside className="w-80 glass-panel border-l border-primary/10 p-6 flex flex-col gap-8 z-20 overflow-y-auto shrink-0">

      {/* ── Urtuu Chain Progress ────────────────── */}
      <div>
        <SectionTitle icon="explore">{t.urtuuChain}</SectionTitle>
        <div className="flex justify-between text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-3 mb-2">
          <span>{t.urtuuChain}</span>
          <span className="text-foreground">
            {stationsFound} / {stationsTotal} {t.discovered}
          </span>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: stationsTotal }).map((_, i) => (
            <div
              key={i}
              className="flex-1 h-1 rounded-full transition-all duration-500"
              style={{
                background: i < stationsFound
                  ? "var(--gold-gradient)"
                  : "rgba(255,255,255,0.08)",
                boxShadow: i < stationsFound ? "0 0 6px var(--gold-main)" : "none",
              }}
            />
          ))}
        </div>
      </div>

      {/* ── Masteries ──────────────────────────── */}
      <div>
        <SectionTitle icon="verified_user">{t.masteries}</SectionTitle>
        <div className="grid grid-cols-3 gap-3 mt-3">
          {MASTERY_UNLOCKED.map(({ Icon, title }) => (
            <button
              key={title}
              title={title}
              className="aspect-square glass rounded-full flex items-center justify-center border-primary/30 hover:scale-110 transition-transform group"
            >
              <Icon className="w-5 h-5 text-primary group-hover:drop-shadow-[0_0_6px_var(--gold-main)] transition-all" />
            </button>
          ))}
          {[1, 2, 3].map((i) => (
            <div
              key={`locked-${i}`}
              className="aspect-square glass rounded-full flex items-center justify-center opacity-20 cursor-not-allowed"
            >
              <Lock className="w-4 h-4 text-muted-foreground" />
            </div>
          ))}
        </div>
      </div>

      {/* ── Season Cycle ───────────────────────── */}
      <div className="mt-auto">
        <div className="glass bg-gradient-to-br from-sky-500/10 to-transparent p-5 rounded-3xl border border-white/5">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-primary text-sm">explore</span>
            <span className="text-xs font-bold text-foreground uppercase tracking-widest">{t.seasonCycle}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {SEASONS.map((s) => (
              <button
                key={s}
                onClick={() => onSeasonChange(s)}
                className="py-2 rounded-xl text-[9px] uppercase font-black tracking-wider transition-all"
                style={
                  activeSeason === s
                    ? {
                        background: "color-mix(in oklch, var(--primary) 25%, transparent)",
                        border: "2px solid var(--gold-main)",
                        color: "var(--gold-main)",
                      }
                    : {
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        color: "rgba(255,255,255,0.35)",
                      }
                }
              >
                {t.seasons[s]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}

function SectionTitle({ children, icon }: { children: React.ReactNode; icon?: string }) {
  return (
    <h3 className="font-display text-[10px] text-primary uppercase tracking-[0.3em] flex items-center gap-2">
      {icon && <span className="material-symbols-outlined text-sm">{icon}</span>}
      {children}
      <span className="flex-1 h-px bg-primary/20" />
    </h3>
  );
}