import type { DashStrings } from "./dashboard-strings";

interface MapHUDProps {
  t: DashStrings;
  currentStationId: string;
}

export function MapHUD({ t, currentStationId }: MapHUDProps) {
  const stationName =
    t.stations.find(s => s.id === currentStationId)?.name ?? currentStationId;

  return (
    <div className="absolute bottom-4 left-4 z-30 pointer-events-none">
      <div className="backdrop-blur-md bg-black/42 p-3 rounded-lg border border-white/12 shadow-lg">
        <div className="text-xs text-white/72 uppercase tracking-wider flex gap-4">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Х: 47.9°N
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            У: 106.9°E
          </span>
        </div>
        <div className="text-sm font-medium mt-1 text-white/92">
          {t.currentLocation}: {stationName}
        </div>
      </div>
    </div>
  );
}