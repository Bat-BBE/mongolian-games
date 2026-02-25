"use client";

import { useApp } from "./AppContext";

export default function CTA() {
  const { t } = useApp();

  return (
    <section className="py-40 px-6 text-center relative overflow-hidden bg-background">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-[80%] h-[200%] bg-[radial-gradient(ellipse,color-mix(in_oklch,var(--primary)_10%,transparent)_0%,transparent_70%)]" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">

        <h2 className="font-display text-5xl md:text-5xl font-black mb-12 leading-tight text-foreground">
          {t.cta.heading1}
          <br />
          <span className="text-gradient-gold">
            {t.cta.heading2}
          </span>
        </h2>

        <button className="btn-gold px-16 py-8 text-xl rounded-full flex items-center gap-4 mx-auto">
          <span>{t.cta.button}</span>
        </button>

        <p className="mt-12 text-muted-foreground uppercase tracking-[0.5em] text-[10px] font-bold">
          {t.cta.note}
        </p>

      </div>
    </section>
  );
}