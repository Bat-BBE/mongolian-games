"use client";

import { LuCircleCheckBig as CheckCircle2 } from "react-icons/lu";
import { useApp } from "./AppContext";

export default function Features() {
  const { t } = useApp();

  return (
    <section
      className="py-20 px-6 lg:px-10 bg-background relative overflow-hidden"
      id="features"
    >
      <div
        className="ambient-glow absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: 900,
          height: 300,
          background:
            "radial-gradient(ellipse, color-mix(in oklch, var(--primary) 6%, transparent) 0%, transparent 65%)",
        }}
      />
      <div className="text-center mb-10">
        <p
          className="font-display text-[0.62rem] tracking-[0.45em] uppercase mb-3 opacity-55"
          style={{ color: "var(--gold-bright)" }}
        >
          ❖ &nbsp; Features &nbsp; ❖
        </p>
        <h2
          className="font-display font-bold text-gold uppercase tracking-widest"
          style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)" }}
        >
          {t.features.heading}
        </h2>
        <p className="font-body text-muted-foreground text-sm leading-relaxed">
          {t.features.intro}
        </p>

        <div className="divider-gold w-48 mx-auto mt-4" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {t.features.items.map((feature, i) => (
            <div
              key={i}
              className={`flex items-center gap-5 group animate-fade-up delay-${i + 2}`}
              style={{ opacity: 0 }}
            >
              <div className="icon-vessel shrink-0 w-12 h-12 rounded-xl flex items-center justify-center mt-0.5">
                <CheckCircle2 className="text-primary w-5 h-5" strokeWidth={1.5} />
              </div>

              <div>
                <p
                  className="font-display text-foreground text-sm lg:text-base group-hover:text-gold transition-all duration-300 leading-snug"
                >
                  {feature}
                </p>
                <div
                  className="mt-2 h-px w-0 group-hover:w-full transition-all duration-500 opacity-40"
                  style={{ background: "var(--gold-bright)" }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="divider-gold w-full mt-14" />
    </section>
  );
}