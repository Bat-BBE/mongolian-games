"use client";

import { Star } from "lucide-react";
import type { DashStrings } from "./dashboard-strings";

export function ChallengeCard({ t }: { t: DashStrings }) {
  return (
    <div className="absolute top-10 right-10 w-72 z-30 hover:scale-[1.03] transition-transform duration-300">
      <div
        className="glass p-5 rounded-3xl shadow-2xl relative overflow-hidden border border-primary/30"
        style={{ boxShadow: "0 0 40px rgba(212,175,55,0.06)" }}
      >
        <div className="absolute top-0 right-0 bg-primary px-3 py-1 text-[8px] font-black text-black rounded-bl-xl uppercase tracking-wide">
          Limited
        </div>

        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
            <span className="material-symbols-outlined text-primary text-lg">
              camping
            </span>
          </div>
          <div>
            <h5 className="text-xs font-bold text-foreground uppercase tracking-tight">
              {t.challengeTitle}
            </h5>
            <p className="text-[9px] text-primary/80">{t.skillChallenge}</p>
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground leading-relaxed mb-4">
          {t.challengeDesc}
        </p>

        <div className="flex items-center justify-between">
          <div className="text-[9px] font-bold text-primary flex items-center gap-1">
            <Star className="w-3 h-3" />
            {t.xpReward}
          </div>
          <button className="px-4 py-1.5 glass hover:bg-white/10 border border-white/15 rounded-full text-[10px] font-black uppercase tracking-widest transition-all">
            {t.accept}
          </button>
        </div>
      </div>
    </div>
  );
}
