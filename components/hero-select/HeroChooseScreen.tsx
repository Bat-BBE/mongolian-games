"use client";

import { LuChevronLeft as ChevronLeft, LuChevronRight as ChevronRight, LuSword as Sword } from "react-icons/lu";
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
}

export function HeroChooseScreen({
  t,
  lang,
  playerName,
  selectedId,
  setSelectedId,
  onPlay,
}: HeroChooseScreenProps) {
  const selectedHero = HEROES.find((h) => h.id === selectedId)!;

  const navigate = (dir: 1 | -1) => {
    const idx = HEROES.findIndex((h) => h.id === selectedId);
    const next = (idx + dir + HEROES.length) % HEROES.length;
    setSelectedId(HEROES[next].id);
  };

  return (
    <div className="relative flex flex-col animate-scale-in w-full">

      {/* Top Glow */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[clamp(120px,15vw,200px)] transition-all duration-700"
        style={{
          background: `radial-gradient(ellipse 80% 100% at 50% 0%, ${selectedHero.color}18 0%, transparent 100%)`,
        }}
      />

      <div
        className="h-px w-full"
        style={{
          background: `linear-gradient(90deg, transparent, ${selectedHero.color}80, transparent)`
        }}
      />

      {/* CONTENT */}
      <div
        className="flex flex-col items-center"
        style={{
          padding: "clamp(16px,4vw,40px)",
          gap: "clamp(16px,2.5vw,28px)",
        }}
      >

        {/* HEADER */}
        <div className="text-center max-w-xl">
          <p
            className="font-heritage italic"
            style={{
              color: "rgb(255,198,28)",
              fontSize: "clamp(12px,1.5vw,16px)",
              marginBottom: "4px",
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
            className="font-display tracking-[0.2em]"
            style={{
              color: "white",
              fontWeight: 400,
              fontSize: "clamp(14px,1.8vw,20px)",
            }}
          >
            {t.chooseHero}
          </h2>
        </div>

        <div className="relative w-full flex items-center justify-center mt-2">

          <NavArrow dir="left" onClick={() => navigate(-1)} />

          <div
            className="
              flex items-end
              overflow-x-auto
              scrollbar-hide
              snap-x snap-mandatory
            "
            style={{
              gap: "clamp(8px,2vw,20px)",
              padding: "clamp(10px,3vw,30px)",
              maxWidth: "100%",
            }}
          >
            {HEROES.map((hero) => (
              <div key={hero.id} className="snap-center">
                <HeroCard
                  name={hero.name}
                  title={hero.title ?? ""}
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
        <div className="w-full max-w-[700px]">
          <InfoPanel hero={selectedHero} selectedId={selectedId} t={t} />
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
              : "opacity-30 cursor-not-allowed"
          )}
          style={{
            fontSize: "clamp(11px,2vw,13px)",
            letterSpacing: "0.2em",
            padding: "clamp(12px,1.5vw,18px) clamp(20px,4vw,40px)",
            width: "min(420px,100%)",

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
          background: `linear-gradient(90deg, transparent, ${selectedHero.color}40, transparent)`
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