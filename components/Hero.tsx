"use client";

import { useApp } from "./AppContext";

export default function Hero() {
  const { t, setHeroSelectOpen } = useApp();

  return (
    <section className="h-screen relative flex items-center justify-center bg-cover bg-center hero-bg overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-ping"
            style={{
              width: `${2 + (i % 3)}px`,
              height: `${2 + (i % 3)}px`,
              background: "var(--gold-main)",
              left: `${10 + i * 12}%`,
              top: `${20 + (i % 4) * 15}%`,
              opacity: 0.15 + (i % 3) * 0.08,
              animationDuration: `${3 + i * 0.7}s`,
              animationDelay: `${i * 0.4}s`,
            }}
          />
        ))}
      </div>

      <div className="text-center z-10 px-6 animate-fade-up">
        <p
          className="font-heritage italic text-xs tracking-[0.45em] uppercase mb-6 opacity-70"
          style={{ color: "var(--gold-light, #F1D592)" }}
        >
          ⚔ Монгол Домог · Mongol Legend ⚔
        </p>

        <h1 className="font-display font-black text-white leading-none mb-6"
          style={{ fontSize: "clamp(48px, 9vw, 90px)", textShadow: "0 0 60px rgba(200,168,75,0.35)" }}
        >
          {t.hero.title1}
          <br />
          <span className="text-gradient-gold">{t.hero.title2}</span>
        </h1>

        <div className="flex items-center justify-center gap-4 mb-6 opacity-40">
          <div className="w-24 h-px" style={{ background: "linear-gradient(90deg, transparent, var(--gold-main))" }} />
          <span className="font-display text-sm" style={{ color: "var(--gold-main)" }}>◆</span>
          <div className="w-24 h-px" style={{ background: "linear-gradient(90deg, var(--gold-main), transparent)" }} />
        </div>

        <p className="text-slate-300 max-w-lg mx-auto mb-10 font-heritage text-base leading-relaxed">
          {t.hero.subtitle}
        </p>

        <button
          onClick={() => setHeroSelectOpen(true)}
          className="btn-gold font-display font-black uppercase tracking-[0.25em] px-14 py-5 rounded-full text-base relative overflow-hidden group"
        >
          <span className="relative z-10 flex items-center gap-3">
            <span>⚔</span>
            <span>{t.hero.cta}</span>
            <span>⚔</span>
          </span>
        </button>

        <p
          className="mt-6 text-[10px] uppercase tracking-[0.4em] opacity-40 font-display"
          style={{ color: "var(--gold-light, #F1D592)" }}
        >
          {t.hero.free}
        </p>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, transparent, var(--bg-abyss, #050608))" }}
      />
    </section>
  );
}