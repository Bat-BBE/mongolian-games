"use client";

import {
  LuGamepad2 as GamepadIcon,
  LuMap as MapIcon,
  LuAward as AwardIcon,
  LuBrain as BrainIcon,
  LuGlobe as GlobeIcon,
  LuBookOpen as BookOpenIcon,
} from "react-icons/lu";

import { useApp } from "./AppContext";

const ICONS = [
  GamepadIcon,
  MapIcon,
  AwardIcon,
  BrainIcon,
  GlobeIcon,
  BookOpenIcon,
];

const NUMS = ["I", "II", "III", "IV", "V", "VI"];

export default function WhatIsSection() {
  const { t } = useApp();

  return (
    <section
      className="py-20 px-6 lg:px-10 bg-background relative overflow-hidden"
      id="what-is"
    >
      <div
        className="ambient-glow absolute top-0 left-1/2 -translate-x-1/2"
        style={{
          width: 800,
          height: 400,
          background:
            "radial-gradient(ellipse, color-mix(in oklch, var(--primary) 7%, transparent) 0%, transparent 70%)",
          animationDelay: "1s",
        }}
      />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-10">
          <p
            className="font-display text-[0.62rem] tracking-[0.45em] uppercase mb-3 opacity-55"
            style={{ color: "var(--gold-bright)" }}
          >
            ❖ &nbsp; About &nbsp; ❖
          </p>

          <h2
            className="font-display font-bold text-gold uppercase tracking-widest"
            style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)" }}
          >
            {t.whatIs.heading}
          </h2>

          <p className="font-body text-muted-foreground text-sm leading-relaxed max-w-6xl mx-auto">
            {t.whatIs.intro}
          </p>

          <div className="divider-gold w-48 mx-auto mt-4" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {t.whatIs.items.map((item, i) => {
            const Icon = ICONS[i];

            return (
              <article
                key={i}
                className={`glass-card rounded-[2rem] px-1 py-3 text-center group relative overflow-hidden
                animate-fade-up delay-${i + 2}`}
                style={{ opacity: 0 }}
              >
                <div className="card-top-line" />

                <span
                  className="font-display font-bold text-xs tracking-[0.4em] uppercase mb-6 block"
                  style={{ color: "var(--gold-bright)" }}
                >
                  {NUMS[i]}
                </span>

                <div className="icon-vessel w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  {Icon && <Icon className="text-primary w-8 h-8" strokeWidth={1.5} />}
                </div>

                <h3 className="font-display font-bold text-foreground text-lg mb-4 leading-snug">
                  {item.title}
                </h3>

                <div
                  className="w-20 h-px mx-auto mb-4 opacity-70"
                  style={{ background: "var(--gold-bright)" }}
                />

                <p className="font-body text-muted-foreground text-sm leading-relaxed">
                  {item.description}
                </p>

                <div
                  className="absolute inset-0 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{
                    background:
                      "radial-gradient(ellipse 80% 50% at 50% 0%, color-mix(in oklch, var(--primary) 8%, transparent), transparent)",
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