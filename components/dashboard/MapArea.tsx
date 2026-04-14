"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { DashStrings } from "./dashboard-strings";
import type { MapStationGamePreview } from "@/lib/api";
import type { UrtuuStation } from "./UrtuuNode";
import { StationPopup } from "./StationPopup";
import { useThreeScene } from "./useThreeScene";
import { StationLabels } from "./StationLabels";
import { STATION_CONFIGS } from "./mapConstants";
import GameModal from "@/components/game/gameModal";

interface MapAreaProps {
  t: DashStrings;
  userEmail: string;
  homeGerLevel?: number;
  homeLivestock?: { sheep: number; horse: number; camel: number };
  currentStationId: string;
  doneStationIds: string[];
  stationSteps?: Record<string, { completedGameSlugs: string[] }>;
  stationVisits?: Record<string, number[]>;
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
  onGameCompleted?: () => void;
  onOpenHome?: () => void;
  /** Гэрт шууд очих (камер) — зүүн самбарын товч */
  onRegisterFlyHome?: (fly: () => void) => void;
  /** Газрын зураг дээр баатар аль өртөөний хаалганд байгаа — зүүн самбар */
  onHeroAtStationChange?: (stationId: string | null) => void;
}

export function MapArea({
  t,
  userEmail,
  homeGerLevel = 1,
  homeLivestock,
  currentStationId,
  doneStationIds,
  stationSteps,
  stationVisits,
  stations: apiStations,
  heroModelPath,
  onGameCompleted,
  onOpenHome,
  onRegisterFlyHome,
  onHeroAtStationChange,
}: MapAreaProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const dismissedStationRef = useRef<string | null>(null);
  const [selectedGame, setSelectedGame] = useState<{
    type: string;
    name: string;
    stationSlug: string;
    gameSlug: string;
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
        isCurrent:
          currentStationId !== "home" && id === currentStationId,
        isDone: doneStationIds?.includes(id) ?? false,
      };
    },
  );

  const homeStationForLabel: UrtuuStation = useMemo(
    () => ({
      id: "home",
      name: t.mapHomePinLabel,
      gameName: "",
      gameDesc: "",
      reward: "",
      available: true,
      pos: { left: "0%", top: "0%" },
      icon: "🏠",
      isCurrent: currentStationId === "home",
      isDone: false,
    }),
    [currentStationId, t.mapHomePinLabel],
  );

  const stationsForLabels = useMemo(
    () => [homeStationForLabel, ...stations],
    [homeStationForLabel, stations],
  );

  const selectedStation =
    stations.find((s) => s.id === selectedId) ?? null;

  /** Шошго нь зөвхөн `visibleStationId`-д харагддаг тул энд нэмэлт шалгалт хэрэггүй. */
  function handleStationFocus(id: string) {
    if (id === "home") {
      onOpenHome?.();
      return;
    }
    setSelectedId((prev) => (prev === id ? null : id));
  }

  const {
    labelPositions,
    heroAtStationId,
    labelUi,
    labelZoomScale,
    showAllMapLabels,
    goToHomeGer,
  } = useThreeScene({
      containerRef: canvasRef,
      stations,
      currentStationId,
      doneStationIds,
      onSelectStation: handleStationFocus,
      heroModelPath,
      homeGerLevel,
      homeLivestock,
      onHeroAtStationChange,
    });

  useEffect(() => {
    onRegisterFlyHome?.(goToHomeGer);
  }, [onRegisterFlyHome, goToHomeGer]);

  useEffect(() => {
    if (!heroAtStationId) {
      dismissedStationRef.current = null;
      setSelectedId(null);
      return;
    }
    if (heroAtStationId === "home") {
      setSelectedId(null);
      return;
    }
    if (dismissedStationRef.current === heroAtStationId) return;
    setSelectedId(heroAtStationId);
  }, [heroAtStationId]);

  return (
    <main className="flex-1 min-w-0 relative overflow-hidden bg-background">
      <div ref={canvasRef} className="absolute inset-0 min-w-0" />

      <StationLabels
        stations={stationsForLabels}
        labelPositions={labelPositions}
        currentStationId={currentStationId}
        heroAtStationId={heroAtStationId}
        doneStationIds={doneStationIds}
        stationVisits={stationVisits}
        selectedId={selectedId}
        visibleStationId={labelUi.stationId}
        labelApproachAlpha={labelUi.alpha}
        labelZoomScale={labelZoomScale}
        showAllVisibleLabels={showAllMapLabels}
        homeLabelTitle={t.mapHomePinLabel}
        onSelect={handleStationFocus}
      />

      {selectedStation && (
        <StationPopup
          station={selectedStation}
          onClose={() => {
            dismissedStationRef.current = selectedStation.id;
            setSelectedId(null);
          }}
          onPlay={(slug, name) => {
            if (!slug) return;
            setSelectedGame({
              type: slug,
              name: name || selectedStation.gameName,
              stationSlug: selectedStation.id,
              gameSlug: slug,
            });
          }}
          loreLabel={t.lore}
          minigameLabel={t.minigame}
          regionLabel={t.mapRegionLabel}
          gamesSectionLabel={t.gamesAtStation}
          lockedHint={t.gameStatusLocked}
          doneHint={t.gameStatusDone}
          canPlay
          stationSteps={stationSteps}
          stationVisits={stationVisits}
        />
      )}

      {selectedGame && (
        <GameModal
          isOpen={!!selectedGame}
          onClose={() => setSelectedGame(null)}
          gameType={selectedGame.type}
          gameName={selectedGame.name}
          stationSlug={selectedGame.stationSlug}
          gameSlug={selectedGame.gameSlug}
          onCompleted={(r) => {
            if (r === "win") onGameCompleted?.();
            setSelectedGame(null);
          }}
        />
      )}
    </main>
  );
}
