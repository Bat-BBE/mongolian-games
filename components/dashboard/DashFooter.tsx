"use client";

import { BookOpen, Play } from "lucide-react";
import type { DashStrings } from "./dashboard-strings";

interface DashFooterProps {
  t: DashStrings;
  avatarUrl: string;
  bonusMultiplier: string;
  bonusTitle: string;
  onJournal: () => void;
  onBeginRelay: () => void;
}

export function DashFooter({
  t, avatarUrl, bonusMultiplier, bonusTitle,
  onJournal, onBeginRelay,
}: DashFooterProps) {
  return (
    <footer className="h-24 glass-panel border-t border-primary/20 flex items-center justify-between px-10 shrink-0 z-50 bg-background/30">

      <div className="flex items-center gap-10">
        <div className="flex flex-col">
          <span className="text-[10px] text-primary uppercase tracking-[0.2em] font-bold mb-1">
            {t.leaderboard}
          </span>
          <div className="flex items-center -space-x-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full border-2 overflow-hidden bg-slate-800"
                style={{
                  zIndex: 30 - i * 10,
                  borderColor: i === 0 ? "var(--gold-main)" : "#334155",
                }}
              >
                {i === 0 && (
                  <img src={avatarUrl} alt="top player" className="w-full h-full object-cover" />
                )}
              </div>
            ))}
            <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-[9px] pl-2 font-bold text-primary">
              +1.2k
            </div>
          </div>
        </div>

        <div className="h-10 w-px bg-white/10" />

        <div className="flex flex-col">
          <span className="text-[10px] text-primary uppercase tracking-[0.2em] font-bold mb-1">
            {t.activeBonus}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-primary font-bold text-xl font-display">{bonusMultiplier}</span>
            <span className="text-[9px] text-primary/70 uppercase tracking-widest">{bonusTitle}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* <button
          onClick={onJournal}
          className="px-8 py-3 glass rounded-full hover:bg-white/5 transition-all text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2"
        >
          <BookOpen className="w-4 h-4" />
          {t.journal}
        </button> */}
        {/* <button
          onClick={onBeginRelay}
          className="px-10 py-4 rounded-full font-black text-sm uppercase tracking-[0.2em] text-white transition-all hover:scale-105 flex items-center gap-2 bg-primary/80"
        //   style={{
        //     background: "var(--crimson, #ffffff)",
        //     boxShadow: "0 10px 30px rgba(67, 67, 67, 0.4), 0 2px 8px rgba(212,175,55,0.15)",
        //   }}
        >
          <Play className="w-4 h-4" />
          {t.beginRelay}
        </button> */}
      </div>
    </footer>
  );
}