import type { CSSProperties } from "react";

const abs: CSSProperties = { position: "absolute" };

/** Shagai Shooting/12/бэрх — зөвхөн зураасан панелын нийтлэг хүрээ. */
export const SHAGAI_GAME_PANEL_BASE: CSSProperties = {
  position: "absolute",
  background: "rgba(6,4,2,0.90)",
  border: "1px solid rgba(200,160,48,0.28)",
  borderRadius: 16,
  padding: "14px 14px 12px",
  backdropFilter: "blur(16px)",
  boxShadow: "0 8px 40px rgba(0,0,0,0.7)",
  fontFamily:
    "var(--font-inter), -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
  color: "white",
  zIndex: 10,
  maxHeight: "calc(100% - 48px)",
  overflowY: "auto",
  overflowX: "hidden",
  scrollbarWidth: "thin",
  pointerEvents: "auto",
} as const;

/** Desktop: primary (left) gameplay panel. */
export function gamePanelLeftDesktop(widthPx: number): CSSProperties {
  return { ...abs, top: 24, left: 24, width: widthPx };
}

/**
 * Mobile: anchor gameplay controls to the bottom so the 3D canvas stays visible
 * (shagai fall / board in the upper area).
 */
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

/** Desktop: secondary (right) rules / stats panel. */
export function gamePanelRightDesktop(widthPx: number): CSSProperties {
  return { ...abs, top: 24, right: 24, width: widthPx };
}
