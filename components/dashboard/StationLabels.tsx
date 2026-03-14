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
        // visible шалгахдаа z-clip-г бага зэрэг нэмж өгнө
        if (!lp || !lp.visible) return null;

        const isCurrent  = station.id === currentStationId;
        const isDone     = doneStationIds.includes(station.id);
        const isUpcoming = !isCurrent && !isDone;
        const isSelected = station.id === selectedId;
        const icon       = STATION_CONFIGS[station.id]?.icon ?? "📍";

        // Opacity: current=1, done=0.85, upcoming=0.38
        // Selected бол үргэлж тод
        const opacity = isSelected
          ? 1
          : isCurrent
          ? 1
          : isDone
          ? 0.82
          : 0.35;

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
            }}
            onClick={() => onSelect(station.id)}
          >
            <div className="flex flex-col items-center gap-0">

              {/* ── Label badge ──────────────────────────────── */}
              <div
                className={cn(
                  "relative flex items-center gap-1 rounded-full border shadow-lg backdrop-blur-sm transition-all duration-200 px-2.5 py-1 text-xs font-semibold whitespace-nowrap",
                  isCurrent
                    ? "bg-emerald-900/90 border-emerald-400 text-emerald-100 shadow-emerald-500/40 shadow-xl scale-110"
                    : isSelected
                    ? "bg-primary/85 border-primary text-primary-foreground scale-105"
                    : isDone
                    ? "bg-amber-900/75 border-amber-500/70 text-amber-200"
                    : "bg-gray-900/65 border-gray-500/40 text-gray-300",
                )}
              >
                {/* Pulsing dot — current станц */}
                {isCurrent && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5">
                    <span className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-75" />
                    <span className="absolute inset-0 bg-emerald-400 rounded-full" />
                  </span>
                )}

                {/* Icon */}
                <span className="text-xs leading-none">{icon}</span>

                {/* Нэр — бүх төлөвт харуулна */}
                <span>{station.name}</span>

                {/* Done тэмдэг */}
                {isDone && !isCurrent && (
                  <span className="text-amber-400 text-xs leading-none">✓</span>
                )}

                {/* Upcoming тэмдэг */}
                {isUpcoming && !isSelected && (
                  <span className="text-gray-500 text-xs leading-none">·</span>
                )}
              </div>

              {/* ── Pointer triangle ─────────────────────────── */}
              <div
                className={cn(
                  "w-0 h-0",
                  "border-l-[4px] border-r-[4px] border-t-[6px]",
                  "border-l-transparent border-r-transparent",
                  isCurrent
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