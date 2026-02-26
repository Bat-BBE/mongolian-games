"use client";
// InfoPanel.tsx — hero name, role, locked badge, and stat bars

import { StatBar } from "./StatBar";
import { CornerDecos } from "./CornerDecos";
import type { Hero } from "./hero-data";
import type { HeroId, HeroStrings } from "./hero-strings";

interface InfoPanelProps {
  hero: Hero;
  selectedId: HeroId;
  t: HeroStrings;
}

export function InfoPanel({ hero, selectedId, t }: InfoPanelProps) {
  return (
    <div
      className="relative rounded-2xl p-5 overflow-hidden transition-all duration-500"
      style={{
        background: `linear-gradient(135deg, ${hero.color}08 0%, ${hero.color}10 80%)`,
        border: `1px solid ${hero.color}20`,
        backdropFilter: "blur(20px)",
      }}
    >
      <CornerDecos color={hero.color} />

      <div className="flex items-start justify-between mb-4">
        <div>
          <h3
            className="font-display font-bold tracking-wide leading-tight"
            style={{ fontSize: "clamp(14px,2.2vw,19px)", color: hero.color }}
          >
            {t.name[selectedId]}
          </h3>
          <p
            className="font-heritage italic text-[10px] tracking-[0.2em] uppercase mt-1"
            style={{ color: hero.color }}
          >
            {t.role[selectedId]}
          </p>
        </div>

        {!hero.available && (
          <span
            className="font-display text-[9px] tracking-[0.3em] uppercase px-3 py-1 rounded-sm"
            style={{ color: "rgba(255,255,255,0.3)", border: "1px solid rgba(255,255,255,0.12)" }}
          >
            🔒 {t.locked}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <StatBar label={t.wisdom}   value={hero.stats.wisdom}   color={hero.color} />
        <StatBar label={t.strength} value={hero.stats.strength} color={hero.color} />
        <StatBar label={t.speed}    value={hero.stats.speed}    color={hero.color} />
      </div>
    </div>
  );
}