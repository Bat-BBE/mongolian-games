"use client";

import { Sword, BookOpen, Shield, Wrench, ChevronLeft, ChevronRight, Map, Gem, TrendingUp, Trophy, X } from "lucide-react";
import type { DashStrings } from "./dashboard-strings";
import { useState, useEffect, useRef } from "react";

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
  const [activeMobileTab, setActiveMobileTab] = useState<string | null>(null);

  const questRef = useRef<HTMLDivElement>(null);
  const treasuryRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const leaderboardRef = useRef<HTMLDivElement>(null);

  const refs: Record<string, React.RefObject<HTMLDivElement | null>> = {
    quest: questRef,
    treasury: treasuryRef,
    progress: progressRef,
    leaderboard: leaderboardRef,
  };

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

  const handleNavClick = (id: string) => {
    setCollapsed(false);
    setTimeout(() => {
      refs[id]?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
  };

  const renderQuestContent = () => (
    <div className="space-y-3 w-full">
      {!isMobile && <SectionTitle>{t.currentExpedition}</SectionTitle>}
      {isMobile && <h3 className="font-display text-sm text-primary uppercase mb-4 text-center">{t.currentExpedition}</h3>}
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
  );

  const renderTreasuryContent = () => (
    <div className="w-full">
      {!isMobile && <SectionTitle>{t.treasury}</SectionTitle>}
      {isMobile && <h3 className="font-display text-sm text-primary uppercase mb-4 text-center">{t.treasury}</h3>}
      <div className="grid grid-cols-4 gap-2 mt-2">
        {TREASURY_ICONS.map(({ Icon, label }) => (
          <button
            key={label}
            className="aspect-square glass rounded-xl flex items-center justify-center hover:border-primary/60 transition-all group bg-background/80 w-full"
          >
            <Icon className="w-5 h-5 text-primary/60 group-hover:text-primary transition-colors" />
          </button>
        ))}
      </div>
    </div>
  );

  const renderProgressContent = () => (
    <div className="w-full mt-auto">
      {!isMobile && <SectionTitle>{t.rank}</SectionTitle>}
      {isMobile && <h3 className="font-display text-sm text-primary uppercase mb-4 text-center">{t.rank}</h3>}
      <div className="glass bg-background/90 p-4 rounded-2xl border border-primary/20 mt-2">
        <div className="flex justify-between text-[10px] text-foreground mb-2">
          <span className="font-bold uppercase tracking-wider text-primary">{t.rankTitle}</span>
          <span className="text-foreground">{xp.toLocaleString()} / {xpMax.toLocaleString()} XP</span>
        </div>
        <div className="h-1.5 w-full bg-background/50 border border-primary/20 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${xpPct}%`, background: "var(--gold-gradient, var(--grad-gold))" }}
          />
        </div>
      </div>
    </div>
  );

  const renderLeaderboardContent = () => (
    <div className="w-full">
      {!isMobile && <SectionTitle>{t.leaderboard}</SectionTitle>}
      {isMobile && <h3 className="font-display text-sm text-primary uppercase mb-4 text-center">{t.leaderboard}</h3>}
      <div className={`flex items-center justify-between gap-4 mt-2 ${isMobile ? "flex-col w-full" : ""}`}>
        <div className={`flex flex-col ${isMobile ? "w-full items-center mb-4" : ""}`}>
          <span className="text-[9px] text-primary uppercase tracking-[0.2em] font-bold mb-2">
             Top Players
          </span>
          <div className="flex items-center -space-x-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`rounded-full border-2 overflow-hidden bg-background/80 ${isMobile ? "w-10 h-10" : "w-8 h-8"}`}
                style={{
                  zIndex: 30 - i * 10,
                  borderColor: i === 0 ? "var(--gold-main, var(--gold-bright))" : "color-mix(in oklch, var(--primary) 30%, var(--border))",
                }}
              >
                {i === 0 && <img src={avatarUrl} alt="top player" className="w-full h-full object-cover" />}
              </div>
            ))}
            <div className={`rounded-full bg-background/90 border border-primary/30 flex items-center justify-center font-bold text-primary ${isMobile ? "w-10 h-10 text-[10px] pl-3" : "w-8 h-8 text-[9px] pl-2"}`}>
              +1.2k
            </div>
          </div>
        </div>

        {!isMobile && <div className="h-10 w-px bg-primary/20 shrink-0" />}
        {isMobile && <div className="w-full h-px bg-primary/20" />}

        <div className={`flex flex-col ${isMobile ? "w-full items-center mt-2" : ""}`}>
          <span className="text-[8px] text-primary uppercase tracking-[0.2em] font-bold mb-1">
            {t.activeBonus}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-primary font-bold text-xl md:text-2xl font-display">{bonusMultiplier}</span>
            <span className="text-[9px] md:text-sm text-primary/70 uppercase tracking-widest">{bonusTitle}</span>
          </div>
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <>
        {/* Mobile Expanded Overlay Content */}
        {activeMobileTab && (
          <div className="fixed bottom-[68px] left-0 w-full bg-background/95 backdrop-blur-xl border-t border-primary/20 z-20 p-5 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] max-h-[70vh] overflow-y-auto duration-300 animate-in slide-in-from-bottom-5">
            <button 
              onClick={() => setActiveMobileTab(null)}
              className="absolute top-4 right-4 p-1.5 bg-background/80 border border-primary/30 rounded-full text-primary/70 hover:text-primary hover:bg-primary/20 transition-all z-30"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="pt-2 pb-6 relative z-10 w-full">
              {activeMobileTab === 'quest' && renderQuestContent()}
              {activeMobileTab === 'treasury' && renderTreasuryContent()}
              {activeMobileTab === 'progress' && renderProgressContent()}
              {activeMobileTab === 'leaderboard' && renderLeaderboardContent()}
            </div>
          </div>
        )}

        {/* Mobile Bottom Navigation Menu */}
        <div className="fixed bottom-0 left-0 w-full bg-background/90 backdrop-blur-md border-t border-primary/20 z-30 flex justify-around py-2 shrink-0 h-[68px]">
          {NAV_ITEMS.map(({ id, Icon, label }) => (
            <button
              key={id}
              onClick={() => setActiveMobileTab(activeMobileTab === id ? null : id)}
              className={`flex flex-col items-center justify-center transition-all px-2 ${
                activeMobileTab === id ? "text-primary scale-110" : "text-primary/70 hover:text-primary"
              }`}
            >
              <Icon className="w-6 h-6 mb-1" />
              <span className="text-[8px] uppercase max-w-[70px] text-center leading-tight truncate px-1">
                {label}
              </span>
            </button>
          ))}
        </div>
      </>
    );
  }

  return (
    <aside
      className={`glass-panel border-r border-primary/10 flex flex-col z-20 overflow-y-auto bg-background/30 transition-all duration-300 ${
        collapsed ? "w-20 p-3 gap-6 items-center" : "w-80 p-4 gap-6"
      }`}
    >
      <div className={`flex w-full ${collapsed ? "justify-center" : "justify-end"} shrink-0`}>
        <button
          className="p-1.5 bg-background/80 border border-primary/30 rounded-md shadow-md xl:hover:bg-primary/20 hover:text-primary transition-all"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5 text-primary" />
          ) : (
            <ChevronLeft className="w-5 h-5 text-primary" />
          )}
        </button>
      </div>

      {collapsed ? (
        <div className="flex flex-col gap-6 mt-4 w-full items-center">
          {NAV_ITEMS.map(({ id, Icon, label }) => (
            <button
              key={id}
              onClick={() => handleNavClick(id)}
              className="flex flex-col items-center justify-center text-primary/70 hover:text-primary transition-all group"
              title={label}
            >
              <div className="p-3 rounded-xl glass bg-background/60 group-hover:bg-primary/20 border border-primary/20 group-hover:border-primary/50 transition-all mb-1">
                <Icon className="w-6 h-6 text-foreground/80 group-hover:text-primary transition-colors" />
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-8 pb-10">
          <div ref={questRef} className="scroll-mt-4">
            {renderQuestContent()}
          </div>
          
          <div ref={treasuryRef} className="scroll-mt-4">
            {renderTreasuryContent()}
          </div>
          
          <div ref={progressRef} className="scroll-mt-4">
            {renderProgressContent()}
          </div>
          
          <div ref={leaderboardRef} className="scroll-mt-4">
            {renderLeaderboardContent()}
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