"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMapPresence } from "@/hooks/useMapPresence";
import { cn } from "@/lib/utils";
import type { DashStrings } from "./dashboard-strings";
import type { MapStationGamePreview } from "@/lib/api";
import type { UrtuuStation } from "./UrtuuNode";
import { StationPopup } from "./StationPopup";
import { useThreeScene } from "./useThreeScene";
import { StationLabels } from "./StationLabels";
import { STATION_CONFIGS } from "./mapConstants";
import GameModal from "@/components/game/gameModal";
import { resolveAssetUrl } from "@/lib/api";
import { LuCircleHelp as HelpCircle } from "react-icons/lu";

interface MapAreaProps {
  t: DashStrings;
  userEmail: string;
  /** Газрын presence дээр харагдах нэр */
  playerDisplayName: string;
  homeGerLevel?: number;
  homeLivestock?: { sheep: number; goat: number; cow: number; horse: number; camel: number };
  currentStationId: string;
  doneStationIds: string[];
  stationSteps?: Record<string, { completedGameSlugs: string[] }>;
  stationGameVisits?: Record<string, Record<string, number[]>>;
  stations: {
    id: string;
    name: string;
    region?: string;
    pos?: { left?: string; top?: string };
    icon?: string;
    image_url?: string | null;
    available?: boolean;
    games?: MapStationGamePreview[];
    game?: { slug?: string; name: string; desc: string; reward: string };
    quest_hint?: string | null;
    quest_desc?: string | null;
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
  playerDisplayName,
  homeGerLevel = 1,
  homeLivestock,
  currentStationId,
  doneStationIds,
  stationSteps,
  stationGameVisits,
  stations: apiStations,
  heroModelPath,
  onGameCompleted,
  onOpenHome,
  onRegisterFlyHome,
  onHeroAtStationChange,
}: MapAreaProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const presencePublishRef = useRef<
    ((x: number, z: number, ry: number) => void) | null
  >(null);
  const [mapGuideOpen, setMapGuideOpen] = useState(false);
  const [docHidden, setDocHidden] = useState(false);
  useEffect(() => {
    const onVis = () => setDocHidden(document.hidden);
    onVis();
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const dismissedStationRef = useRef<string | null>(null);
  const [selectedGame, setSelectedGame] = useState<{
    type: string;
    name: string;
    stationSlug: string;
    gameSlug: string;
  } | null>(null);

  const mapStationsRevision = useMemo(
    () =>
      apiStations
        .map((s) =>
          [s.id, s.icon ?? "", s.image_url != null ? String(s.image_url) : ""].join(
            ":",
          ),
        )
        .sort()
        .join("|"),
    [apiStations],
  );

  const presenceLivestock = useMemo(() => {
    if (!homeLivestock) return null;
    return {
      sheep: homeLivestock.sheep,
      goat: homeLivestock.goat,
      cow: homeLivestock.cow,
      horse: homeLivestock.horse,
      camel: homeLivestock.camel,
    };
  }, [
    homeLivestock?.sheep,
    homeLivestock?.goat,
    homeLivestock?.cow,
    homeLivestock?.horse,
    homeLivestock?.camel,
  ]);

  const stations: UrtuuStation[] = useMemo(() => {
    const stationMap = new Map(apiStations.map((s) => [s.id, s]));
    return Object.entries(STATION_CONFIGS).map(([id, cfg]) => {
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
      const rawImg = fromApi?.image_url;
      const imageUrl =
        typeof rawImg === "string" && rawImg.trim()
          ? resolveAssetUrl(rawImg.trim())
          : undefined;
      return {
        id,
        name: fromApi?.name ?? id,
        region: fromApi?.region,
        games: games.length > 0 ? games : undefined,
        gameSlug: firstGame?.slug,
        gameName: firstGame?.name ?? "",
        gameDesc: firstGame?.desc ?? "",
        reward: firstGame?.reward ?? "",
        questHint: fromApi?.quest_hint?.trim() || null,
        questDesc: fromApi?.quest_desc?.trim() || null,
        available: fromApi?.available ?? false,
        pos: {
          left: fromApi?.pos?.left ?? cfg.left,
          top: fromApi?.pos?.top ?? cfg.top,
        },
        icon: fromApi?.icon ?? cfg.icon,
        imageUrl,
        isCurrent: currentStationId !== "home" && id === currentStationId,
        isDone: doneStationIds?.includes(id) ?? false,
      };
    });
  }, [apiStations, currentStationId, doneStationIds]);

  const homeStationForLabel: UrtuuStation = useMemo(
    () => ({
      id: "home",
      name: t.mapHomePinLabel,
      gameName: "",
      gameDesc: "",
      reward: "",
      available: true,
      pos: { left: "0%", top: "0%" },
      icon: "🛖",
      isCurrent: currentStationId === "home",
      isDone: false,
    }),
    [currentStationId, t.mapHomePinLabel],
  );

  const stationsForLabels = useMemo(
    () => [homeStationForLabel, ...stations],
    [homeStationForLabel, stations],
  );

  const selectedStation = stations.find((s) => s.id === selectedId) ?? null;

  const { publishPose, remotePeersRef } = useMapPresence({
    displayName: playerDisplayName?.trim() || userEmail?.trim() || "Тоглогч",
    /** Тоглоомын цонх нээхэд WS хаавал бусдад peer_left — холболт тасрах шалтгаан болдог */
    enabled: !docHidden,
    heroModelPath: heroModelPath ?? null,
    gerLevel: homeGerLevel,
    livestock: presenceLivestock,
  });
  presencePublishRef.current = publishPose;

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
    travelToStation,
  } = useThreeScene({
    containerRef: canvasRef,
    stations,
    mapStationsRevision,
    currentStationId,
    doneStationIds,
    onSelectStation: handleStationFocus,
    heroModelPath,
    homeGerLevel,
    homeLivestock,
    userEmail,
    playerHomeKey: [userEmail, playerDisplayName].filter(Boolean).join("|"),
    onHeroAtStationChange,
    paused: !!selectedGame || docHidden,
    presencePublishRef,
    remotePeersRef,
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
    <main
      data-tour-anchor="map-area"
      className="flex-1 min-w-0 relative overflow-hidden bg-background"
    >
      <div ref={canvasRef} className="absolute inset-0 min-w-0" />

      {mapGuideOpen ? (
        <aside
          className={cn(
            "pointer-events-auto absolute left-3 top-3 z-[60] max-h-[min(46vh,320px)] w-[min(calc(100%-1.5rem),15rem)] overflow-y-auto",
            "rounded-xl border border-sky-400/20 bg-gradient-to-b from-slate-950/96 to-slate-900/94 p-2.5 shadow-2xl backdrop-blur-md",
            "ring-1 ring-white/10",
          )}
          aria-label={t.mapGuideTitle}
        >
          <div className="flex items-start justify-between gap-2">
            <p className="min-w-0 text-[11px] font-semibold leading-tight text-sky-200/95">
              {t.mapGuideTitle}
            </p>
            <button
              type="button"
              onClick={() => setMapGuideOpen(false)}
              className="shrink-0 rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[9px] font-semibold text-slate-300 hover:bg-white/10"
            >
              {t.mapGuideHide}
            </button>
          </div>
          <ol className="mt-2 list-decimal space-y-1 pl-3.5 text-[10px] leading-snug text-slate-100/90 marker:font-semibold marker:text-sky-300/85">
            <li>{t.mapGuideStep1}</li>
            <li>{t.mapGuideStep2}</li>
            <li>{t.mapGuideStep3}</li>
          </ol>
        </aside>
      ) : (
        <button
          type="button"
          onClick={() => setMapGuideOpen(true)}
          title={t.mapGuideShow}
          aria-label={t.mapGuideShow}
          className="pointer-events-auto absolute left-3 top-3 z-[60] flex h-9 w-9 items-center justify-center rounded-full border border-sky-500/35 bg-slate-950/92 text-sky-200 shadow-lg backdrop-blur-md hover:bg-slate-900 hover:border-sky-400/50"
        >
          <HelpCircle className="size-[1.125rem]" aria-hidden />
        </button>
      )}

      <StationLabels
        stations={stationsForLabels}
        labelPositions={labelPositions}
        currentStationId={currentStationId}
        heroAtStationId={heroAtStationId}
        doneStationIds={doneStationIds}
        stationGameVisits={stationGameVisits}
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
          regionLabel={t.mapRegionLabel}
          gamesSectionLabel={t.gamesAtStation}
          historyTitle={t.mapStationHistoryTitle}
          playLabel={t.mapPlayGameShort}
          lockedHint={t.gameStatusLocked}
          doneHint={t.gameStatusDone}
          canPlay
          stationSteps={stationSteps}
          stationGameVisits={stationGameVisits}
          onTravel={() => {
            travelToStation(selectedStation.id);
            setSelectedId(null);
          }}
          onReturnHome={() => {
            goToHomeGer();
            setSelectedId(null);
          }}
          travelLabel={t.mapTravelToStation}
          returnHomeLabel={t.mapReturnHome}
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
