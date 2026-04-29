"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const FRAME = "/images/station-thumb-frame.svg";

type Size = "label" | "popup";

type StationImageOrIconProps = {
  imageUrl?: string | null;
  /** Emoji fallback when no image or load error */
  icon: string;
  size: Size;
  className?: string;
  /** @default "" */
  alt?: string;
};

/**
 * Map label / station popup: нэг жишүүрт thumbnail — object-cover, алдаа гарвал ижил хэмжээний icon.
 */
export function StationImageOrIcon({
  imageUrl,
  icon,
  size,
  className,
  alt = "",
}: StationImageOrIconProps) {
  const [failed, setFailed] = useState(false);
  const src = imageUrl?.trim() ?? "";
  const showImg = Boolean(src) && !failed;
  const fallback = icon?.trim() || "📍";

  if (size === "popup") {
    return (
      <div
        className={cn(
          "relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-primary/20 text-3xl",
          "bg-zinc-950/55 shadow-inner",
          !showImg && "bg-[url('/images/station-thumb-frame.svg')] bg-cover bg-center",
          className,
        )}
        style={
          !showImg
            ? {
                backgroundColor:
                  "color-mix(in oklch, var(--primary) 10%, rgb(2 6 23))",
              }
            : undefined
        }
      >
        {showImg ? (
          <img
            src={src}
            alt={alt}
            className="h-full w-full object-cover object-center"
            onError={() => setFailed(true)}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <span
            className="flex h-full w-full items-center justify-center leading-none select-none drop-shadow"
            aria-hidden
          >
            {fallback}
          </span>
        )}
      </div>
    );
  }

  // label: жижиг map pin — 28×28, харагдац тогтвортой
  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-md border text-lg leading-none",
        "h-7 w-7 min-h-7 min-w-7 border-white/20 bg-zinc-950/50 shadow-sm",
        !showImg && "bg-[url('/images/station-thumb-frame.svg')] bg-cover bg-center",
        className,
      )}
    >
      {showImg ? (
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover object-center"
          onError={() => setFailed(true)}
          loading="lazy"
          decoding="async"
        />
      ) : (
        <span
          className="flex h-full w-full items-center justify-center select-none"
          style={{ textShadow: "0 1px 2px rgba(0,0,0,0.65)" }}
          aria-hidden
        >
          {fallback}
        </span>
      )}
    </div>
  );
}
