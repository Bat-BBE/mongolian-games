"use client";

import { useRef, useState } from "react";
import type { DashStrings } from "./dashboard-strings";
import type { UrtuuStation } from "./UrtuuNode";
import { StationPopup } from "./StationPopup";
import { useThreeScene } from "./useThreeScene";
import { StationLabels } from "./StationLabels";
import { MapHUD } from "./MapHUD";
import { MapControls } from "./MapControls";
import { STATION_CONFIGS } from "./mapConstants";

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
    return {
      id,
      name:      fromStrings?.name     ?? id,
      gameName:  fromStrings?.gameName ?? "",
      gameDesc:  fromStrings?.gameDesc ?? "",
      reward:    fromStrings?.reward   ?? "",
      available: fromStrings?.available ?? false,
      pos:       { left: cfg.left, top: cfg.top },
      icon:      cfg.icon,
      isCurrent: id === currentStationId,
      isDone:    doneStationIds?.includes(id) ?? false,
    };
  });

  const selectedStation = stations.find(s => s.id === selectedId) ?? null;

  const { labelPositions } = useThreeScene({
    containerRef: canvasRef,
    stations,
    currentStationId,
    doneStationIds,
  });

  const handleSelect = (id: string) =>
    setSelectedId(prev => (prev === id ? null : id));

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

      {selectedStation && (
        <StationPopup
          station={selectedStation}
          onClose={() => setSelectedId(null)}
          onPlay={id => console.log("Play:", id)}
          loreLabel={t.lore}      
          minigameLabel={t.minigame}
        />
      )}

      {/* <MapHUD t={t} currentStationId={currentStationId} />
      <MapControls /> */}
    </main>
  );
}