"use client";

import { ModeToggle } from "@/components/ui/mode-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { DashStrings, DashLang } from "./dashboard-strings";
import { useRef, CSSProperties } from "react";
import {
  LuTrophy as Trophy,
  LuChevronDown as ChevronDown,
  LuUser as User,
  LuCircleHelp as CircleHelp,
  LuLogOut as LogOut,
} from "react-icons/lu";

interface DashNavProps {
  t: DashStrings;
  lang: DashLang;
  setLang: (l: DashLang) => void;
  playerName: string;
  playerTitle: string;
  avatarUrl: string;
  level: number;
  userEmail: string;
  onOpenProfile: () => void;
  onLogout: () => void;
  onOpenLeaderboard?: () => void;
  onShowIntroTour?: () => void;
}

export function DashNav({
  t,
  lang,
  setLang,
  playerName,
  playerTitle,
  avatarUrl,
  level,
  userEmail,
  onOpenProfile,
  onLogout,
  onOpenLeaderboard,
  onShowIntroTour,
}: DashNavProps) {
  const navRef = useRef<HTMLElement>(null);

  const goldText = {
    background: "var(--grad-gold)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  };

  const langBtnStyle = (active: boolean): CSSProperties =>
    active
      ? {
          background: "var(--grad-gold)",
          color: "oklch(0.12 0.018 55)",
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
          color: "color-mix(in oklch, var(--foreground) 75%, transparent)",
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
        border:
          "1px solid color-mix(in oklch, var(--primary) 20%, var(--border))",
        backdropFilter: "blur(8px)",
      }}
    >
      {(["mn", "en"] as const).map((lng) => (
        <button
          key={lng}
          type="button"
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

      <div
        data-tour-anchor="nav-actions"
        className="flex items-center gap-[clamp(8px,1.2vw,16px)]"
      >
        {onOpenLeaderboard ? (
          <button
            type="button"
            onClick={onOpenLeaderboard}
            className="p-2 rounded-full border border-primary/25 bg-background/50 hover:bg-primary/15 hover:border-primary/45 transition-colors shrink-0"
            style={{
              color: "color-mix(in oklch, var(--primary) 85%, transparent)",
            }}
            title={t.leaderboard}
            aria-label={t.leaderboard}
          >
            <Trophy className="size-[clamp(20px,1.5vw,26px)]" />
          </button>
        ) : null}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-[clamp(6px,1vw,12px)] rounded-lg pl-2 pr-2 py-1 border bg-background/40 hover:bg-primary/10 hover:border-primary/30 transition-colors text-left max-w-[min(280px,50vw)]"
            >
              <div className="text-right hidden sm:block min-w-0 flex-1">
                <p
                  className="font-bold truncate"
                  style={{
                    color: "var(--foreground)",
                    fontSize: "clamp(11px,0.9vw,14px)",
                  }}
                >
                  {playerName}
                </p>

                <p
                  className="uppercase truncate"
                  style={{
                    fontSize: "clamp(8px,0.7vw,11px)",
                    letterSpacing: "0.08em",
                    color:
                      "color-mix(in oklch,var(--foreground)60%,transparent)",
                  }}
                >
                  {playerTitle}
                </p>
              </div>

              <div
                className="relative shrink-0"
                style={{
                  width: "clamp(34px,3vw,46px)",
                  height: "clamp(34px,3vw,46px)",
                }}
              >
                <img
                  src={avatarUrl || "/images/shikhikhutag.png"}
                  alt=""
                  className="w-full h-full rounded-full object-contain border-2 border-primary shadow-[0_0_12px_rgba(212,175,55,0.4)]"
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
                    color: "var(--primary-foreground)",
                    border: "2px solid var(--background)",
                  }}
                >
                  {level}
                </div>
              </div>
              <ChevronDown className="size-4 text-muted-foreground shrink-0 hidden sm:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="min-w-[220px] border-primary/20 bg-zinc-950/95 backdrop-blur-md"
          >
            <div className="px-2 py-1.5 text-[10px] text-muted-foreground truncate border-b border-white/5 mb-1">
              {userEmail}
            </div>
            <DropdownMenuItem
              className="gap-2 cursor-pointer"
              onClick={onOpenProfile}
            >
              <User className="size-4" />
              {t.accountMenuProfile}
            </DropdownMenuItem>
            {onShowIntroTour ? (
              <DropdownMenuItem
                className="gap-2 cursor-pointer"
                onClick={onShowIntroTour}
              >
                <CircleHelp className="size-4" />
                {t.accountMenuTour}
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 cursor-pointer text-red-300 focus:text-red-100 focus:bg-red-950/50"
              onClick={onLogout}
            >
              <LogOut className="size-4" />
              {t.accountMenuLogout}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <LangToggle />
        <ModeToggle />
      </div>
    </nav>
  );
}
