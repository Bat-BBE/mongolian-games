import type { CSSProperties } from "react";

const abs: CSSProperties = { position: "absolute" };

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
