"use client";

import type { ShagaiSide } from "./shagai";

const SIDE_SPRITE_X: Record<ShagaiSide, string> = {
  camel: "5%",
  horse: "34%",
  sheep: "64%",
  goat: "95%",
};

export function ShagaiSideImage({
  side,
  size = 80,
  highlight = false,
}: {
  side: ShagaiSide;
  size?: number;
  highlight?: boolean;
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        backgroundImage: "url('/images/shagai-sides.png')",
        backgroundSize: "440% 260%",
        backgroundPosition: `${SIDE_SPRITE_X[side]} 42%`,
        backgroundRepeat: "no-repeat",
        borderRadius: 12,
        border: highlight
          ? "2px solid rgba(240,192,64,0.9)"
          : "2px solid rgba(200,160,48,0.35)",
        boxShadow: highlight
          ? "0 0 22px rgba(240,192,64,0.45), inset 0 0 8px rgba(0,0,0,0.3)"
          : "0 4px 10px rgba(0,0,0,0.35)",
        transition: "all 0.35s ease",
      }}
    />
  );
}

