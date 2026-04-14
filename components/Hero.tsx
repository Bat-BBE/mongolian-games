"use client";

import { useApp } from "./AppContext";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";

function Particle({ style }: { style: React.CSSProperties }) {
  return (
    <div
      className="absolute rounded-full pointer-events-none"
      style={{
        background: "var(--gold-bright)",
        ...style,
      }}
    />
  );
}

const PARTICLES = [
  {
    width: 2,
    height: 2,
    left: "8%",
    top: "22%",
    opacity: 0.18,
    animationDuration: "4.2s",
    animationDelay: "0s",
  },
  {
    width: 3,
    height: 3,
    left: "20%",
    top: "60%",
    opacity: 0.12,
    animationDuration: "5.5s",
    animationDelay: "0.6s",
  },
  {
    width: 2,
    height: 2,
    left: "34%",
    top: "35%",
    opacity: 0.15,
    animationDuration: "3.8s",
    animationDelay: "1.1s",
  },
  {
    width: 2,
    height: 2,
    left: "55%",
    top: "18%",
    opacity: 0.1,
    animationDuration: "6.0s",
    animationDelay: "0.4s",
  },
  {
    width: 3,
    height: 3,
    left: "72%",
    top: "50%",
    opacity: 0.16,
    animationDuration: "4.8s",
    animationDelay: "1.8s",
  },
  {
    width: 2,
    height: 2,
    left: "85%",
    top: "28%",
    opacity: 0.13,
    animationDuration: "5.1s",
    animationDelay: "0.9s",
  },
  {
    width: 2,
    height: 2,
    left: "91%",
    top: "70%",
    opacity: 0.11,
    animationDuration: "4.5s",
    animationDelay: "2.2s",
  },
  {
    width: 3,
    height: 3,
    left: "46%",
    top: "78%",
    opacity: 0.14,
    animationDuration: "5.8s",
    animationDelay: "1.4s",
  },
];

export default function Hero() {
  const { t, setHeroSelectOpen } = useApp();
  const { theme } = useTheme();
  const [overlayColor, setOverlayColor] = useState("transparent");

  useEffect(() => {
    if (theme === "dark") {
      setOverlayColor(
        "linear-gradient(180deg, rgba(8,6,3,0.30) 0%, rgba(8,6,3,0.60) 55%, rgba(5,4,2,1) 100%)",
      );
    } else {
      setOverlayColor(
        "linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 55%, rgba(255,255,255,0) 100%)",
      );
    }
  }, [theme]);

  return (
    <section
      className="hero-section relative flex items-start justify-center overflow-hidden pt-16 sm:pt-20 md:pt-24 pb-8 sm:pb-10"
      style={{ minHeight: "100svh" }}
    >
      <div className="absolute inset-0" style={{ background: overlayColor }} />

      <div
        className="ambient-glow absolute bottom-0 left-1/2 -translate-x-1/2"
        style={{
          width: 700,
          height: 350,
          background:
            "radial-gradient(ellipse, rgba(201,168,76,0.16) 0%, transparent 70%)",
        }}
      />

      {PARTICLES.map((p, i) => (
        <Particle
          key={i}
          style={{
            width: p.width,
            height: p.height,
            left: p.left,
            top: p.top,
            opacity: p.opacity,
            animation: `float ${p.animationDuration} ease-in-out infinite`,
            animationDelay: p.animationDelay,
          }}
        />
      ))}

      <div className="relative z-10 text-center px-4 sm:px-6 flex flex-col items-center w-full">
        <p
          className="font-body italic text-[0.48rem] sm:text-[0.62rem] tracking-[0.2em] sm:tracking-[0.4em] uppercase mb-4 mt-2 opacity-0 animate-fade-in delay-1 whitespace-nowrap"
          style={{
            color: "color-mix(in oklch, var(--gold-light, #EDD98A) 88%, white)",
          }}
        >
          ⚔&nbsp;&nbsp;Монгол Домог · Mongol Legend&nbsp;&nbsp;⚔
        </p>

        <h1
          className="font-display font-black leading-tight md:leading-[0.9] mb-4 opacity-0 animate-fade-up delay-2 max-w-3xl mx-auto text-[oklch(0.97_0.012_78)] dark:text-[oklch(0.96_0.02_82)]"
          style={{
            fontSize: "clamp(38px, 8.5vw, 88px)",
            textShadow: "0 0 80px rgba(180,148,55,0.22)",
            letterSpacing: "-0.01em",
          }}
        >
          {t.hero.title1}
        </h1>
        <h1
          className="font-display font-black leading-tight md:leading-[0.9] mb-8 opacity-0 animate-fade-up delay-3 max-w-3xl mx-auto"
          style={{
            fontSize: "clamp(38px, 8.5vw, 88px)",
            letterSpacing: "-0.01em",
          }}
        >
          <span className="text-gold">{t.hero.title2}</span>
        </h1>

        <div className="flex items-center gap-5 mb-8 opacity-0 animate-fade-in delay-4">
          <div
            className="w-28 h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent, var(--gold-bright))",
            }}
          />
          <span
            className="font-display text-sm"
            style={{ color: "var(--gold-bright)" }}
          >
            ❖
          </span>
          <div
            className="w-28 h-px"
            style={{
              background:
                "linear-gradient(90deg, var(--gold-bright), transparent)",
            }}
          />
        </div>

        <p className="font-body text-gold max-w-xl mx-auto mb-8 leading-relaxed text-xs sm:text-sm opacity-0 animate-fade-up delay-4">
          {t.hero.subtitle}
        </p>

        <button
          onClick={() => setHeroSelectOpen(true)}
          className="btn-gold px-14 py-4 rounded-full text-sm opacity-0 animate-scale-in delay-5 relative overflow-hidden"
        >
          <span className="relative z-10 flex items-center gap-3">
            <span className="text-base leading-none">⚔</span>
            <span>{t.hero.cta}</span>
            <span className="text-base leading-none">⚔</span>
          </span>
        </button>

        <p className="mt-5 font-body font-medium text-[0.4rem] uppercase tracking-[0.45em] opacity-30 opacity-0 animate-fade-in delay-7">
          {t.hero.free}
        </p>
      </div>

      <div className="hidden sm:flex absolute bottom-8 left-1/2 -translate-x-1/2 flex-col items-center gap-2 opacity-35 animate-float pointer-events-none">
        <div
          className="w-px h-12"
          style={{
            background:
              "linear-gradient(180deg, transparent, var(--gold-bright))",
          }}
        />
        <div
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: "var(--gold-bright)" }}
        />
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, transparent, var(--background))",
        }}
      />
    </section>
  );
}
