"use client";

import { Dices, Target, Zap, Trophy } from "lucide-react";
import { useApp } from "./AppContext";

const ICONS = [Dices, Target, Zap, Trophy];
const LABELS = ["01", "02", "03", "04"];

export default function GamesSection() {
  const { t } = useApp();

  return (
    <section
      className="py-32 px-6 lg:px-10 relative overflow-hidden bg-background"
      id="games"
    >
      {/* Ambient glow */}
      <div
        className="ambient-glow absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none"
        style={{
          width: 900,
          height: 450,
          background:
            "radial-gradient(ellipse, color-mix(in oklch, var(--primary) 8%, transparent) 0%, transparent 65%)",
        }}
      />

      {/* Grain overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")",
        }}
      />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Heading */}
        <div className="text-center mb-16 animate-fade-up" style={{ opacity: 0 }}>
          <p
            className="font-display text-[0.62rem] tracking-[0.45em] uppercase mb-5 opacity-55"
            style={{ color: "var(--gold-bright)" }}
          >
            ❖ &nbsp; Gameplay &nbsp; ❖
          </p>
          <h2
            className="font-display font-bold text-gold ornament uppercase tracking-widest"
            style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.6rem)" }}
          >
            {t.games.heading}
          </h2>
          <div className="divider-gold-solid w-48 mx-auto mt-6" />
        </div>

        {/* Game cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {t.games.items.map((game, i) => {
            const Icon = ICONS[i];
            return (
              <article
                key={game.name}
                className={`glass-card group relative rounded-[1.75rem] overflow-hidden cursor-pointer animate-fade-up delay-${i + 2}`}
                style={{ opacity: 0 }}
              >
                {/* Card inner hover glow */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-[1.75rem]"
                  style={{
                    background:
                      "radial-gradient(ellipse 90% 55% at 50% 0%, color-mix(in oklch, var(--primary) 10%, transparent), transparent)",
                  }}
                />

                {/* Top accent line */}
                <div
                  className="absolute top-0 left-8 right-8 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, var(--gold-bright), transparent)",
                  }}
                />

                <div className="p-8 lg:p-9 relative z-10">
                  {/* Number + Icon row */}
                  <div className="flex justify-between items-start mb-6">
                    <span
                      className="font-display font-black text-xs tracking-[0.3em] opacity-30"
                      style={{ color: "var(--gold-bright)" }}
                    >
                      {LABELS[i]}
                    </span>
                    <div className="icon-vessel w-12 h-12 rounded-xl flex items-center justify-center">
                      <Icon
                        className="text-primary transition-colors duration-300"
                        strokeWidth={1.5}
                        style={{ width: "1.35rem", height: "1.35rem" }}
                      />
                    </div>
                  </div>

                  {/* Name */}
                  <h3 className="font-display font-semibold text-lg mb-3 leading-snug text-foreground group-hover:text-primary transition-colors duration-300">
                    {game.name}
                  </h3>

                  {/* Desc */}
                  <p className="font-body text-sm leading-relaxed text-muted-foreground">
                    {game.desc}
                  </p>

                  {/* Bottom border reveal */}
                  <div
                    className="absolute bottom-0 left-8 right-8 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                      background:
                        "linear-gradient(90deg, transparent, color-mix(in oklch, var(--primary) 50%, transparent), transparent)",
                    }}
                  />
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}