"use client";

import { ModeToggle } from "@/components/ui/mode-toggle";
import type { DashStrings, DashLang } from "./dashboard-strings";
import { useRef, useState } from "react";
import { CSSProperties } from "react";

interface DashNavProps {
  t: DashStrings;
  lang: DashLang;
  setLang: (l: DashLang) => void;
  playerName: string;
  playerTitle: string;
  avatarUrl: string;
  level: number;
  kp: number;
  tokens: { used: number; max: number };
}

export function DashNav({
  t,
  lang,
  setLang,
  playerName,
  playerTitle,
  avatarUrl,
  level,
}: DashNavProps) {

  const navRef = useRef<HTMLElement>(null);
  const linkRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  const navLinks = [
    { name: t.nav.dashboard, href: "/home" },
    { name: t.nav.map, href: "/missions" },
    { name: t.nav.stations, href: "/heroes" },
    { name: t.nav.profile, href: "/leaderboard" },
  ];

  const hoverLink = (i: number) => {
    const el = linkRefs.current[i];
    const nav = navRef.current;

    if (!el || !nav) return;

    const nr = nav.getBoundingClientRect();
    const er = el.getBoundingClientRect();

    setIndicator({
      left: er.left - nr.left,
      width: er.width,
    });
  };

  const goldText = {
    background: "var(--grad-gold)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  };
  const langBtnStyle = (active: boolean): CSSProperties =>
    active
      ? {
          background: "var(--grad-gold)",
          backgroundSize: "200% 200%",
          animation: "gold-shimmer 5s ease infinite",
          color: "oklch(0.108 0.018 52)",
          boxShadow:
            "0 3px 12px color-mix(in oklch, var(--primary) 36%, transparent)",
          padding: "6px 12px",
          fontSize: "0.72rem",
          letterSpacing: "0.08em",
          borderRadius: "999px",
          fontWeight: 700,
          border: "none",
          cursor: "pointer",
          transition: "all 0.3s ease",
        }
      : {
          background: "transparent",
          color: "color-mix(in oklch, var(--primary) 65%, transparent)",
          padding: "6px 12px",
          fontSize: "0.72rem",
          letterSpacing: "0.08em",
          borderRadius: "999px",
          fontWeight: 700,
          border: "none",
          cursor: "pointer",
          transition: "all 0.3s ease",
        };

  const LangToggle = () => (
    <div
      className="flex items-center gap-0.5 rounded-full p-0.5"
      style={{
        background: "color-mix(in oklch, var(--background) 35%, transparent)",
        border: "1px solid color-mix(in oklch, var(--primary) 20%, var(--border))",
        backdropFilter: "blur(8px)",
      }}
    >
      {(["mn", "en"] as const).map((lng) => (
        <button
          key={lng}
          onClick={() => setLang(lng)}
          aria-pressed={lang === lng}
          style={langBtnStyle(lang === lng)}
          className="font-display transition-all duration-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          {lng === "mn" ? "МН" : "EN"}
        </button>
      ))}
    </div>
  );
  return (
    <nav className="w-full h-20 flex items-center justify-between px-8 border-b border-primary/20 relative">

      {/* LEFT */}
      <div className="flex items-center gap-6">

        {/* LOGO */}
        <div className="flex items-center gap-3 select-none">
          <span
            className="font-display font-black tracking-tight"
            style={{ fontSize: "1.4rem", ...goldText }}
          >
            MTGA
          </span>

          <div className="h-8 w-px bg-primary/30" />

          <span className="text-xs font-heritage tracking-[0.35em] text-primary/70">
            {t.title}
          </span>
        </div>

        {/* <nav
          ref={navRef}
          className="hidden lg:flex items-center gap-1 relative"
          onMouseLeave={() => setIndicator({ left: 0, width: 0 })}
        >
          <div
            className="absolute top-0 bottom-0 rounded-full transition-all duration-300"
            style={{
              left: indicator.left,
              width: indicator.width,
              background: "color-mix(in oklch, var(--primary) 10%, transparent)",
              border: "1px solid color-mix(in oklch, var(--primary) 25%, transparent)",
              opacity: indicator.width ? 1 : 0,
            }}
          />

          {navLinks.map((link, i) => (
            <a
              key={link.href}
              ref={(el) => {
                linkRefs.current[i] = el;
              }}
              href={link.href}
              onMouseEnter={() => hoverLink(i)}
              className="px-4 py-2 rounded-full text-sm font-display tracking-wide transition-colors"
              style={{
                color: "color-mix(in oklch, var(--foreground) 80%, transparent)",
              }}
            >
              {link.name}
            </a>
          ))}
        </nav> */}
      </div>

      <div className="flex items-center gap-5">
        <div className="flex items-center gap-3">
          <div className="text-right hidden md:block">
            <p className="text-xs font-bold">{playerName}</p>
            <p className="text-[10px] text-primary uppercase tracking-wide">
              {playerTitle}
            </p>
          </div>

          <div className="relative w-11 h-11">
            <img
              src={avatarUrl}
              alt={playerName}
              className="w-full h-full rounded-full object-cover border-2 border-primary shadow-[0_0_15px_rgba(212,175,55,0.4)]"
            />

            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary text-black text-[8px] font-black rounded-full flex items-center justify-center border-2 border-background">
              {level}
            </div>
          </div>
        </div>
        <LangToggle />
        {/* <div
          className="flex items-center gap-1 rounded-full p-1"
          style={{
            background: "var(--grad-gold  )",
            border: "1px solid color-mix(in oklch, var(--primary) 25%, var(--border))",
          }}
        >
          {(["mn", "en"] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className="px-3 py-1 rounded-full text-xs font-display font-bold transition-all"
              style={
                lang === l
                  ? {
                      background: "var(--gold-gradient)",
                      color: "oklch(0.10 0.015 60)",
                      boxShadow:
                        "0 2px 8px color-mix(in oklch, var(--primary) 30%, transparent)",
                    }
                  : {
                      color: "color-mix(in oklch, var(--primary) 60%, transparent)",
                    }
              }
            >
              {l === "mn" ? "МН" : "EN"}
            </button>
          ))}
        </div> */}
        <ModeToggle />
      </div>
    </nav>
  );
}