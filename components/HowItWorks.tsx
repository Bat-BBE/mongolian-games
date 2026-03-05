"use client";

import { useApp } from "./AppContext";

export default function HowItWorks() {
  const { t } = useApp();

  return (
    <section 
      className="py-24 px-6 relative bg-background"
      id="how-it-works"
    >
      <div className="max-w-7xl mx-auto relative">
        <div className="text-center mb-10">
          <h2 className="font-display text-3xl font-bold text-gradient-gold uppercase tracking-widest">
            {t.howItWorks.heading}
          </h2>
          <div className="gold-divider w-40 mx-auto mt-6" />
        </div>

        <div className="relative">
          <div className="hidden md:block absolute top-1/2 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent -translate-y-1/2"></div>

          <div className="grid md:grid-cols-3 gap-12 relative z-10">
            {t.howItWorks.steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center mx-auto mb-6 font-display text-2xl font-bold text-foreground">
                  {step.number}
                </div>
                <h4 className="font-display text-foreground text-xl mb-2">{step.title}</h4>
                <p className="text-muted-foreground text-sm">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}