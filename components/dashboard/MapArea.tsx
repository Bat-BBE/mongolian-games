"use client";

import { useRef, useState } from "react";
import type { DashStrings } from "./dashboard-strings";
import type { UrtuuStation } from "./UrtuuNode";
import { StationPopup } from "./StationPopup";
import { useThreeScene } from "./useThreeScene";
import { StationLabels } from "./StationLabels";
import { MapHUD } from "./MapHUD";
import { MapControls } from "./MapControls";
import { STATION_CONFIGS, isStationUnlockedInJourney } from "./mapConstants";
import { MapPinned } from "lucide-react";

interface MapAreaProps {
  t: DashStrings;
  currentStationId: string;
  doneStationIds: string[];
}

export function MapArea({ t, currentStationId, doneStationIds }: MapAreaProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const stationMap = new Map(
    (t?.stations ?? []).map(s => [s.id, s])
  );
  const stations: UrtuuStation[] = Object.entries(STATION_CONFIGS).map(([id, cfg]) => {
    const fromStrings = stationMap.get(id);
    const firstGame = fromStrings?.games?.[0];
    return {
      id,
      name:      fromStrings?.name     ?? id,
      gameName:  firstGame?.name ?? "",
      gameDesc:  firstGame?.desc ?? "",
      reward:    firstGame?.reward   ?? "",
      available: fromStrings?.available ?? false,
      pos:       { left: cfg.left, top: cfg.top },
      icon:      cfg.icon,
      isCurrent: id === currentStationId,
      isDone:    doneStationIds?.includes(id) ?? false,
    };
  });

  const selectedStation = stations.find(s => s.id === selectedId) ?? null;
  const isViewingLockedStation =
    selectedId != null &&
    !isStationUnlockedInJourney(selectedId, currentStationId);

  const { labelPositions, flyToStation } = useThreeScene({
    containerRef: canvasRef,
    stations,
    currentStationId,
    doneStationIds,
  });

  const handleSelect = (id: string) => {
    setSelectedId((prev) => {
      if (prev === id) return null;
      flyToStation(id, true);
      return id;
    });
  };

  return (
    <main className="flex-1 relative overflow-hidden bg-background">
      <div ref={canvasRef} className="absolute inset-0" />

      <StationLabels
        stations={stations}
        labelPositions={labelPositions}
        currentStationId={currentStationId}
        doneStationIds={doneStationIds}
        selectedId={selectedId}
        onSelect={handleSelect}
      />

      {isViewingLockedStation && (
        <div className="absolute top-4 left-1/2 z-[45] -translate-x-1/2 pointer-events-auto">
          <button
            type="button"
            onClick={() => {
              flyToStation(currentStationId, true);
              setSelectedId(currentStationId);
            }}
            className="flex items-center gap-2 rounded-full border border-emerald-500/60 bg-emerald-950/90 px-4 py-2 text-sm font-semibold text-emerald-100 shadow-lg shadow-emerald-900/40 backdrop-blur-sm transition-all hover:scale-[1.02] hover:border-emerald-400 hover:bg-emerald-900/95"
          >
            <MapPinned className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
            Одоогийн өртөө рүү очих
          </button>
        </div>
      )}

      {selectedStation && (
        <StationPopup
          station={selectedStation}
          onClose={() => setSelectedId(null)}
          onPlay={id => console.log("Play:", id)}
          loreLabel={t.lore}
          minigameLabel={t.minigame}
          canPlay={selectedStation.id === currentStationId}
        />
      )}

      {/* <MapHUD t={t} currentStationId={currentStationId} />
      <MapControls /> */}
    </main>
  );
}