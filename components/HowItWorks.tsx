"use client";

import { useApp } from "./AppContext";

export default function HowItWorks() {
  const { t } = useApp();

  return (
    <section
      className="relative isolate overflow-hidden border-t border-border/45 bg-background py-28 px-6 lg:px-10"
      id="how-it-works"
    >
      <div
        className="ambient-glow absolute bottom-0 right-0"
        style={{
          width: 500,
          height: 500,
          background:
            "radial-gradient(ellipse, color-mix(in oklch, var(--primary) 13%, transparent) 0%, color-mix(in oklch, var(--gold-bright) 10%, transparent) 35%, transparent 72%)",
        }}
      />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-5">
          <p
            className="font-display text-[0.62rem] tracking-[0.45em] uppercase mb-5 opacity-55"
            style={{ color: "var(--gold-bright)" }}
          >
            ❖ &nbsp; Process &nbsp; ❖
          </p>
          <h2
            className="font-display font-bold text-gold uppercase tracking-widest"
            style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)" }}
          >
            {t.howItWorks.heading}
          </h2>
          <p className="font-body text-muted-foreground text-sm leading-relaxed">
            {t.whatIs.intro}
          </p>
          <div className="divider-gold w-48 mx-auto mt-4" />
        </div>

        <div className="relative grid md:grid-cols-3 gap-12 lg:gap-16">
          <div
            className="hidden md:block absolute top-[3.5rem] left-[calc(16.66%+2rem)] right-[calc(16.66%+2rem)] h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent, color-mix(in oklch, var(--primary) 45%, transparent), transparent)",
            }}
          />

          {t.howItWorks.steps.map((step, i) => (
            <div
              key={i}
              className={`flex flex-col items-center text-center animate-fade-up delay-${i + 2}`}
              style={{ opacity: 0 }}
            >
              <div
                className="step-num w-18 h-18 rounded-full flex items-center justify-center mb-6 text-xl font-black relative z-10"
              >
                {step.number}
              </div>

              <h4 className="font-display font-semibold text-foreground text-lg mb-4 tracking-wide">
                {step.title}
              </h4>

              <div
                className="w-20 h-px mb-4 opacity-70"
                style={{ background: "var(--gold-bright)" }}
              />

              <p className="font-body text-muted-foreground text-sm leading-relaxed max-w-xs">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}