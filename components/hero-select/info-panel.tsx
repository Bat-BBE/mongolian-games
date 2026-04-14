"use client";

import { CornerDecos } from "./CornerDecos";
import type { Hero } from "./hero-data";
import type { HeroStrings, Lang } from "./hero-strings";

interface InfoPanelProps {
  hero: Hero;
  lang: Lang;
  t: HeroStrings;
}

export function InfoPanel({ hero, lang, t }: InfoPanelProps) {
  const displayName = lang === "mn" ? hero.nameMn : hero.nameEn;
  const displayTitle = lang === "mn" ? hero.titleMn : hero.titleEn;
  const bio = lang === "mn" ? hero.bioMn : hero.bioEn;

  return (
    <div
      className="relative rounded-2xl p-4 overflow-hidden transition-all duration-500"
      style={{
        background: `linear-gradient(135deg, ${hero.color}08 0%, ${hero.color}10 80%)`,
        border: `1px solid ${hero.color}20`,
        backdropFilter: "blur(20px)",
      }}
    >
      <CornerDecos color={hero.color} />

      <div className="flex items-start justify-between mb-3 gap-3">
        <div className="min-w-0">
          <h3
            className="font-display font-bold tracking-wide leading-tight"
            style={{ fontSize: "clamp(13px,1.9vw,17px)", color: hero.color }}
          >
            {displayName}
          </h3>
          <p
            className="font-heritage italic text-[10px] tracking-[0.2em] uppercase mt-1 truncate"
            style={{ color: hero.color }}
            title={displayTitle}
          >
            {displayTitle}
          </p>
        </div>

        {!hero.available && (
          <span
            className="font-display text-[9px] tracking-[0.3em] uppercase px-3 py-1 rounded-sm shrink-0"
            style={{ color: "rgba(255,255,255,0.3)", border: "1px solid rgba(255,255,255,0.12)" }}
          >
            🔒 {t.locked}
          </span>
        )}
      </div>

      {bio.trim() ? (
        <p
          className="text-[11px] sm:text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap"
          style={{ borderLeft: `2px solid ${hero.color}55`, paddingLeft: "10px" }}
        >
          {bio.trim()}
        </p>
      ) : null}
    </div>
  );
}
