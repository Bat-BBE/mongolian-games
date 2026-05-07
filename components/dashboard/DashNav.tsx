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
import { cn } from "@/lib/utils";
import { useRef, CSSProperties } from "react";
import {
  LuTrophy as Trophy,
  LuChevronDown as ChevronDown,
  LuUser as User,
  LuCircleHelp as CircleHelp,
  LuLogOut as LogOut,
  LuSettings as Settings,
  LuBell as Bell,
  LuCoins as Coins,
  LuHouse as House,
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
  coins?: number;
  gerLevel?: number;
  /** Мэдлэгийн оноо — дээд HUD жижиг пилл */
  kp?: number;
  onOpenProfile: () => void;
  onLogout: () => void;
  onOpenLeaderboard?: () => void;
  onShowIntroTour?: () => void;
}

const pillBase =
  "dash-hud-pill inline-flex h-9 max-w-full shrink-0 items-center gap-2 rounded-full px-2.5 transition-colors sm:h-10 sm:px-3";

const iconFab =
  "dash-hud-icon-btn flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[color:var(--map-ui-text)] transition-colors sm:h-10 sm:w-10";

export function DashNav({
  t,
  lang,
  setLang,
  playerName,
  playerTitle,
  avatarUrl,
  level,
  userEmail,
  coins = 0,
  gerLevel = 1,
  kp = 0,
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

  return (
    <nav
      ref={navRef}
      className="pointer-events-none absolute inset-x-0 top-0 z-[80] select-none"
      style={{
        paddingTop: "max(0.35rem, env(safe-area-inset-top, 0px))",
      }}
    >
      <div className="pointer-events-auto mx-auto flex w-full max-w-[1800px] items-center justify-between gap-2 px-2.5 sm:gap-3 sm:px-4">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5 sm:gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  pillBase,
                  "max-w-[min(100%,calc(100vw-5.5rem))] gap-1.5 sm:max-w-none sm:gap-2.5",
                )}
              >
                <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full border border-[color:var(--map-ui-border)] sm:h-8 sm:w-8">
                  <img
                    src={avatarUrl || "/images/shikhikhutag.png"}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
                <span className="min-w-0 shrink text-left">
                  <span className="block max-w-[6.5rem] truncate text-[11px] font-semibold leading-tight text-[color:var(--map-ui-text)] sm:max-w-[9.5rem] sm:text-xs">
                    {playerName}
                  </span>
                  <span className="block max-w-[6.5rem] truncate text-[9px] leading-tight text-[color:var(--map-ui-text-muted)] sm:max-w-[10rem] sm:text-[10px]">
                    {playerTitle?.trim()
                      ? `${playerTitle} · Lv.${level}`
                      : `Lv. ${level}`}
                  </span>
                </span>
                <span
                  className="hidden h-5 w-px shrink-0 bg-[color:var(--map-ui-border)] sm:block"
                  aria-hidden
                />
                <span
                  className="flex shrink-0 items-center gap-0.5"
                  title={t.treasuryCoinsLabel}
                >
                  <Coins
                    className="size-3.5 shrink-0 text-[color:var(--map-gold)] sm:size-4"
                    aria-hidden
                  />
                  <span className="text-[11px] font-semibold tabular-nums text-[color:var(--map-ui-text)] sm:text-xs">
                    {coins.toLocaleString()}
                  </span>
                </span>
                <span
                  className="flex shrink-0 items-center gap-0.5"
                  title={lang === "mn" ? "Гэрийн түвшин" : "Home ger level"}
                >
                  <House
                    className="size-3.5 shrink-0 text-[color:var(--map-ui-text-muted)] sm:size-4"
                    aria-hidden
                  />
                  <span className="text-[10px] font-semibold tabular-nums text-[color:var(--map-ui-text)] sm:text-[11px]">
                    Lv.{gerLevel}
                  </span>
                </span>
                <ChevronDown
                  className="size-3.5 shrink-0 text-[color:var(--map-ui-text-muted)] opacity-80"
                  aria-hidden
                />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="min-w-[220px] border-border/50 bg-background/95 backdrop-blur-xl"
            >
              <div className="mb-1 truncate border-b border-border/40 px-2 py-1.5 text-[10px] text-muted-foreground">
                {userEmail}
              </div>
              <DropdownMenuItem className="cursor-pointer gap-2" onClick={onOpenProfile}>
                <User className="size-4" />
                {t.accountMenuProfile}
              </DropdownMenuItem>
              {onShowIntroTour ? (
                <DropdownMenuItem
                  className="cursor-pointer gap-2"
                  onClick={onShowIntroTour}
                >
                  <CircleHelp className="size-4" />
                  {t.accountMenuTour}
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer gap-2 text-red-600 focus:bg-red-500/10 focus:text-red-700 dark:text-red-400 dark:focus:text-red-300"
                onClick={onLogout}
              >
                <LogOut className="size-4" />
                {t.accountMenuLogout}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div
            className={cn(pillBase, "gap-1.5")}
            title={t.treasuryKpLabel}
          >
            <span className="text-[10px] font-bold uppercase tracking-[0.06em] text-[color:var(--map-gold)] sm:text-[11px]">
              {lang === "mn" ? "МО" : "KP"}
            </span>
            <span className="text-[10px] font-semibold text-[color:var(--map-ui-text-muted)] sm:text-[11px]">
              :
            </span>
            <span className="text-xs font-semibold tabular-nums text-[color:var(--map-ui-text)] sm:text-sm">
              {kp.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="hidden shrink-0 items-center gap-2 lg:flex">
          <span
            className="font-display text-lg font-black tracking-tight"
            style={goldText}
          >
            MTGA
          </span>
          <div
            className="h-5 w-px bg-border/60"
            aria-hidden
          />
          <span className="max-w-[12rem] truncate font-heritage text-[9px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
            {t.title}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
          {onOpenLeaderboard ? (
            <button
              type="button"
              onClick={onOpenLeaderboard}
              className={iconFab}
              title={t.leaderboard}
              aria-label={t.leaderboard}
            >
              <Trophy className="size-[1.05rem] sm:size-[1.15rem]" />
            </button>
          ) : null}

          <button
            type="button"
            onClick={onOpenProfile}
            className={iconFab}
            title={t.accountMenuProfile}
            aria-label={t.accountMenuProfile}
          >
            <Settings className="size-[1.05rem] sm:size-[1.15rem]" />
          </button>

          <button
            type="button"
            className={`${iconFab} cursor-default opacity-50`}
            disabled
            title={lang === "mn" ? "Мэдэгдэл — удахгүй" : "Notifications — coming soon"}
            aria-label={lang === "mn" ? "Мэдэгдэл" : "Notifications"}
          >
            <Bell className="size-[1.05rem] sm:size-[1.15rem]" />
          </button>

          <div
            className="dash-hud-pill flex h-9 items-center gap-0.5 rounded-full p-0.5 sm:h-10"
            role="group"
            aria-label={lang === "mn" ? "Хэл солих" : "Language"}
          >
            {(["mn", "en"] as const).map((lng) => (
              <button
                key={lng}
                type="button"
                onClick={() => setLang(lng)}
                aria-pressed={lang === lng}
                style={langBtnStyle(lang === lng)}
                className="font-[family-name:var(--font-inter)] text-[10px] font-semibold uppercase tracking-wide transition-all duration-200 sm:text-[11px]"
              >
                {lng === "mn" ? "МН" : "EN"}
              </button>
            ))}
          </div>

          <div className="[&_button]:dash-hud-icon-btn [&_button]:h-9 [&_button]:w-9 [&_button]:min-w-0 [&_button]:rounded-full [&_button]:border-[color:var(--map-ui-border-bright)] [&_button]:p-0 sm:[&_button]:h-10 sm:[&_button]:w-10">
            <ModeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
}
