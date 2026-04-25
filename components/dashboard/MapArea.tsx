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
import {
  LuBookOpen,
  LuFlame,
  LuGhost,
  LuHand,
  LuHeart,
  LuMusic2,
  LuSmartphone,
  LuSmile,
  LuSparkles,
  LuSwords,
  LuUser,
  LuX,
} from "react-icons/lu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { MapVirtualJoystick } from "./MapVirtualJoystick";
import type { IconType } from "react-icons";

const MAP_LANDSCAPE_HINT_DISMISSED_KEY = "mapLandscapeHintDismissed";

interface MapAreaProps {
  t: DashStrings;
  userEmail: string;
  playerDisplayName: string;
  homeGerLevel?: number;
  homeLivestock?: {
    sheep: number;
    goat: number;
    cow: number;
    horse: number;
    camel: number;
  };
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
  onRegisterFlyHome?: (fly: () => void) => void;
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
  const [mapEmoteOpen, setMapEmoteOpen] = useState(false);
  const [docHidden, setDocHidden] = useState(false);
  const [mapLandscapeHintDismissed, setMapLandscapeHintDismissed] =
    useState(false);
  const [mapLandscapePortraitNarrow, setMapLandscapePortraitNarrow] =
    useState(false);
  const [mapLandscapeHintReady, setMapLandscapeHintReady] = useState(false);

