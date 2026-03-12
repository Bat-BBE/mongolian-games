"use client";

import { ModeToggle } from "@/components/ui/mode-toggle";
import type { DashStrings, DashLang } from "./dashboard-strings";
import { useRef, useState, CSSProperties } from "react";

interface DashNavProps {
  t: DashStrings;
  lang: DashLang;
  setLang: (l: DashLang) => void;
  playerName: string;
  playerTitle: string;
  avatarUrl: string;
  level: number;
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

  const goldText = {
    background: "var(--grad-gold)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  };

  const langBtnStyle = (active: boolean): CSSProperties =>
    active
      ? {
          background: "var(--grad-gold)",
          color: "oklch(0.108 0.018 52)",
          padding: "clamp(4px,0.5vw,6px) clamp(8px,1vw,12px)",
          fontSize: "clamp(10px,0.7vw,12px)",
          letterSpacing: "0.08em",
          borderRadius: "999px",
          fontWeight: 700,
          border: "none",
          cursor: "pointer",
        }
      : {
          background: "transparent",
          color: "color-mix(in oklch, var(--primary) 65%, transparent)",
          padding: "clamp(4px,0.5vw,6px) clamp(8px,1vw,12px)",
          fontSize: "clamp(10px,0.7vw,12px)",
          letterSpacing: "0.08em",
          borderRadius: "999px",
          fontWeight: 700,
          border: "none",
          cursor: "pointer",
        };

  const LangToggle = () => (
    <div
      className="flex items-center gap-[2px] rounded-full p-[2px]"
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
          className="font-display transition-all duration-300"
        >
          {lng === "mn" ? "МН" : "EN"}
        </button>
      ))}
    </div>
  );

  return (
    <nav
      ref={navRef}
      className="w-full flex items-center justify-between border-b border-primary/20"
      style={{
        height: "clamp(56px,6vw,76px)",
        padding: "0 clamp(12px,3vw,40px)",
      }}
    >
      <div className="flex items-center gap-[clamp(10px,2vw,24px)]">

        <div className="flex items-center gap-[clamp(8px,1vw,14px)] select-none">

          <span
            className="font-display font-black tracking-tight"
            style={{
              fontSize: "clamp(18px,2vw,26px)",
              ...goldText,
            }}
          >
            MTGA
          </span>

          <div
            style={{
              height: "clamp(20px,2vw,30px)",
              width: "1px",
              background: "color-mix(in oklch,var(--primary)40%,transparent)",
            }}
          />

          <span
            className="font-heritage uppercase hidden sm:block"
            style={{
              fontSize: "clamp(8px, 1vw,11px)",
              letterSpacing: "0.3em",
              color: "color-mix(in oklch,var(--primary)70%,transparent)",
            }}
          >
            {t.title}
          </span>

        </div>
      </div>

      <div className="flex items-center gap-[clamp(8px,1.2vw,16px)]">
        <div className="flex items-center gap-[clamp(6px,1vw,12px)]">

          <div className="text-right hidden sm:block">
            <p
              className="font-bold"
              style={{
                color: "var(--foreground)",
                fontSize: "clamp(11px,0.9vw,14px)",
              }}
            >
              {playerName}
            </p>

            <p
              className="uppercase"
              style={{
                fontSize: "clamp(8px,0.7vw,11px)",
                letterSpacing: "0.08em",
                color: "color-mix(in oklch,var(--primary)90%,transparent)",
              }}
            >
              {playerTitle}
            </p>
          </div>

          <div
            className="relative"
            style={{
              width: "clamp(34px,3vw,46px)",
              height: "clamp(34px,3vw,46px)",
            }}
          >
            <img
              src={avatarUrl}
              alt={playerName}
              className="w-full h-full rounded-full object-cover border-2 border-primary shadow-[0_0_12px_rgba(212,175,55,0.4)]"
            />

            <div
              className="absolute flex items-center justify-center rounded-full font-black"
              style={{
                bottom: "-3px",
                right: "-3px",
                width: "clamp(14px,1.2vw,20px)",
                height: "clamp(14px,1.2vw,20px)",
                fontSize: "clamp(7px,0.6vw,10px)",
                background: "var(--primary)",
                color: "black",
                border: "2px solid var(--background)",
              }}
            >
              {level}
            </div>
          </div>
        </div>
        <LangToggle />
        <ModeToggle />
      </div>
    </nav>
  );
}