"use client";

import { ModeToggle } from "@/components/ui/mode-toggle";
import type { DashStrings, DashLang } from "./dashboard-strings";

interface DashNavProps {
  t: DashStrings;
  lang: DashLang;
  setLang: (l: DashLang) => void;
  playerName: string;
  playerTitle: string;
  avatarUrl: string;
  level: number;
  kp: number;
  tokens: { used: number; max: number };
}

export function DashNav({
  t, lang, setLang,
  playerName, playerTitle, avatarUrl, level,
  kp, tokens,
}: DashNavProps) {
  return (
    <nav className="w-full z-[50] border-b border-primary/20 px-8 h-20 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-6">
        <div className="flex flex-col leading-none">
          <span className="text-2xl font-display font-black text-gradient-gold tracking-widest">MTGA</span>
          <span className="font-heritage text-[9px] tracking-[0.4em] uppercase text-primary/60">{t.title}</span>
        </div>

        <div className="h-10 w-px bg-primary/90" />
      </div>

      <div className="flex items-center gap-5">
        <div className="flex items-center gap-3">
          <div className="text-right hidden md:block">
            <p className="text-xs text-foreground font-bold">{playerName}</p>
            <p className="text-[10px] text-primary uppercase tracking-tighter">{playerTitle}</p>
          </div>
          <div className="relative w-11 h-11">
            <img
              src={avatarUrl}
              alt={playerName}
              className="w-full h-full object-cover rounded-full border-2 border-primary shadow-[0_0_15px_rgba(212,175,55,0.4)]"
            />
            <div className="absolute -bottom-1 -right-1 bg-primary text-black text-[8px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-background">
              {level}
            </div>
          </div>
        </div>
        <div
          className="flex items-center gap-1 rounded-full p-1"
          style={{
            background: "color-mix(in oklch, var(--background) 30%, transparent)",
            border: "1px solid color-mix(in oklch, var(--primary) 25%, var(--border))",
          }}
        >
          {(["mn", "en"] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className="px-3 py-1 rounded-full text-xs font-display font-bold transition-all duration-200"
              style={
                lang === l
                  ? {
                      background: "var(--gold-gradient)",
                      color: "oklch(0.10 0.015 60)",
                      boxShadow: "0 2px 8px color-mix(in oklch, var(--primary) 30%, transparent)",
                    }
                  : { color: "color-mix(in oklch, var(--primary) 60%, transparent)" }
              }
            >
              {l === "mn" ? "МН" : "EN"}
            </button>
          ))}
        </div>
        <ModeToggle />
      </div>
    </nav>
  );
}