  useEffect(() => {
    const onVis = () => setDocHidden(document.hidden);
    onVis();
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  useEffect(() => {
    try {
      setMapLandscapeHintDismissed(
        localStorage.getItem(MAP_LANDSCAPE_HINT_DISMISSED_KEY) === "1",
      );
    } catch {}
    setMapLandscapeHintReady(true);
  }, []);

  useEffect(() => {
    const mqPortrait = window.matchMedia("(orientation: portrait)");
    const mqNarrow = window.matchMedia("(max-width: 1023px)");
    const sync = () =>
      setMapLandscapePortraitNarrow(mqPortrait.matches && mqNarrow.matches);
    sync();
    mqPortrait.addEventListener("change", sync);
    mqNarrow.addEventListener("change", sync);
    return () => {
      mqPortrait.removeEventListener("change", sync);
      mqNarrow.removeEventListener("change", sync);
    };
  }, []);

  function dismissMapLandscapeHint() {
    try {
      localStorage.setItem(MAP_LANDSCAPE_HINT_DISMISSED_KEY, "1");
    } catch {}
    setMapLandscapeHintDismissed(true);
  }

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const dismissedStationRef = useRef<string | null>(null);
  const [selectedGame, setSelectedGame] = useState<{
    type: string;
    name: string;
    stationSlug: string;
    gameSlug: string;
  } | null>(null);

  const showMapLandscapeHint =
    mapLandscapeHintReady &&
    !mapLandscapeHintDismissed &&
    mapLandscapePortraitNarrow &&
    !selectedGame;

  const mapStationsRevision = useMemo(
    () =>
      apiStations
        .map((s) =>
          [
            s.id,
            s.icon ?? "",
            s.image_url != null ? String(s.image_url) : "",
          ].join(":"),
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
    () => [homeStationForLabel, ...stations.filter((s) => s.id !== "home")],
    [homeStationForLabel, stations],
  );

  const selectedStation = stations.find((s) => s.id === selectedId) ?? null;

  const playerHomeKeyRaw = useMemo(
    () => [userEmail, playerDisplayName].filter(Boolean).join("|"),
    [userEmail, playerDisplayName],
  );
  const presenceHomeKey = useMemo(
    () =>
      (playerHomeKeyRaw && playerHomeKeyRaw.trim()) || userEmail || "guest",
    [playerHomeKeyRaw, userEmail],
  );

  const { publishPose, publishMapEmote, remotePeersRef } = useMapPresence({
    displayName: playerDisplayName?.trim() || userEmail?.trim() || "Тоглогч",
    homeKey: presenceHomeKey,
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
    mapHeroEmoteIds,
    playMapHeroEmote,
    mapVirtualStickRef,
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
    playerHomeKey: playerHomeKeyRaw,
    onHeroAtStationChange,
    paused: !!selectedGame || docHidden,
    presencePublishRef,
    remotePeersRef,
    onLocalMapEmote: publishMapEmote,
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

  const mapEmoteIconById: Record<string, IconType> = {
    wave: LuHand,
    greet: LuSmile,
    kiss: LuHeart,
    dance: LuMusic2,
    boxing: LuSwords,
    booty: LuFlame,
    hip_hop: LuMusic2,
    praying: LuBookOpen,
    silly_dance: LuGhost,
  };

  function mapEmoteAria(id: string): string {
    switch (id) {
      case "idle":
        return t.mapHeroEmoteIdleAria;
      case "wave":
        return t.mapHeroEmoteWaveAria;
      case "greet":
        return t.mapHeroEmoteGreetAria;
      case "kiss":
        return t.mapHeroEmoteKissAria;
      case "dance":
        return t.mapHeroEmoteDanceAria;
      case "boxing":
        return t.mapHeroEmoteBoxingAria;
      case "booty":
        return t.mapHeroEmoteBootyAria;
      case "hip_hop":
        return t.mapHeroEmoteHipHopAria;
      case "praying":
        return t.mapHeroEmotePrayingAria;
      case "silly_dance":
        return t.mapHeroEmoteSillyDanceAria;
      default:
        return id;
    }
  }

  return (
    <main
      data-tour-anchor="map-area"
      className="map-area-root flex-1 min-w-0 relative overflow-hidden"
    >
      <div ref={canvasRef} className="absolute inset-0 min-w-0" />

      {showMapLandscapeHint ? (
        <div
          role="status"
          className={cn(
            "pointer-events-auto absolute left-1/2 z-[59] max-w-[min(calc(100%-1.5rem),22rem)] -translate-x-1/2",
            "top-[max(0.5rem,env(safe-area-inset-top,0px))]",
            "map-ui-surface flex items-start gap-2 rounded-xl py-2 pl-2.5 pr-1",
          )}
        >
          <LuSmartphone
            className="mt-0.5 size-4 shrink-0 rotate-90 text-[color:var(--map-fog)] sm:size-[1.05rem]"
            aria-hidden
          />
          <p
            className="min-w-0 flex-1 text-[11px] font-medium leading-snug sm:text-xs"
            style={{ color: "var(--map-ui-text)" }}
          >
            {t.mapLandscapeHint}
          </p>
          <button
            type="button"
            onClick={dismissMapLandscapeHint}
            className="shrink-0 rounded-lg p-1 text-[color:var(--map-ui-text-muted)] hover:bg-white/10"
            aria-label={t.dialogClose}
          >
            <LuX className="size-4" aria-hidden />
          </button>
        </div>
      ) : null}

      {heroModelPath?.trim() ? (
        <>
          <MapVirtualJoystick
            stickRef={mapVirtualStickRef}
            disabled={!!selectedGame || docHidden}
            ariaLabel={t.mapJoystickMoveAria}
            className="absolute right-3 bottom-[max(5.5rem,calc(4.5rem+env(safe-area-inset-bottom,0px)))] lg:hidden"
          />
          <Popover open={mapEmoteOpen} onOpenChange={setMapEmoteOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                title={t.mapHeroEmoteMenuAria}
                aria-label={t.mapHeroEmoteMenuAria}
                className={cn(
                  "map-ui-fab pointer-events-auto absolute right-3 z-[60] flex h-9 w-9 items-center justify-center rounded-full",
                  "top-[max(0.5rem,env(safe-area-inset-top,0px))] md:top-4",
                )}
              >
                <LuSparkles
                  className="size-5 text-[color:var(--gold-pale)]"
                  aria-hidden
                />
              </button>
            </PopoverTrigger>
            <PopoverContent
              side="top"
              align="end"
              sideOffset={8}
              className="z-[200] w-auto border border-white/30 bg-slate-950/98 p-1.5 text-popover-foreground shadow-2xl backdrop-blur-md"
            >
              <div
                className="flex flex-wrap justify-end gap-1.5"
                role="group"
                aria-label={t.mapHeroEmoteMenuAria}
              >
                <button
                  type="button"
                  title={t.mapHeroEmoteIdleAria}
                  aria-label={t.mapHeroEmoteIdleAria}
                  onClick={() => {
                    playMapHeroEmote("idle");
                    setMapEmoteOpen(false);
                  }}
                  className="map-ui-ghost-btn flex h-9 w-9 items-center justify-center rounded-full"
                >
                  <LuUser className="size-5" aria-hidden />
                </button>
                {mapHeroEmoteIds.map((id) => {
                  const Icon = mapEmoteIconById[id];
                  if (!Icon) return null;
                  return (
                    <button
                      key={id}
                      type="button"
                      title={mapEmoteAria(id)}
                      aria-label={mapEmoteAria(id)}
                      onClick={() => {
                        playMapHeroEmote(id);
                        setMapEmoteOpen(false);
                      }}
                      className="map-ui-ghost-btn flex h-9 w-9 items-center justify-center rounded-full"
                    >
                      <Icon className="size-5" aria-hidden />
                    </button>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>
        </>
      ) : null}

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
