"use client";

import { GamepadIcon, MapIcon, AwardIcon } from "lucide-react";
import { useApp } from "./AppContext";

const icons = [GamepadIcon, MapIcon, AwardIcon];

export default function WhatIsSection() {
  const { t } = useApp();

  return (
    <section className="py-24 px-6 bg-background" id="what-is">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8">
          {t.whatIs.items.map((feature, index) => {
            const Icon = icons[index];
            return (
              <div
                key={index}
                className="glass p-10 rounded-[2.5rem] text-center hover:border-primary/40 transition-all group"
              >
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <Icon className="text-primary w-9 h-9" />
                </div>
                <h3 className="font-display text-2xl text-foreground font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}