"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useState,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import type { DashStrings } from "./dashboard-strings";

const STORAGE_KEY = "mg-dashboard-intro-v3";

/**
 * null = гол картыг дэлгэцийн төвд. Дараалал: танилцах → баатар → өртөө/тоглоом
 * → гэр/оноо → газрын зураг (highlight) → зүүн самбар (highlight) → дээд самбар (highlight)
 */
const ANCHORS = [
  null,
  null,
  null,
  null,
  "map-area",
  "dashboard-sidebar",
  "nav-actions",
] as const;

type Hole = { x: number; y: number; w: number; h: number };

export function readDashboardIntroDone(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(STORAGE_KEY) === "1";
}

export function setDashboardIntroDone(): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    /* ignore */
  }
}

function measureHole(step: number): Hole | null {
  if (typeof window === "undefined") return null;
  const id = ANCHORS[step];
  if (!id) return null;
  const el = document.querySelector(`[data-tour-anchor="${id}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  const pad = 10;
  return {
    x: Math.max(0, r.left - pad),
    y: Math.max(0, r.top - pad),
    w: Math.min(window.innerWidth, r.width + pad * 2),
    h: Math.min(window.innerHeight, r.height + pad * 2),
  };
}

function tooltipStyle(step: number, hole: Hole | null): CSSProperties {
  const maxW = "min(22rem, calc(100vw - 2rem))";
  const centered = (): CSSProperties => ({
    position: "fixed",
    left: "50%",
    top: "50%",
    transform: "translate(-50%, -50%)",
    maxWidth: maxW,
    maxHeight: "min(85dvh, 36rem)",
    overflowY: "auto",
    overscrollBehavior: "contain",
    zIndex: 260,
  });
  if (typeof window === "undefined") {
    return centered();
  }
  const vh = window.innerHeight;
  const vw = window.innerWidth;
  const shortViewport = vh < 520 || (vh < 420 && vw > vh);
  if (shortViewport) {
    return centered();
  }
  if (step <= 3 || (step > 3 && !hole)) {
    return centered();
  }
  const cardApprox = 280;
  let top = hole!.y + hole!.h + 16;
  if (top + cardApprox > vh - 20) {
    top = hole!.y - cardApprox - 16;
  }
  top = Math.max(16, Math.min(top, vh - 24));
  let left = hole!.x + hole!.w / 2;
  left = Math.max(120, Math.min(left, vw - 120));
  return {
    position: "fixed",
    left,
    top,
    transform: "translateX(-50%)",
    maxWidth: maxW,
    maxHeight: "min(80dvh, 32rem)",
    overflowY: "auto",
    overscrollBehavior: "contain",
    zIndex: 260,
  };
}

interface DashboardIntroTourProps {
  t: DashStrings;
  open: boolean;
  onDismiss: () => void;
}

export function DashboardIntroTour({
  t,
  open,
  onDismiss,
}: DashboardIntroTourProps) {
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(0);
  const [hole, setHole] = useState<Hole | null>(null);
  const [vw, setVw] = useState(0);
  const [vh, setVh] = useState(0);
  const maskId = useId().replace(/:/g, "");

  const lastStep = ANCHORS.length - 1;

  const refresh = useCallback(() => {
    if (typeof window === "undefined") return;
    setVw(window.innerWidth);
    setVh(window.innerHeight);
    setHole(measureHole(step));
  }, [step]);

  useLayoutEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    refresh();
    const t0 = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(refresh);
    });
    return () => window.cancelAnimationFrame(t0);
  }, [open, step, refresh]);

  useEffect(() => {
    if (!open) return;
    const onResize = () => refresh();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDashboardIntroDone();
        onDismiss();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, refresh, onDismiss]);

  useEffect(() => {
    if (open) setStep(0);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const finish = () => {
    setDashboardIntroDone();
    onDismiss();
  };

  const titleBody = (() => {
    switch (step) {
      case 0:
        return { title: t.introWelcomeTitle, body: t.introWelcomeBody };
      case 1:
        return { title: t.introHeroTitle, body: t.introHeroBody };
      case 2:
        return { title: t.introStationsTitle, body: t.introStationsBody };
      case 3:
        return { title: t.introHomeTitle, body: t.introHomeBody };
      case 4:
        return { title: t.introStepMapTitle, body: t.introStepMapBody };
      case 5:
        return {
          title: t.introStepSidebarTitle,
          body: t.introStepSidebarBody,
        };
      case 6:
        return { title: t.introStepNavTitle, body: t.introStepNavBody };
      default:
        return { title: "", body: "" };
    }
  })();

  if (!mounted || !open || typeof document === "undefined") return null;

  const w = vw || (typeof window !== "undefined" ? window.innerWidth : 0);
  const h = vh || (typeof window !== "undefined" ? window.innerHeight : 0);
  const showHole = step >= 4 && hole !== null && w > 0 && h > 0;

  const overlay = (
    <div
      className="fixed inset-0 z-[248]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dashboard-intro-title"
      aria-describedby="dashboard-intro-desc"
    >
      {w > 0 && h > 0 ? (
        <svg
          className="pointer-events-auto fixed inset-0 z-[249] touch-none"
          width={w}
          height={h}
          aria-hidden
        >
          <defs>
            <mask id={maskId}>
              <rect width={w} height={h} fill="white" />
              {showHole ? (
                <rect
                  x={hole!.x}
                  y={hole!.y}
                  width={hole!.w}
                  height={hole!.h}
                  rx={12}
                  fill="black"
                />
              ) : null}
            </mask>
          </defs>
          <rect
            width={w}
            height={h}
            fill="rgba(10,8,6,0.78)"
            mask={`url(#${maskId})`}
          />
        </svg>
      ) : null}

      {showHole ? (
        <div
          className="pointer-events-none fixed z-[250] rounded-xl border-2 shadow-[0_0_0_3px_rgba(200,160,48,0.22)]"
          style={{
            left: hole!.x,
            top: hole!.y,
            width: hole!.w,
            height: hole!.h,
            borderColor: "color-mix(in srgb, var(--map-gold) 72%, transparent)",
          }}
        />
      ) : null}

      <div
        className="dashboard-intro-tour-card fixed z-[260] rounded-2xl p-4 ring-1 ring-white/10"
        style={{
          ...tooltipStyle(step, hole),
          maxWidth:
            step <= 3
              ? "min(32rem, calc(100vw - 1.25rem))"
              : "min(24rem, calc(100vw - 2rem))",
        }}
      >
        <p
          id="dashboard-intro-title"
          className="font-display text-base font-semibold tracking-wide sm:text-lg"
          style={{ color: "var(--map-ui-text)" }}
        >
          {titleBody.title}
        </p>
        <p
          className="mt-1.5 text-xs font-medium"
          id="dashboard-intro-step-label"
          style={{ color: "color-mix(in srgb, var(--map-gold) 75%, var(--map-ui-text))" }}
        >
          {t.introStepLabels[step]}
        </p>
        <div
          className="mt-3 flex justify-center gap-1.5"
          role="group"
          aria-label={`${step + 1} of ${lastStep + 1}`}
        >
          {t.introStepLabels.map((_, i) => (
            <span
              key={i}
              aria-hidden
              className={[
                "h-2 w-2 rounded-full transition-colors",
                i === step
                  ? "bg-[color-mix(in_srgb,var(--map-gold)_88%,white)] shadow-[0_0_0_1px_rgba(200,160,48,0.45)]"
                  : "bg-white/25",
              ].join(" ")}
            />
          ))}
        </div>
        <p
          id="dashboard-intro-desc"
          className="mt-3 text-sm leading-relaxed whitespace-pre-line sm:text-[15px] sm:leading-[1.55]"
          style={{ color: "var(--map-ui-text)" }}
        >
          {titleBody.body}
        </p>
        <p
          className="mt-4 text-xs tabular-nums"
          style={{ color: "var(--map-ui-text-muted)" }}
        >
          {step + 1} / {lastStep + 1}
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={finish}
            className="rounded-lg border border-rose-400/50 bg-rose-500/15 px-4 py-2 text-sm font-semibold text-rose-100 hover:bg-rose-500/25"
          >
            {t.introSkip}
          </button>
          {step < lastStep ? (
            <button
              type="button"
              onClick={() => setStep((s) => Math.min(lastStep, s + 1))}
              className="rounded-lg border border-[color-mix(in_srgb,var(--map-gold)_55%,transparent)] bg-[color-mix(in_srgb,var(--map-gold)_25%,#0c0b08)] px-4 py-2 text-sm font-semibold text-amber-50 shadow-md hover:brightness-110"
            >
              {t.introNext}
            </button>
          ) : (
            <button
              type="button"
              onClick={finish}
              className="rounded-lg border border-[color-mix(in_srgb,var(--map-gold)_55%,transparent)] bg-[color-mix(in_srgb,var(--map-gold)_28%,#0c0b08)] px-4 py-2 text-sm font-semibold text-amber-50 shadow-md hover:brightness-110"
            >
              {t.introDone}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}
