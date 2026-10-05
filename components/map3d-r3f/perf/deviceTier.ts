export type DeviceTier = "low" | "medium" | "high";

/** Classifies the current device once, on mount — not re-evaluated per frame. */
export function detectDeviceTier(): DeviceTier {
  if (typeof navigator === "undefined") return "high";
  const ua = navigator.userAgent || "";
  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
  const cores = navigator.hardwareConcurrency ?? 4;
  const mem = (navigator as unknown as { deviceMemory?: number }).deviceMemory;

  if (isMobile && (cores <= 4 || (mem !== undefined && mem <= 4))) return "low";
  if (isMobile) return "medium";
  if (cores <= 4) return "medium";
  return "high";
}
