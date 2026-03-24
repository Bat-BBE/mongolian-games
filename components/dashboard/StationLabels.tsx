import { cn } from "@/lib/utils";
import type { LabelPos } from "./AnimationController";
import { STATION_CONFIGS, isStationUnlockedInJourney } from "./mapConstants";
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
      {stations.map((station) => {
        const lp = labelPositions[station.id];
        if (!lp || !lp.visible) return null;

        const isCurrent = station.id === currentStationId;
        const isDone = doneStationIds.includes(station.id);
        const isUnlocked = isStationUnlockedInJourney(
          station.id,
          currentStationId,
        );
        const isLocked = !isUnlocked;
        const isUpcoming = !isCurrent && !isDone && !isLocked;
        const isSelected = station.id === selectedId;
        const icon = STATION_CONFIGS[station.id]?.icon ?? "📍";

        const opacity = isLocked
          ? 0.48
          : isCurrent
            ? 1
            : isSelected
              ? 0.95
              : isDone
                ? 0.72
                : 0.38;

        return (
          <div
            key={station.id}
            className="absolute pointer-events-auto cursor-pointer select-none"
            style={{
              left: lp.x,
              top: lp.y,
              transform: "translate(-50%, -100%)",
              opacity,
              transition: "opacity 0.3s ease",
              zIndex: isCurrent ? 35 : isSelected ? 25 : isLocked ? 5 : 12,
            }}
            onClick={() => onSelect(station.id)}
          >
            <div className="flex flex-col items-center gap-0">
              <div
                className={cn(
                  "relative flex items-center gap-1 rounded-full border backdrop-blur-sm transition-all duration-200 whitespace-nowrap",
                  isLocked
                    ? "px-2.5 py-1 text-xs font-semibold bg-zinc-950/80 border-zinc-600/50 text-zinc-500 scale-95 shadow-lg"
                    : isCurrent
                      ? "px-3 py-1.5 text-sm font-bold bg-emerald-950/95 border-2 border-emerald-300 text-emerald-50 scale-[1.18] shadow-[0_0_32px_rgba(52,211,153,0.55),0_8px_24px_rgba(0,0,0,0.45)] ring-2 ring-emerald-400/50 ring-offset-2 ring-offset-black/40"
                      : "px-2.5 py-1 text-xs font-semibold shadow-lg",
                  !isLocked &&
                    !isCurrent &&
                    (isSelected
                      ? "bg-primary/85 border-primary text-primary-foreground scale-105"
                      : isDone
                        ? "bg-amber-900/75 border-amber-500/70 text-amber-200"
                        : "bg-gray-900/65 border-gray-500/40 text-gray-300"),
                )}
              >
                {isLocked && (
                  <span className="text-[10px] leading-none opacity-90" title="Түгжигдсэн">
                    🔒
                  </span>
                )}
                {isCurrent && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5">
                    <span className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-75" />
                    <span className="absolute inset-0 bg-emerald-400 rounded-full" />
                  </span>
                )}

                <span className="text-xs leading-none">{icon}</span>

                <span>{station.name}</span>

                {isDone && !isCurrent && (
                  <span className="text-amber-400 text-xs leading-none">✓</span>
                )}

                {isUpcoming && !isSelected && !isLocked && (
                  <span className="text-gray-500 text-xs leading-none">·</span>
                )}
              </div>

              <div
                className={cn(
                  "w-0 h-0",
                  "border-l-[4px] border-r-[4px] border-t-[6px]",
                  "border-l-transparent border-r-transparent",
                  isLocked
                    ? "border-t-zinc-600/60"
                    : isCurrent
                      ? "border-t-emerald-400"
                      : isSelected
                        ? "border-t-primary"
                        : isDone
                          ? "border-t-amber-500/70"
                          : "border-t-gray-500/50",
                )}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
