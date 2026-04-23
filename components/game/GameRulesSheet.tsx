"use client";

import { LuX as X } from "react-icons/lu";
import type { ReactNode } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
};

/**
 * Mobile: rules / side info in a full-width bottom sheet so the 3D view stays visible.
 */
export default function GameRulesSheet({ open, onClose, title, children }: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex flex-col justify-end sm:items-center sm:justify-center sm:p-4"
      style={{ background: "rgba(0,0,0,0.55)" }}
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex max-h-[min(88dvh,100vh-1rem)] w-full flex-col rounded-t-2xl border border-amber-600/35 bg-[rgba(8,6,4,0.97)] shadow-2xl sm:max-w-lg sm:rounded-2xl"
        style={{
          borderColor: "rgba(200,160,48,0.35)",
          paddingBottom: "max(12px, env(safe-area-inset-bottom))",
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="game-rules-sheet-title"
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4 py-3 pr-3">
          <h2
            id="game-rules-sheet-title"
            className="font-[family-name:var(--font-inter)] text-sm font-bold uppercase tracking-[0.2em] text-[#c8a030]"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-black/40 text-zinc-400 transition hover:bg-amber-900/30 hover:text-white"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <div
          className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-3 [scrollbar-color:rgba(200,160,48,0.35)_transparent] [scrollbar-width:thin]"
          style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
