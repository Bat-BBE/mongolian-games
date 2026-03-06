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

        const isCurrent = station.id === currentStationId;
        const isDone    = doneStationIds.includes(station.id);
        const icon      = STATION_CONFIGS[station.id]?.icon ?? "📍";

        return (
          <div
            key={station.id}
            className="absolute pointer-events-auto cursor-pointer select-none"
            style={{ left: lp.x, top: lp.y, transform: "translate(-50%, -100%)" }}
            onClick={() => onSelect(station.id)}
          >
            <div className="flex flex-col items-center">
              <div
                className={[
                  "relative px-3 py-1.5 rounded-full text-xs font-bold tracking-wide",
                  "border shadow-lg backdrop-blur-sm transition-all duration-200",
                  isCurrent
                    ? "bg-emerald-900/88 border-emerald-400 text-emerald-200 shadow-emerald-500/50 shadow-xl scale-110"
                    : isDone
                    ? "bg-amber-900/82 border-amber-400 text-amber-200 shadow-amber-500/35"
                    : "bg-gray-900/78 border-gray-500/60 text-gray-300",
                ].join(" ")}
                style={{ whiteSpace: "nowrap" }}
              >
                {isCurrent && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full">
                    <span className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-75" />
                  </span>
                )}

                <span className="mr-1">{icon}</span>
                {station.name}
                {isDone && !isCurrent && (
                  <span className="ml-1 text-amber-400">✓</span>
                )}
              </div>
              <div
                className={[
                  "w-0 h-0",
                  "border-l-[5px] border-r-[5px] border-t-[7px]",
                  "border-l-transparent border-r-transparent",
                  isCurrent
                    ? "border-t-emerald-400"
                    : isDone
                    ? "border-t-amber-400"
                    : "border-t-gray-500",
                ].join(" ")}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}