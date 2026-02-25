"use client";
// HeroToast.tsx — bottom notification toast

import { cn } from "@/lib/utils";

interface HeroToastProps {
  msg: string;
  visible: boolean;
}

export function HeroToast({ msg, visible }: HeroToastProps) {
  return (
    <div
      className={cn(
        "fixed bottom-10 left-1/2 -translate-x-1/2 z-[300] pointer-events-none",
        "font-display text-xs tracking-[0.2em] px-7 py-3 border",
        "transition-all duration-300",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
      )}
      style={{
        background: "rgba(8,5,20,0.96)",
        borderColor: "var(--gold-main)",
        color: "var(--gold-light, #F1D592)",
        boxShadow: "0 0 20px rgba(200,168,75,0.25)",
      }}
    >
      {msg}
    </div>
  );
}