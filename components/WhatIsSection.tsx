"use client";

import { GamepadIcon, MapIcon, AwardIcon } from "lucide-react";
import { useApp } from "./AppContext";

const ICONS = [GamepadIcon, MapIcon, AwardIcon];
const NUMS  = ["I", "II", "III"];

export default function WhatIsSection() {
  const { t } = useApp();

  return (
    <section
      className="py-20 px-6 lg:px-10 bg-background relative overflow-hidden"
      id="what-is"
    >
      {/* Ambient top glow */}
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
      <div className="text-center mb-20">
        <p
          className="font-display text-[0.62rem] tracking-[0.45em] uppercase mb-5 opacity-55"
          style={{ color: "var(--gold-bright)" }}
        >
          ❖ &nbsp; What Is &nbsp; ❖
        </p>
        <h2
          className="font-display font-bold text-gold uppercase tracking-widest"
          style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.6rem)" }}
        >
          {t.whatIs.heading}
        </h2>
        <p className="font-body text-muted-foreground text-base leading-relaxed">
          {t.whatIs.intro}
        </p>
        <div className="divider-gold w-48 mx-auto mt-6" />
      </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {t.whatIs.items.map((item, i) => {
            const Icon = ICONS[i];
            return (
              <article
                key={i}
                className={`glass-card rounded-[2rem] p-10 lg:p-12 text-center group relative overflow-hidden
                  animate-fade-up delay-${i + 2}`}
                style={{ opacity: 0 }}
              >
                {/* Top accent line */}
                <div className="card-top-line" />

                {/* Roman numeral */}
                <span
                  className="font-display font-bold text-xs tracking-[0.4em] uppercase mb-6 block opacity-35"
                  style={{ color: "var(--gold-bright)" }}
                >
                  {NUMS[i]}
                </span>

                {/* Icon */}
                <div className="icon-vessel w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-8">
                  <Icon className="text-primary w-9 h-9" strokeWidth={1.5} />
                </div>

                {/* Title */}
                <h3 className="font-display font-bold text-foreground text-xl mb-4 leading-snug">
                  {item.title}
                </h3>

                {/* Micro divider */}
                <div
                  className="w-10 h-px mx-auto mb-4 opacity-40"
                  style={{ background: "var(--gold-bright)" }}
                />

                {/* Body */}
                <p className="font-body text-muted-foreground text-base leading-relaxed">
                  {item.description}
                </p>

                {/* Hover inner glow */}
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