"use client";

import { Dices, Target, Zap, Trophy, Swords, Gamepad2 } from "lucide-react";
import { useApp } from "./AppContext";

const ICONS = [Dices, Target, Zap, Trophy, Swords, Gamepad2];

export default function GamesSection() {
  const { t } = useApp();

  return (
    <section
      className="relative py-24 px-6 lg:px-10 overflow-hidden bg-background"
      id="games"
    >
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none"
        style={{
          width: 900,
          height: 500,
          background:
            "radial-gradient(ellipse, color-mix(in oklch, var(--primary) 10%, transparent) 0%, transparent 65%)",
        }}
      />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-5 animate-fade-up">
          <p
            className="font-display text-[0.62rem] tracking-[0.45em] uppercase mb-3 opacity-55"
            style={{ color: "var(--gold-bright)" }}
          >
            ❖ &nbsp; Gameplay &nbsp; ❖
          </p>

          <h2
            className="font-display font-bold uppercase tracking-widest text-gold"
            style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)" }}
          >
            {t.games.heading}
          </h2>

          {t.games.intro && (
            <p className="text-muted-foreground font-body text-sm leading-relaxed">
              {t.games.intro}
            </p>
          )}

          <div className="divider-gold-solid w-48 mx-auto mt-4" />
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
          {t.games.items.map((game, i) => {
            const Icon = ICONS[i % ICONS.length];

            return (
              <article
                key={game.name}
                className="glass-card group relative rounded-[1.75rem] overflow-hidden transition-all duration-500 hover:-translate-y-2"
              >
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{
                    background:
                      "radial-gradient(ellipse 90% 55% at 50% 0%, color-mix(in oklch, var(--primary) 12%, transparent), transparent)",
                  }}
                />

                <div
                  className="absolute top-0 left-8 right-8 h-px opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, var(--gold-bright), transparent)",
                  }}
                />

                <div className="p-5 relative z-10">

                  <div className="flex justify-between items-start mb-4">
                    <span
                      className="font-display font-black text-xs tracking-[0.35em]"
                      style={{ color: "var(--gold-bright)" }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>

                    <div className="icon-vessel w-12 h-12 rounded-xl flex items-center justify-center">
                      <Icon
                        className="text-primary transition-colors duration-300"
                        strokeWidth={1.6}
                        style={{ width: "1.4rem", height: "1.4rem" }}
                      />
                    </div>
                  </div>

                  <h3 className="font-display font-semibold text-lg mb-3 leading-snug text-foreground group-hover:text-primary transition-colors">
                    {game.name}
                  </h3>

                  <p className="font-body text-sm leading-relaxed text-muted-foreground">
                    {game.desc}
                  </p>
                </div>

                <div
                  className="absolute bottom-0 left-8 right-8 h-px opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, color-mix(in oklch, var(--primary) 50%, transparent), transparent)",
                  }}
                />
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}