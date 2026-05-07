"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { DashStrings } from "./dashboard-strings";
import { LuBookOpen, LuChevronLeft, LuChevronRight, LuX } from "react-icons/lu";

const STORAGE_KEY = "mg-map-coach-done-v1";

export function readMapCoachDone(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setMapCoachDone(): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    /* ignore */
  }
}

type MapFirstVisitCoachProps = {
  t: DashStrings;
  /** Эхний удаа эсвэл «Заавар» дахин нээсэн */
  mode: "first" | "replay";
  onCompleteFirst: () => void;
  onCloseReplay: () => void;
};

const STEP_COUNT = 5;

export function MapFirstVisitCoach({
  t,
  mode,
  onCompleteFirst,
  onCloseReplay,
}: MapFirstVisitCoachProps) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    setStep(0);
  }, [mode]);

  const titles = t.mapCoachStepTitles;
  const bodies = t.mapCoachStepBodies;

  const finishFirst = useCallback(() => {
    setMapCoachDone();
    onCompleteFirst();
  }, [onCompleteFirst]);

  const skipOrClose = useCallback(() => {
    if (mode === "first") {
      finishFirst();
    } else {
      onCloseReplay();
    }
  }, [finishFirst, mode, onCloseReplay]);

  const isLast = step >= STEP_COUNT - 1;

  return (
    <div
      role="region"
      aria-labelledby="map-coach-heading"
      className={cn(
        "map-coach-panel map-ui-surface pointer-events-auto w-full rounded-xl border border-white/14 shadow-lg backdrop-blur-md",
      )}
      style={{
        boxShadow:
          "0 12px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)",
      }}
    >
      <div className="flex items-start justify-between gap-2 border-b border-white/10 px-2.5 py-2 sm:px-3">
        <div className="min-w-0">
          <p
            id="map-coach-heading"
            className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em]"
            style={{ color: "var(--map-gold)" }}
          >
            <LuBookOpen className="size-3.5 shrink-0 opacity-90" aria-hidden />
            {t.mapCoachBadge}
          </p>
          <p
            className="mt-0.5 text-[10px] font-medium sm:text-[11px]"
            style={{ color: "var(--map-ui-text-muted)" }}
          >
            {t.mapHowToSectionTitle}
          </p>
        </div>
        <button
          type="button"
          onClick={skipOrClose}
          className="map-ui-ghost-btn shrink-0 rounded-lg p-1.5"
          aria-label={t.mapCoachClose}
          title={t.mapCoachClose}
        >
          <LuX className="size-4" aria-hidden />
        </button>
      </div>

      <div className="px-2.5 pb-2 pt-2 sm:px-3 sm:pb-2.5 sm:pt-2.5">
        <div
          className="mb-2 flex gap-1"
          role="tablist"
          aria-label={t.mapCoachProgressAria}
        >
          {titles.map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                i === step
                  ? "bg-[color-mix(in_srgb,var(--map-gold)_88%,transparent)]"
                  : i < step
                    ? "bg-[color-mix(in_srgb,var(--map-gold)_45%,transparent)]"
                    : "bg-white/15",
              )}
            />
          ))}
        </div>

        <p
          className="text-[12px] font-semibold leading-snug sm:text-[13px]"
          style={{ color: "var(--map-ui-text)" }}
        >
          {titles[step]}
        </p>
        <p
          className="mt-1.5 text-[11px] leading-relaxed sm:text-[12px] sm:leading-[1.5]"
          style={{ color: "var(--map-ui-text)" }}
        >
          {bodies[step]}
        </p>

        {step === 0 ? (
          <p
            className="mt-2 rounded-lg border border-dashed border-[color-mix(in_srgb,var(--map-gold)_35%,transparent)] bg-black/20 px-2 py-1.5 text-[10px] leading-snug sm:text-[11px]"
            style={{ color: "var(--map-ui-text-muted)" }}
          >
            {t.mapCoachLandscapeTip}
          </p>
        ) : null}

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => (mode === "first" ? finishFirst() : onCloseReplay())}
            className="text-[10px] font-semibold underline-offset-2 hover:underline sm:text-[11px]"
            style={{ color: "var(--map-ui-text-muted)" }}
          >
            {mode === "first" ? t.mapCoachSkipAll : t.mapCoachClose}
          </button>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step <= 0}
              className={cn(
                "map-ui-ghost-btn inline-flex h-9 items-center gap-0.5 rounded-lg px-2.5 text-[11px] font-semibold sm:px-3",
                step <= 0 && "pointer-events-none opacity-40",
              )}
            >
              <LuChevronLeft className="size-4" aria-hidden />
              {t.mapCoachBack}
            </button>
            {!isLast ? (
              <button
                type="button"
                onClick={() =>
                  setStep((s) => Math.min(STEP_COUNT - 1, s + 1))
                }
                className="inline-flex h-9 items-center gap-0.5 rounded-lg border border-[color-mix(in_srgb,var(--map-gold)_50%,transparent)] bg-[color-mix(in_srgb,var(--map-gold)_22%,#0f0e0c)] px-2.5 text-[11px] font-bold text-amber-50 shadow-sm sm:px-3"
              >
                {t.mapCoachNext}
                <LuChevronRight className="size-4" aria-hidden />
              </button>
            ) : (
              <button
                type="button"
                onClick={() =>
                  mode === "first" ? finishFirst() : onCloseReplay()
                }
                className="inline-flex h-9 items-center rounded-lg border border-[color-mix(in_srgb,var(--map-gold)_55%,transparent)] bg-[color-mix(in_srgb,var(--map-gold)_28%,#0c0b08)] px-3 text-[11px] font-bold text-amber-50 shadow-sm"
              >
                {mode === "first" ? t.mapCoachFinish : t.mapCoachClose}
              </button>
            )}
          </div>
        </div>

        <p
          className="mt-2 text-center text-[10px] tabular-nums"
          style={{ color: "var(--map-ui-text-muted)" }}
        >
          {t.mapCoachStepCounter
            .replace("{n}", String(step + 1))
            .replace("{total}", String(STEP_COUNT))}
        </p>
      </div>
    </div>
  );
}
