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
      <div className="map-hud-pill p-3 rounded-lg shadow-lg">
        <div
          className="text-xs uppercase tracking-wider flex gap-4"
          style={{ color: "var(--map-ui-text-muted)" }}
        >
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400/90 animate-pulse" />
            Х: 47.9°N
          </span>
          <span className="flex items-center gap-1">
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ background: "var(--map-sky)" }}
            />
            У: 106.9°E
          </span>
        </div>
        <div
          className="text-sm font-medium mt-1"
          style={{ color: "var(--map-ui-text)" }}
        >
          {t.currentLocation}: {stationName}
        </div>
      </div>
    </div>
  );
}