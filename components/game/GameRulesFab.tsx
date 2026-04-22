"use client";

import { LuScrollText as ScrollText } from "react-icons/lu";

type Props = {
  onClick: () => void;
  label: string;
};

/** Floating button to open rules / info sheet on narrow viewports (above game canvas). */
export default function GameRulesFab({ onClick, label }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-amber-600/40 bg-black/55 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-[#e8c860] shadow-lg backdrop-blur-md transition hover:bg-amber-950/50 hover:border-amber-500/55"
      style={{
        position: "absolute",
        top: "max(10px, env(safe-area-inset-top))",
        right: "max(10px, env(safe-area-inset-right))",
        zIndex: 12,
      }}
    >
      <ScrollText size={16} className="opacity-90" aria-hidden />
      {label}
    </button>
  );
}
