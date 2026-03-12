import { cn } from "@/lib/utils";
import type { LabelPos } from "./AnimationController";
import { STATION_CONFIGS } from "./mapConstants";
import type { UrtuuStation } from "./UrtuuNode";

interface StationLabelsProps {
  stations: UrtuuStation[];
  labelPositions: Record<string, LabelPos>;
  currentStationId: string;
  doneStationIds: string[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function StationLabels({
  stations,
  labelPositions,
  currentStationId,
  doneStationIds,
  selectedId,
  onSelect,
}: StationLabelsProps) {
  return (
    <div className="absolute inset-0 z-10 pointer-events-none">
      {stations.map(station => {
        const lp = labelPositions[station.id];
        if (!lp?.visible) return null;

        const isCurrent  = station.id === currentStationId;
        const isDone     = doneStationIds.includes(station.id);
        const isSelected = station.id === selectedId;
        const icon       = STATION_CONFIGS[station.id]?.icon ?? "📍";

        // Visibility levels:
        // - current  → fully visible (opacity 1), full name + ping dot
        // - selected → fully visible (clicked by user), full name
        // - done     → faint (opacity 0.45), icon + ✓ only
        // - inactive → nearly invisible (opacity 0.18), tiny dim dot only
        const showLabel = isCurrent || isSelected || isDone;
        const opacity   = isCurrent ? 1 : isSelected ? 0.95 : isDone ? 0.45 : 0.18;

        return (
          <div
            key={station.id}
            className="absolute pointer-events-auto cursor-pointer select-none"
            style={{
              left: lp.x,
              top: lp.y,
              transform: "translate(-50%, -100%)",
              opacity,
              transition: "opacity 0.25s ease",
            }}
            onClick={() => onSelect(station.id)}
          >
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "relative rounded-full border shadow-lg backdrop-blur-sm transition-all duration-200",
                  showLabel ? "px-3 py-1.5 text-xs font-bold tracking-wide" : "w-2 h-2 p-0",
                  isCurrent
                    ? "bg-emerald-900/90 border-emerald-400 text-emerald-200 shadow-emerald-500/50 shadow-xl scale-110"
                    : isSelected
                    ? "bg-primary/80 border-primary text-primary-foreground"
                    : isDone
                    ? "bg-amber-900/70 border-amber-500/60 text-amber-300"
                    : "bg-gray-900/60 border-gray-600/40 text-gray-400",
                )}
                style={{ whiteSpace: "nowrap" }}
              >
                {/* Animated pulsing dot for current station */}
                {isCurrent && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full">
                    <span className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-75" />
                  </span>
                )}

                {showLabel && (
                  <>
                    <span className="mr-1">{icon}</span>
                    {/* Full name only for current or selected */}
                    {(isCurrent || isSelected) && station.name}
                    {/* Done stations: icon + ✓ only (no name unless selected) */}
                    {isDone && !isCurrent && !isSelected && (
                      <span className="text-amber-400">✓</span>
                    )}
                    {isDone && (isCurrent || isSelected) && (
                      <span className="ml-1 text-amber-400">✓</span>
                    )}
                  </>
                )}
              </div>

              {/* Pointer triangle — only when label is showing */}
              {showLabel && (
                <div
                  className={cn(
                    "w-0 h-0",
                    "border-l-[5px] border-r-[5px] border-t-[7px]",
                    "border-l-transparent border-r-transparent",
                    isCurrent
                      ? "border-t-emerald-400"
                      : isSelected
                      ? "border-t-primary"
                      : "border-t-amber-500",
                  )}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}