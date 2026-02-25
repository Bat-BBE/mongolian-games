"use client";

import { Dices, Target, Zap, Trophy } from "lucide-react";
import { useApp } from "./AppContext";

const icons = [Dices, Target, Zap, Trophy];

export default function GamesSection() {
  const { t } = useApp();

  return (
    <section className="py-32 px-6 relative glow-gold bg-background" id="games">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-primary/5 blur-[80px]" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16 animate-fade-up">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-gradient-gold uppercase tracking-widest section-heading">
            {t.games.heading}
          </h2>
          <div className="gold-divider w-40 mx-auto mt-6" />
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {t.games.items.map((game, index) => {
            const Icon = icons[index];
            return (
              <div
                key={game.name}
                className={`
                  group relative glass card-light
                  p-8 rounded-3xl overflow-hidden
                  animate-fade-up delay-${index + 1}
                  cursor-pointer
                `}
              >
                {/* Card inner glow on hover */}
                <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{
                    background: "radial-gradient(ellipse 80% 60% at 50% 0%, color-mix(in oklch, var(--primary) 10%, transparent), transparent)"
                  }}
                />

                {/* Top ornament line */}
                <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

                {/* Icon */}
                <div className="icon-gold w-14 h-14 mb-6 flex items-center justify-center rounded-2xl">
                  <Icon className="text-primary w-7 h-7 transition-colors duration-300" />
                </div>

                {/* Content */}
                <h3 className="font-display text-xl font-semibold mb-3 text-foreground group-hover:text-gradient-gold transition-all duration-300">
                  {game.name}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {game.desc}
                </p>

                {/* Bottom accent */}
                <div className="absolute bottom-0 left-8 right-8 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: "linear-gradient(90deg, transparent, var(--gold-main), transparent)"
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}