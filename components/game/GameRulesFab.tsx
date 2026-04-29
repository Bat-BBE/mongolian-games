"use client";

import { LuScrollText as ScrollText } from "react-icons/lu";
import { GAME_RULES_FAB_CLASS } from "./gameUiTheme";

type Props = {
  onClick: () => void;
  label: string;
  side?: "left" | "right";
};

export default function GameRulesFab({ onClick, label, side = "left" }: Props) {
  const edge =
    side === "left"
      ? { left: "max(10px, env(safe-area-inset-left))", right: "auto" as const }
      : {
          right: "max(10px, env(safe-area-inset-right))",
          left: "auto" as const,
        };
  return (
    <button
      type="button"
      onClick={onClick}
      className={GAME_RULES_FAB_CLASS}
      style={{
        position: "absolute",
        top: "max(10px, env(safe-area-inset-top))",
        zIndex: 12,
        ...edge,
      }}
    >
      <ScrollText size={16} className="opacity-90" aria-hidden />
      {label}
    </button>
  );
}
