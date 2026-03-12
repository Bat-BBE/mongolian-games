"use client";

import { Sword, BookOpen, Shield, Wrench, ChevronLeft, ChevronRight } from "lucide-react";
import type { DashStrings } from "./dashboard-strings";
import { useState, useEffect } from "react";

interface LeftPanelProps {
  t: DashStrings;
  accentColor: string;
  xp: number;
  xpMax: number;
  avatarUrl: string;
  bonusMultiplier: string;
  bonusTitle: string;
}

const TREASURY_ICONS = [
  { Icon: Shield, label: "shield" },
  { Icon: Sword, label: "swords" },
  { Icon: BookOpen, label: "auto_stories" },
  { Icon: Wrench, label: "hardware" },
];

export function LeftPanel({
  t,
  accentColor,
  xp,
  xpMax,
  avatarUrl,
  bonusMultiplier,
  bonusTitle,
}: LeftPanelProps) {
  const xpPct = Math.round((xp / xpMax) * 100);
  const [isMobile, setIsMobile] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (isMobile) {
    return (
      <div className="fixed bottom-0 left-0 w-full bg-background/90 backdrop-blur-md border-t border-primary/20 z-30 flex justify-around py-2">
        {TREASURY_ICONS.map(({ Icon, label }) => (
          <button
            key={label}
            className="flex flex-col items-center justify-center text-primary/70 hover:text-primary transition-colors"
          >
            <Icon className="w-6 h-6" />
            <span className="text-[9px] mt-0.5 uppercase">{label}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <aside
      className={`glass-panel border-r border-primary/10 p-4 flex flex-col gap-6 z-20 overflow-y-auto bg-background/30 transition-all duration-300 ${
        collapsed ? "w-16" : "w-80"
      }`}
    >
      <button
        className="p-1 bg-background/80 border border-primary/30 rounded-full shadow-md hover:bg-background/90 transition"
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? (
          <ChevronRight className="w-4 h-4 text-primary" />
        ) : (
          <ChevronLeft className="w-4 h-4 text-primary" />
        )}
      </button>

      {!collapsed && (
        <div className="space-y-3">
          <SectionTitle>{t.currentExpedition}</SectionTitle>
          <div className="relative group">
            <div
              className="absolute -inset-1 rounded-3xl blur opacity-20 group-hover:opacity-40 transition"
              style={{ background: accentColor }}
            />
            <div className="relative glass p-5 rounded-3xl border border-primary/30 bg-background/80">
              <div className="flex items-center justify-between mb-3">
                <span className="bg-primary/20 text-primary text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-tighter">
                  {t.mainQuest}
                </span>
              </div>
              <h4 className="font-display text-base text-foreground mb-2">{t.questTitle}</h4>
              <p className="text-xs text-foreground/70 mb-5">{t.questDesc}</p>
              <button
                className="w-full py-3 text-white font-bold text-xs rounded-xl hover:scale-[1.02] transition-all uppercase tracking-widest shadow-lg"
                style={{
                  background: "var(--crimson-light, #B22222)",
                  boxShadow: "0 8px 24px rgba(139,0,0,0.35)",
                }}
              >
                {t.continueJourney}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4">
        <SectionTitle>{t.treasury}</SectionTitle>
        <div className={`grid ${collapsed ? "grid-cols-1 gap-3" : "grid-cols-4 gap-2"} mt-3`}>
          {TREASURY_ICONS.map(({ Icon, label }) => (
            <button
              key={label}
              className="aspect-square glass rounded-xl flex items-center justify-center hover:border-primary/60 transition-all group bg-background/80"
            >
              <Icon className="w-5 h-5 text-primary/60 group-hover:text-primary transition-colors" />
            </button>
          ))}
        </div>
      </div>

      {!collapsed && (
        <div className="mt-auto">
          <div className="glass bg-background/90 p-4 rounded-2xl border border-primary/20">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">{t.rank}</span>
            </div>
            <div className="flex justify-between text-[9px] text-foreground mb-1">
              <span>{t.rankTitle}</span>
              <span className="text-foreground">{xp.toLocaleString()} / {xpMax.toLocaleString()} XP</span>
            </div>
            <div className="h-1.5 w-full bg-white rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${xpPct}%`, background: "var(--gold-gradient)" }}
              />
            </div>
          </div>
        </div>
      )}

      {!collapsed && (
        <div className="flex items-center gap-10 mt-6">
          <div className="flex flex-col">
            <span className="text-[9px] text-primary uppercase tracking-[0.2em] font-bold mb-1">
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
                  {i === 0 && <img src={avatarUrl} alt="top player" className="w-full h-full object-cover" />}
                </div>
              ))}
              <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-[9px] pl-2 font-bold text-primary">
                +1.2k
              </div>
            </div>
          </div>

          <div className="h-10 w-px bg-white/10" />

          <div className="flex flex-col">
            <span className="text-[8px] text-primary uppercase tracking-[0.2em] font-bold mb-1">
              {t.activeBonus}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-primary font-bold text-xl font-display">{bonusMultiplier}</span>
              <span className="text-[9px] text-primary/70 uppercase tracking-widest">{bonusTitle}</span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-display text-[10px] text-primary uppercase tracking-[0.3em] flex items-center gap-2">
      {children}
      <span className="flex-1 h-px bg-primary/20" />
    </h3>
  );
}