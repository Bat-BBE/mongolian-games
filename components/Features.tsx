"use client";

import { CheckCheckIcon } from "lucide-react";
import { useApp } from "./AppContext";

export default function Features() {
  const { t } = useApp();

  return (
    <section className="py-24 px-6 bg-background relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[200%] bg-[radial-gradient(ellipse,color-mix(in_oklch,var(--primary)_6%,transparent)_0%,transparent_70%)]" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid md:grid-cols-3 gap-8">
          {t.features.items.map((feature, index) => (
            <div
              key={index}
              className="flex items-center gap-5 group animate-fade-up"
              style={{ animationDelay: `${index * 0.12}s`, opacity: 0 }}
            >
              {/* Icon */}
              <div className="shrink-0 w-12 h-12 rounded-xl icon-gold flex items-center justify-center">
                <CheckCheckIcon className="text-primary w-6 h-6" />
              </div>

              {/* Text */}
              <span className="font-display text-lg font-semibold text-foreground group-hover:text-primary transition-colors duration-300">
                {feature}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}