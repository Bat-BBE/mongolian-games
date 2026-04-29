import type { CSSProperties } from "react";
import { GAME_PANEL_CHROME, GAME_PANEL_TEXT_COLOR } from "./gameUiTheme";

const abs: CSSProperties = { position: "absolute" };

export const SHAGAI_GAME_PANEL_BASE: CSSProperties = {
  position: "absolute",
  ...GAME_PANEL_CHROME,
  padding: "14px 14px 12px",
  color: GAME_PANEL_TEXT_COLOR,
  zIndex: 10,
  maxHeight: "calc(100% - 48px)",
  overflowY: "auto",
  overflowX: "hidden",
  scrollbarWidth: "thin",
  pointerEvents: "auto",
} as const;

export function gamePanelLeftDesktop(widthPx: number): CSSProperties {
  return { ...abs, top: 24, left: 24, width: widthPx };
}
export function gamePanelPlayNarrowBottom(): CSSProperties {
  return {
    ...abs,
    top: "auto",
    bottom: "max(10px, env(safe-area-inset-bottom))",
    left: 10,
    right: 10,
    width: "auto",
    maxHeight: "min(54vh, 440px)",
    overflowY: "auto",
  };
}

export function gamePanelRightDesktop(widthPx: number): CSSProperties {
  return { ...abs, top: 24, right: 24, width: widthPx };
}
