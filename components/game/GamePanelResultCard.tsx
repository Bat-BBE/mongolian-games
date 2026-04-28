"use client";

import { LuPartyPopper as PartyPopper } from "react-icons/lu";
import { LuFrown as Frown } from "react-icons/lu";
import { cn } from "@/lib/utils";
import { GAME_UI_FONT_FAMILY } from "./gameUiTheme";

/**
 * Хажуугийн панел доторх ялалт/хожигдол — `GameResultEndOverlay`-той ижил өнгө, товч хэмжээ.
 */
export function GamePanelResultCard({
  variant,
  title,
  subtitle,
  className,
}: {
  variant: "win" | "lose";
  title: string;
  subtitle?: string;
  className?: string;
}) {
  const won = variant === "win";
  return (
    <div
      role={won ? "status" : "alert"}
      aria-live={won ? "polite" : "assertive"}
      className={cn(
        "mb-3 rounded-2xl border px-3 py-3 text-center sm:px-4 sm:py-3.5",
        won
          ? "border-emerald-400/40 bg-gradient-to-br from-emerald-950/85 via-emerald-950/55 to-emerald-950/35 shadow-[0_0_24px_rgba(40,160,90,0.2)]"
          : "border-rose-400/35 bg-gradient-to-br from-rose-950/85 via-rose-950/55 to-zinc-950/50 shadow-[0_0_22px_rgba(180,60,50,0.15)]",
        className,
      )}
      style={{ fontFamily: GAME_UI_FONT_FAMILY }}
    >
      <div
        className={cn(
          "mx-auto mb-1.5 flex h-9 w-9 items-center justify-center rounded-full",
          won ? "bg-emerald-500/20 text-emerald-200" : "bg-rose-500/15 text-rose-200",
        )}
        aria-hidden
      >
        {won ? <PartyPopper className="size-[18px]" /> : <Frown className="size-[18px]" />}
      </div>
      <p
        className={cn(
          "text-balance font-bold leading-tight tracking-tight text-[clamp(0.88rem,3.2vw,1.05rem)]",
          won ? "text-emerald-100" : "text-rose-100",
        )}
      >
        {title}
      </p>
      {subtitle ? (
        <p
          className={cn(
            "mt-1.5 text-pretty text-xs leading-snug sm:text-sm",
            won ? "text-emerald-50/88" : "text-rose-50/85",
          )}
        >
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
