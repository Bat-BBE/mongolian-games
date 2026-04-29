"use client";

import { useEffect, useMemo, useState } from "react";
import { LuMapPinned as MapPinned } from "react-icons/lu";
import {
  getHowToAtStationHint,
  getHowToSteps,
} from "@/components/game/gameHowToContent";
import { playButtonClick } from "@/lib/uiSounds";
import { cn } from "@/lib/utils";

type Props = {
  gameSlug: string;
  gameName: string;
  isMn: boolean;
  nextLabel: string;
  backLabel: string;
  skipLabel: string;
  doneLabel: string;
  hideLabel: string;
  onClose: () => void;
};

export function StationGameHowToInline({
  gameSlug,
  gameName,
  isMn,
  nextLabel,
  backLabel,
  skipLabel,
  doneLabel,
  hideLabel,
  onClose,
}: Props) {
  const steps = useMemo(
    () => getHowToSteps(gameSlug, isMn),
    [gameSlug, isMn],
  );
  const atStation = useMemo(
    () => getHowToAtStationHint(gameSlug, isMn),
    [gameSlug, isMn],
  );
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [gameSlug]);

  const n = steps.length;
  const last = n <= 1 || index >= n - 1;

  const primary = () => {
    playButtonClick();
    if (last) onClose();
    else setIndex((i) => Math.min(i + 1, n - 1));
  };

  const back = () => {
    playButtonClick();
    setIndex((i) => Math.max(0, i - 1));
  };

  const dismiss = () => {
    playButtonClick();
    onClose();
  };

  if (n === 0) return null;

  return (
    <div
      className="mt-3 rounded-xl border border-sky-500/25 bg-sky-950/25 px-2.5 py-2.5"
      role="region"
      aria-label={gameName}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 text-[10px] font-semibold leading-snug text-sky-100/95">
          <span className="text-sky-300/90">{gameName}</span>
          <span className="block pt-0.5 font-normal text-muted-foreground/95">
            {isMn ? "Алхам алхмаар" : "Step by step"}
          </span>
        </p>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 rounded-md border border-white/12 bg-black/30 px-2 py-0.5 text-[9px] font-semibold text-muted-foreground hover:text-foreground"
        >
          {hideLabel}
        </button>
      </div>

      <div className="mt-2 flex gap-1" aria-hidden>
        {steps.map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-0.5 flex-1 rounded-full",
              i === index
                ? "bg-sky-400/90"
                : i < index
                  ? "bg-sky-700/50"
                  : "bg-white/10",
            )}
          />
        ))}
      </div>
      <p className="mt-0.5 text-right text-[8px] tabular-nums text-muted-foreground">
        {index + 1}/{n}
      </p>

      <div className="mt-1.5 flex gap-1.5 rounded-lg border border-amber-500/20 bg-black/30 px-2 py-1.5 text-[9px] leading-snug text-amber-100/90">
        <MapPinned className="mt-0.5 size-3 shrink-0 text-amber-400/85" aria-hidden />
        <span>{atStation}</span>
      </div>

      <p
        className="mt-2 min-h-[3.25rem] text-balance text-[11px] leading-relaxed text-foreground/95"
        key={index}
      >
        {steps[index]}
      </p>

      <div className="mt-2.5 flex flex-col gap-1.5">
        <button
          type="button"
          onClick={primary}
          className="w-full rounded-lg border border-amber-500/45 py-1.5 text-[10px] font-bold uppercase tracking-wide text-[#140c00] shadow-sm hover:brightness-105"
          style={{ backgroundImage: "var(--grad-gold)" }}
        >
          {last ? doneLabel : nextLabel}
        </button>
        <div className="flex gap-1.5">
          {index > 0 && (
            <button
              type="button"
              onClick={back}
              className="flex-1 rounded-lg border border-white/12 bg-black/35 py-1 text-[9px] font-semibold text-muted-foreground hover:text-foreground"
            >
              {backLabel}
            </button>
          )}
          <button
            type="button"
            onClick={dismiss}
            className={cn(
              "rounded-lg border border-white/12 bg-black/35 py-1 text-[9px] font-semibold text-muted-foreground hover:text-foreground",
              index > 0 ? "flex-1" : "w-full",
            )}
          >
            {skipLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
