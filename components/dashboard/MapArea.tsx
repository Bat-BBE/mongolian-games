"use client";

import { useEffect, useRef, useState } from "react";
import type { DashStrings } from "./dashboard-strings";
import type { MapStationGamePreview } from "@/lib/api";
import type { UrtuuStation } from "./UrtuuNode";
import { StationPopup } from "./StationPopup";
import { useThreeScene } from "./useThreeScene";
import { StationLabels } from "./StationLabels";
import { MapHUD } from "./MapHUD";
import { MapControls } from "./MapControls";
import {
  JOURNEY_ORDER,
  STATION_CONFIGS,
  isStationUnlockedInJourney,
} from "./mapConstants";
import { LuMapPinned as MapPinned } from "react-icons/lu";
import GameModal from "@/components/game/gameModal";

interface MapAreaProps {
  t: DashStrings;
  currentStationId: string;
  doneStationIds: string[];
  stations: {
    id: string;
    name: string;
    region?: string;
    pos?: { left?: string; top?: string };
    icon?: string;
    available?: boolean;
    games?: MapStationGamePreview[];
    game?: { slug?: string; name: string; desc: string; reward: string };
  }[];
  heroModelPath?: string | null;
}

export function MapArea({
  t,
  currentStationId,
  doneStationIds,
  stations: apiStations,
  heroModelPath,
}: MapAreaProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [heroTargetId, setHeroTargetId] = useState<string | null>(null);
  const [selectedGame, setSelectedGame] = useState<{
    type: string;
    name: string;
  } | null>(null);

  const stationMap = new Map(apiStations.map((s) => [s.id, s]));
  const stations: UrtuuStation[] = Object.entries(STATION_CONFIGS).map(
    ([id, cfg]) => {
      const fromApi = stationMap.get(id);
      const games: MapStationGamePreview[] =
        fromApi?.games?.length && fromApi.games.length > 0
          ? fromApi.games
          : fromApi?.game?.name
            ? [
                {
                  slug: fromApi.game.slug ?? "",
                  name: fromApi.game.name,
                  desc: fromApi.game.desc,
                  reward: fromApi.game.reward,
                },
              ]
            : [];
      const firstGame = games[0];
      return {
        id,
        name: fromApi?.name ?? id,
        region: fromApi?.region,
        games: games.length > 0 ? games : undefined,
        gameSlug: firstGame?.slug,
        gameName: firstGame?.name ?? "",
        gameDesc: firstGame?.desc ?? "",
        reward: firstGame?.reward ?? "",
        available: fromApi?.available ?? false,
        pos: {
          left: fromApi?.pos?.left ?? cfg.left,
          top: fromApi?.pos?.top ?? cfg.top,
        },
        icon: fromApi?.icon ?? cfg.icon,
        isCurrent: id === currentStationId,
        isDone: doneStationIds?.includes(id) ?? false,
      };
    },
  );

  const selectedStation = stations.find((s) => s.id === selectedId) ?? null;
  const isViewingLockedStation =
    selectedId != null &&
    !isStationUnlockedInJourney(selectedId, currentStationId);

  function handleSelect(id: string) {
    setSelectedId((prev) => {
      if (prev === id) return null;
      flyToStation(id, true);
      return id;
    });
    // If user clicked label/door, also set hero target so hero can walk there.
    setHeroTargetId(id);
  }

  const { labelPositions, flyToStation } = useThreeScene({
    containerRef: canvasRef,
    stations,
    currentStationId,
    doneStationIds,
    onSelectStation: handleSelect,
    onHeroArriveStation: (id) => {
      // Arrived at a station door → open its dialog automatically.
      setSelectedId(id);
      flyToStation(id, true);
    },
    heroModelPath,
    heroTargetStationId: heroTargetId,
  });

  // Keyboard control: move hero along journey with arrows / A-D.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.key !== "ArrowLeft" &&
        e.key !== "ArrowRight" &&
        e.key !== "a" &&
        e.key !== "d"
      )
        return;
      // Don't steal keys if a modal is open.
      if (selectedGame) return;
      const dir = e.key === "ArrowLeft" || e.key === "a" ? -1 : 1;
      const base = heroTargetId ?? selectedId ?? currentStationId;
      const startIdx = Math.max(0, JOURNEY_ORDER.indexOf(base));
      let idx = startIdx;
      for (let steps = 0; steps < JOURNEY_ORDER.length; steps++) {
        idx = (idx + dir + JOURNEY_ORDER.length) % JOURNEY_ORDER.length;
        const cand = JOURNEY_ORDER[idx];
        if (isStationUnlockedInJourney(cand, currentStationId)) {
          setHeroTargetId(cand);
          flyToStation(cand, false);
          break;
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [currentStationId, flyToStation, heroTargetId, selectedGame, selectedId]);

  return (
    <main className="flex-1 relative overflow-hidden bg-background">
      <div ref={canvasRef} className="absolute inset-0" />

      {/* Route hint (current -> hero target) */}
      {heroTargetId &&
        heroTargetId !== currentStationId &&
        labelPositions[currentStationId]?.visible &&
        labelPositions[heroTargetId]?.visible && (
          <svg className="absolute inset-0 z-[9] pointer-events-none">
            <defs>
              <marker
                id="routeArrow"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path
                  d="M 0 0 L 10 5 L 0 10 z"
                  fill="rgba(245, 158, 11, 0.95)"
                />
              </marker>
            </defs>
            <line
              x1={labelPositions[currentStationId].x}
              y1={labelPositions[currentStationId].y}
              x2={labelPositions[heroTargetId].x}
              y2={labelPositions[heroTargetId].y}
              stroke="rgba(245, 158, 11, 0.85)"
              strokeWidth={3}
              strokeDasharray="10 10"
              markerEnd="url(#routeArrow)"
            />
          </svg>
        )}

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
            <MapPinned
              className="h-4 w-4 shrink-0 text-emerald-400"
              aria-hidden
            />
            Одоогийн өртөө рүү очих
          </button>
        </div>
      )}

      {selectedStation && (
        <StationPopup
          station={selectedStation}
          onClose={() => setSelectedId(null)}
          onPlay={(slug, name) => {
            if (!slug) return;
            setSelectedGame({ type: slug, name: name || selectedStation.gameName });
          }}
          loreLabel={t.lore}
          minigameLabel={t.minigame}
          regionLabel={t.mapRegionLabel}
          gamesSectionLabel={t.gamesAtStation}
          lockedHint={t.gameStatusLocked}
          doneHint={t.gameStatusDone}
          canPlay={selectedStation.id === currentStationId}
        />
      )}

      {selectedGame && (
        <GameModal
          isOpen={!!selectedGame}
          onClose={() => setSelectedGame(null)}
          gameType={selectedGame.type}
          gameName={selectedGame.name}
        />
      )}
    </main>
  );
}
