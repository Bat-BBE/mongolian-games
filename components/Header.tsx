"use client";

import { ModeToggle } from "./ui/mode-toggle";
import Link from "next/link";
import { useApp } from "./AppContext";

export default function Header() {
  const { t, language, setLanguage } = useApp();

  return (
    <header className="fixed top-0 w-full z-50 backdrop-blur-md border-b border-border px-6 py-4 flex justify-between items-center"
      style={{ background: "color-mix(in oklch, var(--background) 70%, transparent)" }}
    >
      <Link href="/" className="flex items-center space-x-4 hover:opacity-80 transition-opacity">
        <div className="relative">
          <span
            className="text-2xl font-display font-black tracking-tighter"
            style={{ color: "var(--gold-main)" }}
          >
            MTGA
          </span>
          <div
            className="absolute -bottom-0.5 left-0 right-0 h-px"
            style={{ background: "linear-gradient(90deg, transparent, var(--gold-main), transparent)" }}
          />
        </div>
        <div
          className="hidden lg:block w-px h-5 opacity-30"
          style={{ background: "var(--gold-main)" }}
        />
        <span className="hidden lg:block font-heritage text-sm text-foreground/70 italic tracking-wide">
          {t.nav.title}
        </span>
      </Link>

      <div className="flex items-center gap-3">
        <div
          className="flex items-center gap-1 rounded-full p-1"
          style={{
            background: "color-mix(in oklch, var(--background) 30%, transparent)",
            border: "1px solid color-mix(in oklch, var(--primary) 25%, var(--border))",
          }}
        >
          {(["mn", "en"] as const).map((lng) => (
            <button
              key={lng}
              onClick={() => setLanguage(lng)}
              className="px-3 py-1 rounded-full text-xs font-display font-bold transition-all duration-200"
              style={
                language === lng
                  ? {
                      background: "var(--gold-gradient)",
                      color: "oklch(0.10 0.015 60)",
                      boxShadow: "0 2px 8px color-mix(in oklch, var(--primary) 30%, transparent)",
                    }
                  : { color: "color-mix(in oklch, var(--primary) 60%, transparent)" }
              }
            >
              {lng === "mn" ? "МН" : "EN"}
            </button>
          ))}
        </div>

        <ModeToggle />
      </div>
    </header>
  );
}