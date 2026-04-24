"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { cn } from "@/lib/utils";

export type MapVirtualStickRef = MutableRefObject<{
  x: number;
  z: number;
  run: boolean;
}>;

export function MapVirtualJoystick({
  stickRef,
  disabled,
  ariaLabel,
  className,
}: {
  stickRef: MapVirtualStickRef;
  disabled?: boolean;
  ariaLabel: string;
  className?: string;
}) {
  const baseRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    pid: number;
    cx: number;
    cy: number;
    maxR: number;
  } | null>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });

  const applyPolar = useCallback(
    (
      clientX: number,
      clientY: number,
      cx: number,
      cy: number,
      maxR: number,
    ) => {
      const dx = clientX - cx;
      const dy = clientY - cy;
      const dist = Math.hypot(dx, dy);
      const cap = maxR * 0.78;
      const dead = cap * 0.08;
      if (dist < dead) {
        stickRef.current.x = 0;
        stickRef.current.z = 0;
        stickRef.current.run = false;
        setKnob({ x: 0, y: 0 });
        return;
      }
      const mag = Math.min(1, dist / cap);
      const ux = dx / dist;
      const uy = dy / dist;
      setKnob({ x: ux * Math.min(cap, dist), y: uy * Math.min(cap, dist) });
      stickRef.current.x = ux * mag;
      stickRef.current.z = -uy * mag;
      stickRef.current.run = mag >= 0.88;
    },
    [stickRef],
  );

  const clearStick = useCallback(() => {
    stickRef.current.x = 0;
    stickRef.current.z = 0;
    stickRef.current.run = false;
    setKnob({ x: 0, y: 0 });
  }, [stickRef]);

  useEffect(() => {
    if (disabled) clearStick();
  }, [disabled, clearStick]);

  useEffect(
    () => () => {
      clearStick();
    },
    [clearStick],
  );

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    const el = baseRef.current;
    if (!el) return;
    e.preventDefault();
    e.stopPropagation();
    el.setPointerCapture(e.pointerId);
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const maxR = r.width / 2;
    dragRef.current = { pid: e.pointerId, cx, cy, maxR };
    applyPolar(e.clientX, e.clientY, cx, cy, maxR);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d || e.pointerId !== d.pid) return;
    e.preventDefault();
    applyPolar(e.clientX, e.clientY, d.cx, d.cy, d.maxR);
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d || e.pointerId !== d.pid) return;
    dragRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    clearStick();
  };

  return (
    <div
      className={cn("pointer-events-auto z-[55] select-none", className)}
      style={{ touchAction: "none" }}
    >
      <div
        ref={baseRef}
        role="application"
        aria-label={ariaLabel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className={cn(
          "relative flex h-28 w-28 touch-none items-center justify-center",
          "rounded-full border-2 border-white/55 bg-white/8 shadow-lg backdrop-blur-md",
          disabled && "pointer-events-none opacity-35",
        )}
      >
        <div
          className="pointer-events-none absolute inset-[10px] rounded-full border border-white/20 bg-white/[0.1]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute h-[32%] w-[32%] rounded-full border border-white/55 bg-white/30 shadow-md"
          style={{
            transform: `translate(${knob.x}px, ${knob.y}px)`,
          }}
          aria-hidden
        />
      </div>
    </div>
  );
}
