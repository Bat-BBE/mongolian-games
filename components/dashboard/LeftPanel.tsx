"use client";

import { Sword, BookOpen, Shield, Wrench, ChevronLeft, ChevronRight, Map, Gem, TrendingUp, Trophy } from "lucide-react";
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

  const NAV_ITEMS = [
    { id: "quest", Icon: Map, label: t.currentExpedition },
    { id: "treasury", Icon: Gem, label: t.treasury },
    { id: "progress", Icon: TrendingUp, label: t.rank },
    { id: "leaderboard", Icon: Trophy, label: t.leaderboard },
  ];

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Дунд зэргийн томруулсан контент
  const renderContent = () => {
    if (collapsed) {
      return (
        <div className="flex flex-col gap-6 mt-4 w-full items-center">
          {NAV_ITEMS.map(({ id, Icon, label }) => (
            <button
              key={id}
              className="flex flex-col items-center justify-center text-primary/70 hover:text-primary transition-all group"
              title={label}
            >
              <div className="p-3 rounded-xl glass bg-background/60 group-hover:bg-primary/20 border border-primary/20 group-hover:border-primary/50 transition-all mb-1">
                <Icon className="w-6 h-6 text-foreground/80 group-hover:text-primary transition-colors" />
              </div>
              <span className="text-[9px] uppercase mt-1 font-medium">{label}</span>
            </button>
          ))}
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-5">
        {/* Quest Section */}
        <div className="space-y-2 w-full">
          <SectionTitle>{t.currentExpedition}</SectionTitle>
          <div className="relative group">
            <div
              className="absolute -inset-1 rounded-2xl blur opacity-20 group-hover:opacity-40 transition"
              style={{ background: accentColor }}
            />
            <div className="relative glass p-4 rounded-2xl border border-primary/30 bg-background/80">
              <div className="flex items-center justify-between mb-2">
                <span className="bg-primary/20 text-primary text-[10px] px-2 py-0.5 rounded uppercase font-bold">
                  {t.mainQuest}
                </span>
              </div>
              <h4 className="font-display text-base text-foreground mb-1.5 font-semibold">{t.questTitle}</h4>
              <p className="text-xs text-foreground/70 mb-3 leading-relaxed line-clamp-2">{t.questDesc}</p>
              <button
                className="w-full py-2.5 text-white font-bold text-xs rounded-lg hover:scale-[1.02] transition-all uppercase tracking-widest shadow-lg"
                style={{
                  background: "var(--crimson-light, #B22222)",
                  boxShadow: "0 4px 16px rgba(139,0,0,0.3)",
                }}
              >
                {t.continueJourney}
              </button>
            </div>
          </div>
        </div>

        {/* Treasury Section */}
        <div className="w-full">
          <SectionTitle>{t.treasury}</SectionTitle>
          <div className="grid grid-cols-4 gap-2 mt-1.5">
            {TREASURY_ICONS.map(({ Icon, label }) => (
              <button
                key={label}
                className="aspect-square glass rounded-lg flex items-center justify-center hover:border-primary/60 transition-all group bg-background/80 w-full p-3"
              >
                <Icon className="w-5 h-5 text-primary/60 group-hover:text-primary transition-colors" />
              </button>
            ))}
          </div>
        </div>

        {/* Progress Section */}
        <div className="w-full">
          <SectionTitle>{t.rank}</SectionTitle>
          <div className="glass bg-background/90 p-3 rounded-lg border border-primary/20 mt-1.5">
            <div className="flex justify-between text-[11px] text-foreground mb-1.5">
              <span className="font-bold uppercase tracking-wider text-primary">{t.rankTitle}</span>
              <span className="text-foreground font-medium">{xp.toLocaleString()} / {xpMax.toLocaleString()}</span>
            </div>
            <div className="h-1.5 w-full bg-background/50 border border-primary/20 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${xpPct}%`, background: "var(--gold-gradient, var(--grad-gold))" }}
              />
            </div>
          </div>
        </div>

        {/* Leaderboard Section */}
        <div className="w-full">
          <SectionTitle>{t.leaderboard}</SectionTitle>
          <div className="flex items-center justify-between gap-3 mt-1.5">
            <div className="flex flex-col">
              <span className="text-[8px] text-primary uppercase tracking-[0.2em] font-bold mb-1.5">
                Top Players
              </span>
              <div className="flex items-center -space-x-2">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-7 h-7 rounded-full border-2 overflow-hidden bg-background/80"
                    style={{
                      zIndex: 30 - i * 10,
                      borderColor: i === 0 ? "var(--gold-main, var(--gold-bright))" : "color-mix(in oklch, var(--primary) 30%, var(--border))",
                    }}
                  >
                    {i === 0 && <img src={avatarUrl} alt="top player" className="w-full h-full object-cover" />}
                  </div>
                ))}
                <div className="w-7 h-7 rounded-full bg-background/90 border border-primary/30 flex items-center justify-center font-bold text-primary text-[10px]">
                  +1.2k
                </div>
              </div>
            </div>

            <div className="h-9 w-px bg-primary/20 shrink-0" />

            <div className="flex flex-col">
              <span className="text-[7px] text-primary uppercase tracking-[0.2em] font-bold mb-1">
                {t.activeBonus}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-primary font-bold text-base font-display">{bonusMultiplier}</span>
                <span className="text-[10px] text-primary/70 uppercase tracking-widest">{bonusTitle}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isMobile) {
    return (
      <div className="fixed bottom-0 left-0 w-full bg-background/95 backdrop-blur-md border-t border-primary/20 z-30 flex justify-around py-2 shrink-0 h-[72px]">
        {NAV_ITEMS.map(({ id, Icon, label }) => (
          <button
            key={id}
            className="flex flex-col items-center justify-center text-primary/70 hover:text-primary transition-all px-1.5"
          >
            <Icon className="w-5 h-5 mb-0.5" />
            <span className="text-[8px] uppercase max-w-[65px] text-center leading-tight font-medium">
              {label}
            </span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <aside
      className={`glass-panel border-r border-primary/10 flex flex-col z-20 bg-background/30 transition-all duration-300 ${
        collapsed ? "w-24 p-3" : "w-80 p-4"
      }`}
      style={{ height: "calc(100vh - 2rem)", maxHeight: "850px" }}
    >
      <div className={`flex w-full ${collapsed ? "justify-center" : "justify-end"} shrink-0 mb-3`}>
        <button
          className="p-1.5 bg-background/80 border border-primary/30 rounded-md shadow-md hover:bg-primary/20 hover:text-primary transition-all"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4 text-primary" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-primary" />
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide pr-1">
        {renderContent()}
      </div>
    </aside>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-display text-[10px] text-primary uppercase tracking-[0.3em] flex items-center gap-2 mb-1.5">
      {children}
      <span className="flex-1 h-px bg-primary/20" />
    </h3>
  );
}