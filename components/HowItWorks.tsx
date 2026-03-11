"use client";

import { useApp } from "./AppContext";

export default function HowItWorks() {
  const { t } = useApp();

  return (
    <section
      className="py-28 px-6 lg:px-10 bg-background relative overflow-hidden"
      id="how-it-works"
    >
      {/* Faint ambient glow */}
      <div
        className="ambient-glow absolute bottom-0 right-0"
        style={{
          width: 500,
          height: 500,
          background:
            "radial-gradient(ellipse, color-mix(in oklch, var(--primary) 6%, transparent) 0%, transparent 70%)",
        }}
      />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Heading */}
        <div className="text-center mb-20">
          <p
            className="font-display text-[0.62rem] tracking-[0.45em] uppercase mb-5 opacity-55"
            style={{ color: "var(--gold-bright)" }}
          >
            ❖ &nbsp; Process &nbsp; ❖
          </p>
          <h2
            className="font-display font-bold text-gold uppercase tracking-widest"
            style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.6rem)" }}
          >
            {t.howItWorks.heading}
          </h2>
          <div className="divider-gold w-48 mx-auto mt-6" />
        </div>

        {/* Steps */}
        <div className="relative grid md:grid-cols-3 gap-12 lg:gap-16">
          {/* Connecting line (desktop) */}
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
              {/* Step circle */}
              <div
                className="step-num w-20 h-20 rounded-full flex items-center justify-center mb-8 text-2xl font-black relative z-10"
              >
                {step.number}
              </div>

              {/* Title */}
              <h4 className="font-display font-semibold text-foreground text-lg mb-3 tracking-wide">
                {step.title}
              </h4>

              {/* Micro rule */}
              <div
                className="w-8 h-px mb-4 opacity-45"
                style={{ background: "var(--gold-bright)" }}
              />

              {/* Desc */}
              <p className="font-body text-muted-foreground text-base leading-relaxed max-w-xs">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}