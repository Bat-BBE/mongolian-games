"use client";

import { Cloud, ChevronLeft, ChevronRight, Sword } from "lucide-react";
import { cn } from "@/lib/utils";
import { HEROES } from "./hero-data";
import type { HeroId, Lang, HeroStrings } from "./hero-strings";
import HeroCard from "./hero-card";
import { InfoPanel } from "./info-panel";

interface HeroChooseScreenProps {
  t: HeroStrings;
  lang: Lang;
  playerName: string;
  selectedId: HeroId;
  setSelectedId: (id: HeroId) => void;
  onPlay: () => void;
  onGuest: () => void;
}

export function HeroChooseScreen({
  t, lang, playerName, selectedId, setSelectedId, onPlay, onGuest,
}: HeroChooseScreenProps) {
  const selectedHero = HEROES.find((h) => h.id === selectedId)!;

  const navigate = (dir: 1 | -1) => {
    const idx = HEROES.findIndex((h) => h.id === selectedId);
    const next = (idx + dir + HEROES.length) % HEROES.length;
    setSelectedId(HEROES[next].id);
  };

  return (
    <div className="relative flex flex-col animate-scale-in">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-40 transition-all duration-700"
        style={{
          background: `radial-gradient(ellipse 80% 100% at 50% 0%, ${selectedHero.color}18 0%, transparent 100%)`,
        }}
      />

      <div
        className="h-px w-full"
        style={{ background: `linear-gradient(90deg, transparent, ${selectedHero.color}80, transparent)` }}
      />

      <div className="p-6 md:p-8 flex flex-col gap-5">
        <div className="text-center">
          <p className="font-heritage italic text-sm mb-1" style={{ color: "rgb(255, 198, 28)" }}>
            {t.greeting}{" "}
            <strong
              className="not-italic font-display font-bold"
              style={{ color: "var(--gold-light, #ffb300)" }}
            >
              {playerName}
            </strong>
          </p>
          <h2
            className="font-display tracking-[0.2em] text-base"
            style={{ color: "rgb(255, 255, 255)", fontWeight: 400 }}
          >
            {t.chooseHero}
          </h2>
        </div>

        <div className="relative flex items-center justify-center">
          <NavArrow dir="left" onClick={() => navigate(-1)} />

          <div className="flex items-end gap-3 px-8">
            {HEROES.map((hero) => (
              <HeroCard
                key={hero.id}
                name={hero.name}
                title={hero.title ?? ""}
                imageUrl={hero.imageUrl ?? ""}
                modelPath={hero.modelPath}
                accentColor={hero.color}
                selected={selectedId === hero.id}
                locked={!hero.available}
                onClick={() => setSelectedId(hero.id)}
              />
            ))}
          </div>

          <NavArrow dir="right" onClick={() => navigate(1)} />
        </div>

        <InfoPanel hero={selectedHero} selectedId={selectedId} t={t} />

        <div className="flex flex-col gap-3">
          <button
            onClick={onPlay}
            disabled={!selectedHero.available}
            className={cn(
              "w-full flex items-center justify-center gap-3",
              "font-display font-black text-xs uppercase tracking-[0.25em] py-4 rounded-2xl",
              "transition-all duration-300",
              selectedHero.available
                ? "hover:-translate-y-0.5 hover:tracking-[0.3em] active:scale-[0.99]"
                : "opacity-20 cursor-not-allowed",
            )}
            style={
              selectedHero.available
                ? {
                    background: `linear-gradient(135deg, ${selectedHero.color}cc, ${selectedHero.color})`,
                    color: "#050608",
                    boxShadow: `0 8px 30px ${selectedHero.color}40`,
                    border: "none",
                  }
                : {
                    background: "rgba(255,255,255,0.04)",
                    color: "rgba(255,255,255,0.2)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }
            }
          >
            <Sword className="w-4 h-4" />
            {selectedHero.available ? t.playBtn : t.lockedHero}
            <Sword className="w-4 h-4" />
          </button>

          {/* Guest */}
          {/* <button
            onClick={onGuest}
            className="w-full font-display font-bold text-[10px] uppercase tracking-[0.2em] py-3 rounded-2xl transition-all duration-200"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(200,200,200,0.55)",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.2)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)")}
          >
            {t.guest}
          </button> */}
        </div>

        {/* <div className="flex items-center justify-center gap-2" style={{ color: "rgba(255,255,255,0.22)" }}>
          <Cloud className="w-3 h-3" />
          <p className="text-[9px] uppercase tracking-widest">{t.autoSave}</p>
        </div> */}
      </div>

      <div
        className="h-px w-full"
        style={{ background: `linear-gradient(90deg, transparent, ${selectedHero.color}40, transparent)` }}
      />
    </div>
  );
}

function NavArrow({ dir, onClick }: { dir: "left" | "right"; onClick: () => void }) {
  const Icon = dir === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      onClick={onClick}
      className="absolute z-10 p-1 transition-colors duration-200"
      style={{ [dir]: 0, color: "rgba(255,255,255,0.3)" }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "white")}
      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.3)")}
    >
      <Icon className="w-5 h-5" />
    </button>
  );
}