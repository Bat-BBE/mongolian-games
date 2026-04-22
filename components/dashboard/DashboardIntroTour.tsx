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

const STORAGE_KEY = "mg-dashboard-intro-v1";

/** null = full-screen card (no spotlight). Order: welcome → gameplay → UI highlights */
const ANCHORS = [
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
  if (typeof window === "undefined") {
    return {
      position: "fixed",
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%)",
      maxWidth: maxW,
      zIndex: 260,
    };
  }
  if (step <= 1 || (step > 1 && !hole)) {
    return {
      position: "fixed",
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%)",
      maxWidth: maxW,
      zIndex: 260,
    };
  }
  const vh = window.innerHeight;
  const vw = window.innerWidth;
  const cardApprox = 200;
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
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [open, refresh]);

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
        return { title: t.introGameplayTitle, body: t.introGameplayBody };
      case 2:
        return { title: t.introStepMapTitle, body: t.introStepMapBody };
      case 3:
        return {
          title: t.introStepSidebarTitle,
          body: t.introStepSidebarBody,
        };
      case 4:
        return { title: t.introStepNavTitle, body: t.introStepNavBody };
      default:
        return { title: "", body: "" };
    }
  })();

  if (!mounted || !open || typeof document === "undefined") return null;

  const w = vw || (typeof window !== "undefined" ? window.innerWidth : 0);
  const h = vh || (typeof window !== "undefined" ? window.innerHeight : 0);
  const showHole = step >= 2 && hole !== null && w > 0 && h > 0;

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
            fill="rgba(0,0,0,0.72)"
            mask={`url(#${maskId})`}
          />
        </svg>
      ) : null}

      {showHole ? (
        <div
          className="pointer-events-none fixed z-[250] rounded-xl border-2 border-sky-400/85 shadow-[0_0_0_3px_rgba(56,189,248,0.2)]"
          style={{
            left: hole!.x,
            top: hole!.y,
            width: hole!.w,
            height: hole!.h,
          }}
        />
      ) : null}

      <div
        className="fixed z-[260] rounded-2xl border border-sky-500/25 bg-gradient-to-b from-slate-950/98 to-slate-900/95 p-4 shadow-2xl backdrop-blur-md ring-1 ring-white/10"
        style={{
          ...tooltipStyle(step, hole),
          maxWidth:
            step === 1
              ? "min(26rem, calc(100vw - 1.5rem))"
              : "min(22rem, calc(100vw - 2rem))",
        }}
      >
        <p
          id="dashboard-intro-title"
          className="text-[11px] font-semibold text-sky-200/95"
        >
          {titleBody.title}
        </p>
        <p
          id="dashboard-intro-desc"
          className="mt-2 text-[11px] leading-relaxed text-slate-100/90 whitespace-pre-line"
        >
          {titleBody.body}
        </p>
        <p className="mt-3 text-[10px] tabular-nums text-slate-400">
          {step + 1} / {lastStep + 1}
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={finish}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-semibold text-slate-300 hover:bg-white/10"
          >
            {t.introSkip}
          </button>
          {step < lastStep ? (
            <button
              type="button"
              onClick={() => setStep((s) => Math.min(lastStep, s + 1))}
              className="rounded-lg border border-sky-500/40 bg-sky-600/90 px-3 py-1.5 text-[10px] font-semibold text-white hover:bg-sky-500"
            >
              {t.introNext}
            </button>
          ) : (
            <button
              type="button"
              onClick={finish}
              className="rounded-lg border border-sky-500/40 bg-sky-600/90 px-3 py-1.5 text-[10px] font-semibold text-white hover:bg-sky-500"
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
