"use client";

import {
  LuChevronLeft as ChevronLeft,
  LuChevronRight as ChevronRight,
  LuSword as Sword,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import { HEROES, type Hero } from "./hero-data";
import type { HeroId, Lang, HeroStrings } from "./hero-strings";
import HeroCard from "./hero-card";
import { InfoPanel } from "./info-panel";

interface HeroChooseScreenProps {
  t: HeroStrings;
  lang: Lang;
  heroes?: Hero[] | null;
  playerName: string;
  selectedId: HeroId;
  setSelectedId: (id: HeroId) => void;
  onPlay: () => void;
}

export function HeroChooseScreen({
  t,
  lang,
  heroes,
  playerName,
  selectedId,
  setSelectedId,
  onPlay,
}: HeroChooseScreenProps) {
  const roster = Array.isArray(heroes) && heroes.length > 0 ? heroes : HEROES;

  const selectedHero = roster.find((h) => h.id === selectedId) ?? roster[0]!;

  const navigate = (dir: 1 | -1) => {
    const idx = roster.findIndex((h) => h.id === selectedId);
    const next = (idx + dir + roster.length) % roster.length;
    setSelectedId(roster[next]!.id);
  };

  const cardName = (h: Hero) => (lang === "mn" ? h.nameMn : h.nameEn);
  const cardTitle = (h: Hero) => (lang === "mn" ? h.titleMn : h.titleEn);

  return (
    <div className="relative flex flex-col animate-scale-in w-full">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[clamp(88px,12vw,150px)] transition-all duration-700"
        style={{
          background: `radial-gradient(ellipse 80% 100% at 50% 0%, ${selectedHero.color}18 0%, transparent 100%)`,
        }}
      />

      <div
        className="h-px w-full"
        style={{
          background: `linear-gradient(90deg, transparent, ${selectedHero.color}80, transparent)`,
        }}
      />

      <div
        className="flex flex-col items-center"
        style={{
          padding: "clamp(14px,2.5vw,28px)",
          gap: "clamp(10px,1.8vw,20px)",
        }}
      >
        <div className="text-center max-w-xl">
          <p
            className="font-heritage italic"
            style={{
              color: "rgb(255,198,28)",
              fontSize: "clamp(12px,1.45vw,15px)",
              marginBottom: "3px",
            }}
          >
            {t.greeting}{" "}
            <strong
              className="not-italic font-display font-bold"
              style={{ color: "var(--gold-light, #ffb300)" }}
            >
              {playerName}
            </strong>
          </p>

          <h2
            className="font-display tracking-[0.18em]"
            style={{
              color: "white",
              fontWeight: 400,
              fontSize: "clamp(13px,1.65vw,19px)",
            }}
          >
            {t.chooseHero}
          </h2>
        </div>

        <div className="relative w-full flex items-center justify-center mt-0">
          <NavArrow dir="left" onClick={() => navigate(-1)} />

          <div
            className="
              flex items-end
              overflow-x-auto
              scrollbar-hide
              snap-x snap-mandatory
            "
            style={{
              gap: "clamp(8px,1.5vw,16px)",
              padding: "clamp(8px,1.6vw,20px)",
              maxWidth: "100%",
            }}
          >
            {roster.map((hero) => (
              <div key={hero.id} className="snap-center">
                <HeroCard
                  name={cardName(hero)}
                  title={cardTitle(hero)}
                  imageUrl={hero.imageUrl ?? ""}
                  modelPath={hero.modelPath}
                  accentColor={hero.color}
                  selected={selectedId === hero.id}
                  locked={!hero.available}
                  onClick={() => setSelectedId(hero.id)}
                />
              </div>
            ))}
          </div>
          <NavArrow dir="right" onClick={() => navigate(1)} />
        </div>
        <div className="w-full max-w-[min(100%,34rem)]">
          <InfoPanel hero={selectedHero} lang={lang} t={t} />
        </div>

        <button
          onClick={onPlay}
          disabled={!selectedHero.available}
          className={cn(
            "flex items-center justify-center gap-3",
            "font-display font-black uppercase rounded-2xl",
            "transition-all duration-300",
            selectedHero.available
              ? "hover:-translate-y-0.5 hover:tracking-[0.28em] active:scale-[0.98]"
              : "opacity-30 cursor-not-allowed",
          )}
          style={{
            fontSize: "clamp(11px,1.9vw,13px)",
            letterSpacing: "0.18em",
            padding: "clamp(11px,1.4vw,16px) clamp(14px,3.2vw,34px)",
            width: "min(380px,100%)",

            ...(selectedHero.available
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
                }),
          }}
        >
          <Sword className="w-[clamp(14px,1.4vw,18px)] h-[clamp(14px,1.4vw,18px)]" />

          {selectedHero.available ? t.playBtn : t.lockedHero}

          <Sword className="w-[clamp(14px,1.4vw,18px)] h-[clamp(14px,1.4vw,18px)]" />
        </button>
      </div>

      <div
        className="h-px w-full"
        style={{
          background: `linear-gradient(90deg, transparent, ${selectedHero.color}40, transparent)`,
        }}
      />
    </div>
  );
}

function NavArrow({
  dir,
  onClick,
}: {
  dir: "left" | "right";
  onClick: () => void;
}) {
  const Icon = dir === "left" ? ChevronLeft : ChevronRight;

  return (
    <button
      onClick={onClick}
      className="absolute z-10 transition-all duration-200"
      style={{
        [dir]: "clamp(-8px,1vw,6px)",
        color: "rgba(255,255,255,0.35)",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.color = "white")}
      onMouseLeave={(e) =>
        (e.currentTarget.style.color = "rgba(255,255,255,0.35)")
      }
    >
      <Icon className="w-[clamp(20px,2.2vw,30px)] h-[clamp(20px,2.2vw,30px)]" />
    </button>
  );
}
