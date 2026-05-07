"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMapPresence } from "@/hooks/useMapPresence";
import { cn } from "@/lib/utils";
import type { DashStrings, DashLang } from "./dashboard-strings";
import type { MapStationGamePreview } from "@/lib/api";
import type { UrtuuStation } from "./UrtuuNode";
import { StationPopup } from "./StationPopup";
import { useThreeScene } from "./useThreeScene";
import { StationLabels } from "./StationLabels";
import {
  gameWeeklyPlaysRemaining,
  STATION_CONFIGS,
  STATION_GAME_WEEKLY_PLAY_CAP,
} from "./mapConstants";
import { getMapWorldPoiById } from "./mapWorldPoi";
import GameModal from "@/components/game/gameModal";
import {
  resolveAssetUrl,
  type OnisogoMapPoint,
  type StationGameBundleRow,
} from "@/lib/api";
import { MapOnisogoModal } from "./MapOnisogoModal";
import {
  MapFirstVisitCoach,
  readMapCoachDone,
} from "./MapFirstVisitCoach";
import { MapFloatingTopBar } from "./MapFloatingTopBarRestored";
import { MapFloatingQuestPanel } from "./MapFloatingQuestPanel";
import type { IconType } from "react-icons";
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
  LuVolume2,
  LuVolumeX,
  LuX,
} from "react-icons/lu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { MapVirtualJoystick } from "./MapVirtualJoystick";
import { MapGlobalChatFab } from "./MapGlobalChatFab";
import { useMapAmbientAudio } from "@/hooks/useMapAmbientAudio";
import { playStationApproachSfx } from "@/lib/uiSounds";

const MAP_LANDSCAPE_HINT_DISMISSED_KEY = "mapLandscapeHintDismissed";
const MAP_AUDIO_MUTED_KEY = "mapAudioMuted";
const MAP_AUDIO_VOLUME_KEY = "mapAudioVolume";

interface MapAreaProps {
  t: DashStrings;
  lang: DashLang;
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
  /** Хаагдсаныг мэдэх — гэрт зогсож байхад дахиж автоматаар нээхгүй */
  homeModalOpen?: boolean;
  onRegisterFlyHome?: (fly: () => void) => void;
  onHeroAtStationChange?: (stationId: string | null) => void;

  /** Газрын дээр float HUD (DashNav/LeftPanel-ийн орлогч) */
  mapHudSetLang: (l: DashLang) => void;
  mapHudPlayerName: string;
  mapHudPlayerTitle: string;
  mapHudAvatarUrl: string;
  mapHudLevel: number;
  mapHudUserEmail: string;
  mapHudCoins: number;
  mapHudGems?: number;
  mapHudGerLevel: number;
  mapHudKp: number;
  mapHudLivestock?: {
    sheep: number;
    goat: number;
    cow: number;
    horse: number;
    camel: number;
  };
  mapHudLivestockTotal?: number;
  mapHudOnTreasuryChanged?: () => void;
  mapHudOnOpenProfile: () => void;
  mapHudOnLogout: () => void;
  mapHudOnOpenLeaderboard?: () => void;
  mapHudOnShowIntroTour?: () => void;
  stationGames: StationGameBundleRow[];
  currentStationLabel?: string;
  onisogoPoints?: OnisogoMapPoint[];
  onisogoSolvedSlugs?: string[];
  onOnisogoSolved?: () => void;
}

export function MapArea({
  t,
  lang,
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
  homeModalOpen = false,
  onRegisterFlyHome,
  onHeroAtStationChange,
  mapHudSetLang,
  mapHudPlayerName,
  mapHudPlayerTitle,
  mapHudAvatarUrl,
  mapHudLevel,
  mapHudUserEmail,
  mapHudCoins,
  mapHudGems = 0,
  mapHudGerLevel,
  mapHudKp,
  mapHudLivestock,
  mapHudLivestockTotal = 0,
  mapHudOnTreasuryChanged,
  mapHudOnOpenProfile,
  mapHudOnLogout,
  mapHudOnOpenLeaderboard,
  mapHudOnShowIntroTour,
  stationGames,
  currentStationLabel,
  onisogoPoints = [],
  onisogoSolvedSlugs = [],
  onOnisogoSolved,
}: MapAreaProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const presencePublishRef = useRef<
    ((x: number, z: number, ry: number) => void) | null
  >(null);
  const [questSheetOpen, setQuestSheetOpen] = useState(true);
  const [mapEmoteOpen, setMapEmoteOpen] = useState(false);
  const [docHidden, setDocHidden] = useState(false);
  const [mapLandscapeHintDismissed, setMapLandscapeHintDismissed] =
    useState(false);
  const [mapLandscapePortraitNarrow, setMapLandscapePortraitNarrow] =
    useState(false);
  const [mapLandscapeHintReady, setMapLandscapeHintReady] = useState(false);
  const [mapGuideReady, setMapGuideReady] = useState(false);
  const [mapCoachDone, setMapCoachDoneState] = useState(false);
  const [mapCoachReplay, setMapCoachReplay] = useState(false);
  const [audioOpen, setAudioOpen] = useState(false);
  const [mapAudioMuted, setMapAudioMuted] = useState(false);
  const [mapAudioVolume, setMapAudioVolume] = useState(0.42);

  useEffect(() => {
    const onVis = () => setDocHidden(document.hidden);
    onVis();
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  useEffect(() => {
    try {
      setMapAudioMuted(localStorage.getItem(MAP_AUDIO_MUTED_KEY) === "1");
      const raw = localStorage.getItem(MAP_AUDIO_VOLUME_KEY);
      if (raw != null) {
        const parsed = Number(raw);
        if (Number.isFinite(parsed)) {
          setMapAudioVolume(Math.max(0, Math.min(1, parsed)));
        }
      }
    } catch {}
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
    try {
      setMapCoachDoneState(readMapCoachDone());
    } catch {
      setMapCoachDoneState(false);
    }
    setMapGuideReady(true);
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
  const dismissedHomeRef = useRef(false);
  const autoOpenedHomeThisVisitRef = useRef(false);
  const prevHomeModalOpenRef = useRef(!!homeModalOpen);
  const [selectedGame, setSelectedGame] = useState<{
    type: string;
    name: string;
    stationSlug: string;
    gameSlug: string;
  } | null>(null);
  const [onisogoModalSlug, setOnisogoModalSlug] = useState<string | null>(null);

  const showMapLandscapeHint =
    mapLandscapeHintReady &&
    !mapLandscapeHintDismissed &&
    mapLandscapePortraitNarrow &&
    !selectedGame;

  const showMapGuideChrome =
    mapGuideReady &&
    Boolean(heroModelPath?.trim()) &&
    !selectedGame &&
    !selectedId;

  const showMapFirstCoach =
    showMapGuideChrome &&
    !showMapLandscapeHint &&
    (!mapCoachDone || mapCoachReplay);
  const showMapHelpReplayChip =
    showMapGuideChrome &&
    !showMapLandscapeHint &&
    mapCoachDone &&
    !mapCoachReplay;

  const stationWeeklyActiveHint = t.stationPopupWeeklyActive.replace(
    "{cap}",
    String(STATION_GAME_WEEKLY_PLAY_CAP),
  );
  const perGameWeekCapLabel = t.stationPopupPerGameWeekCap.replace(
    /\{cap\}/g,
    String(STATION_GAME_WEEKLY_PLAY_CAP),
  );

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
    () => (playerHomeKeyRaw && playerHomeKeyRaw.trim()) || userEmail || "guest",
    [playerHomeKeyRaw, userEmail],
  );

  const {
    publishPose,
    publishMapEmote,
    remotePeersRef,
    publishMapChat,
    mapChatLinesRef,
    setOnMapChatLine,
  } = useMapPresence({
    displayName: playerDisplayName?.trim() || userEmail?.trim() || "Тоглогч",
    homeKey: presenceHomeKey,
    enabled: true,
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
    heroRadarPoint,
    stationRadarPoints,
    peerRadarPoints,
    labelZoomScale,
    showAllMapLabels,
    goToHomeGer,
    travelToStation,
    mapVirtualStickRef,
    worldPoiUi,
    heroBiome,
    daylightFactor,
    mapHeroEmoteIds,
    playMapHeroEmote,
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
    onStationEnter: (stationId) => {
      playStationApproachSfx(stationId, 0.28);
    },
    onisogoMarkers: onisogoPoints.map((p) => ({
      slug: p.slug,
      wx: p.wx,
      wz: p.wz,
    })),
  });

  useMapAmbientAudio({
    enabled: !docHidden && !selectedGame,
    muted: mapAudioMuted,
    volume: mapAudioVolume,
    biome: heroBiome,
    daylightFactor,
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

  useEffect(() => {
    const was = prevHomeModalOpenRef.current;
    prevHomeModalOpenRef.current = !!homeModalOpen;
    if (heroAtStationId === "home" && was && !homeModalOpen) {
      dismissedHomeRef.current = true;
    }
  }, [homeModalOpen, heroAtStationId]);

  useEffect(() => {
    if (heroAtStationId !== "home") {
      dismissedHomeRef.current = false;
      autoOpenedHomeThisVisitRef.current = false;
      return;
    }
    if (dismissedHomeRef.current) return;
    if (autoOpenedHomeThisVisitRef.current) return;
    autoOpenedHomeThisVisitRef.current = true;
    onOpenHome?.();
  }, [heroAtStationId, onOpenHome]);

  const worldPoiTidbit = useMemo(() => {
    if (!worldPoiUi || worldPoiUi.kind !== "tidbit") return null;
    const row = getMapWorldPoiById(worldPoiUi.id);
    if (!row) return null;
    return {
      title: lang === "mn" ? row.titleMn : row.titleEn,
      fact: lang === "mn" ? row.factMn : row.factEn,
      icon: row.icon,
      alpha: worldPoiUi.alpha,
    };
  }, [worldPoiUi, lang]);

  const worldPoiQuiz = useMemo(() => {
    if (!worldPoiUi || worldPoiUi.kind !== "quiz") return null;
    const point = onisogoPoints.find((p) => p.slug === worldPoiUi.slug);
    if (!point) return null;
    return {
      point,
      alpha: worldPoiUi.alpha,
      solved: onisogoSolvedSlugs.includes(point.slug),
    };
  }, [worldPoiUi, onisogoPoints, onisogoSolvedSlugs]);

  const onisogoModalPoint = useMemo(
    () => onisogoPoints.find((p) => p.slug === onisogoModalSlug) ?? null,
    [onisogoPoints, onisogoModalSlug],
  );

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
      className="map-area-root relative h-full min-h-0 w-full min-w-0 flex-1 overflow-hidden"
    >
      <div ref={canvasRef} className="absolute inset-0 min-w-0" />

      <MapFloatingTopBar
        t={t}
        lang={lang}
        setLang={mapHudSetLang}
        playerName={mapHudPlayerName}
        playerTitle={mapHudPlayerTitle}
        avatarUrl={mapHudAvatarUrl}
        level={mapHudLevel}
        userEmail={mapHudUserEmail}
        coins={mapHudCoins}
        gems={mapHudGems}
        gerLevel={mapHudGerLevel}
        kp={mapHudKp}
        livestock={mapHudLivestock}
        livestockTotal={mapHudLivestockTotal}
        onTreasuryChanged={mapHudOnTreasuryChanged}
        onOpenProfile={mapHudOnOpenProfile}
        onLogout={mapHudOnLogout}
        onOpenLeaderboard={mapHudOnOpenLeaderboard}
        onShowIntroTour={mapHudOnShowIntroTour}
      />

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

      <Popover open={audioOpen} onOpenChange={setAudioOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            title={lang === "mn" ? "Map дуу" : "Map audio"}
            aria-label={lang === "mn" ? "Map дуу" : "Map audio"}
            className={cn(
              "map-ui-fab pointer-events-auto absolute right-3 z-[60] flex h-9 w-9 items-center justify-center rounded-full",
              "top-[max(3.25rem,calc(2.75rem+env(safe-area-inset-top,0px)))] md:top-[4.5rem]",
            )}
          >
            {mapAudioMuted || mapAudioVolume <= 0.001 ? (
              <LuVolumeX
                className="size-5 text-[color:var(--map-ui-text-muted)]"
                aria-hidden
              />
            ) : (
              <LuVolume2
                className="size-5 text-[color:var(--map-gold)]"
                aria-hidden
              />
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent
          side="top"
          align="end"
          sideOffset={8}
          className="map-ui-surface z-[200] w-[15.5rem] border p-2.5 shadow-2xl"
        >
          <p
            className="text-xs font-semibold"
            style={{ color: "var(--map-ui-text)" }}
          >
            {lang === "mn" ? "Map ambience" : "Map ambience"}
          </p>
          <div className="mt-2 flex items-center justify-between gap-2">
            <span
              className="text-xs"
              style={{ color: "var(--map-ui-text-muted)" }}
            >
              {lang === "mn" ? "Mute" : "Mute"}
            </span>
            <button
              type="button"
              onClick={() => {
                const next = !mapAudioMuted;
                setMapAudioMuted(next);
                try {
                  localStorage.setItem(MAP_AUDIO_MUTED_KEY, next ? "1" : "0");
                } catch {}
              }}
              className={cn(
                "rounded-md border px-2 py-1 text-xs transition",
                mapAudioMuted
                  ? "border-rose-400/55 bg-rose-950/35 text-rose-200"
                  : "border-emerald-400/45 bg-emerald-950/30 text-emerald-200",
              )}
            >
              {mapAudioMuted
                ? lang === "mn"
                  ? "Хаалттай"
                  : "Muted"
                : lang === "mn"
                  ? "Нээлттэй"
                  : "On"}
            </button>
          </div>
          <div className="mt-2">
            <label
              className="mb-1 block text-xs"
              style={{ color: "var(--map-ui-text-muted)" }}
            >
              {lang === "mn" ? "Дууны хэмжээ" : "Volume"}
            </label>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={Math.round(mapAudioVolume * 100)}
              onChange={(e) => {
                const v = Math.max(
                  0,
                  Math.min(1, Number(e.target.value) / 100),
                );
                setMapAudioVolume(v);
                try {
                  localStorage.setItem(MAP_AUDIO_VOLUME_KEY, String(v));
                } catch {}
              }}
              className="w-full accent-emerald-400"
            />
            <p
              className="mt-1 text-right text-[11px]"
              style={{ color: "var(--map-ui-text-muted)" }}
            >
              {Math.round(mapAudioVolume * 100)}%
            </p>
          </div>
          <p
            className="mt-1 text-[10px] leading-snug"
            style={{ color: "var(--map-ui-text-muted)" }}
          >
            {lang === "mn" ? `Biome: ${heroBiome}` : `Biome: ${heroBiome}`}
          </p>
        </PopoverContent>
      </Popover>

      <div
        className={cn(
          "pointer-events-none absolute left-2.5 z-[72] flex w-[min(20rem,calc(100vw-1rem))] scale-[0.95] flex-col-reverse items-start gap-2 origin-bottom-left max-[420px]:scale-[0.9] max-[360px]:scale-[0.84] sm:left-3 sm:w-[min(22rem,calc(100vw-1.5rem))] sm:scale-100",
          "bottom-[max(0.75rem,env(safe-area-inset-bottom,0px))] lg:bottom-[max(1rem,env(safe-area-inset-bottom,0px))]",
        )}
      >
        <div className="pointer-events-auto w-full">
          <MapFloatingQuestPanel
            t={t}
            lang={lang}
            heroStationId={heroAtStationId}
            nearbyStationId={labelUi.stationId}
            selectedStationName={selectedStation?.name ?? null}
            heroRadarPoint={heroRadarPoint}
            stationRadarPoints={stationRadarPoints}
            peerRadarPoints={peerRadarPoints}
            mapStations={apiStations}
            stationGames={stationGames}
            currentStationLabel={currentStationLabel}
            stationGameVisits={stationGameVisits}
            questSheetOpen={questSheetOpen}
            onQuestSheetOpenChange={setQuestSheetOpen}
          />
        </div>

        {showMapFirstCoach ? (
          <MapFirstVisitCoach
            t={t}
            mode={mapCoachReplay ? "replay" : "first"}
            onCompleteFirst={() => {
              setMapCoachDoneState(true);
              setMapCoachReplay(false);
            }}
            onCloseReplay={() => setMapCoachReplay(false)}
          />
        ) : null}
        {showMapHelpReplayChip ? (
          <button
            type="button"
            onClick={() => setMapCoachReplay(true)}
            className={cn(
              "map-ui-fab pointer-events-auto flex w-full items-center justify-center gap-2 rounded-xl border py-2.5 text-[11px] font-semibold sm:text-xs",
            )}
            style={{ color: "var(--map-ui-text)" }}
          >
            <LuBookOpen className="size-4 text-[color:var(--map-gold)]" aria-hidden />
            {t.mapGuideShow}
          </button>
        ) : null}
      </div>

      {heroModelPath?.trim() ? (
        <>
          <MapGlobalChatFab
            language={lang}
            myDisplayName={playerDisplayName?.trim() || "Тоглогч"}
            linesRef={mapChatLinesRef}
            onIncomingLine={setOnMapChatLine}
            sendChat={publishMapChat}
            fabClassName="max-lg:bottom-[max(11.75rem,calc(10.25rem+env(safe-area-inset-bottom,0px)))] bottom-[max(0.5rem,env(safe-area-inset-bottom,0px))] lg:bottom-5"
          />
          <MapVirtualJoystick
            stickRef={mapVirtualStickRef}
            disabled={!!selectedGame || docHidden}
            ariaLabel={t.mapJoystickMoveAria}
            className="absolute right-5 z-[60] bottom-[max(2.25rem,calc(1.25rem+env(safe-area-inset-bottom,0px)))] lg:hidden"
          />
          <Popover open={mapEmoteOpen} onOpenChange={setMapEmoteOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                title={t.mapHeroEmoteMenuAria}
                aria-label={t.mapHeroEmoteMenuAria}
                className={cn(
                  "map-ui-fab pointer-events-auto absolute right-3 z-[60] flex h-9 w-9 items-center justify-center rounded-full",
                  "top-[max(6.25rem,calc(5.75rem+env(safe-area-inset-top,0px)))] md:top-[7rem]",
                )}
              >
                <LuSparkles
                  className="size-5 text-[color:var(--map-gold)]"
                  aria-hidden
                />
              </button>
            </PopoverTrigger>
            <PopoverContent
              side="top"
              align="end"
              sideOffset={8}
              className="map-ui-surface z-[200] w-auto border p-1.5 shadow-2xl"
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

      {worldPoiTidbit &&
        !selectedGame &&
        !selectedStation &&
        !showMapLandscapeHint && (
          <div
            role="status"
            className="pointer-events-none absolute z-[55] max-w-[min(calc(100%-1.5rem),20rem)] rounded-xl border border-white/15 map-ui-surface py-2.5 pl-3 pr-2.5 shadow-lg backdrop-blur-sm"
            style={{
              left: "max(0.75rem, env(safe-area-inset-left, 0px))",
              bottom:
                "max(26rem, calc(24rem + env(safe-area-inset-bottom, 0px)))",
              opacity: Math.max(
                0,
                Math.min(1, worldPoiTidbit.alpha * 0.95 + 0.05),
              ),
            }}
          >
            <p
              className="text-[0.6rem] font-semibold uppercase tracking-wide"
              style={{ color: "var(--map-ui-text-muted)" }}
            >
              {t.mapWorldPoiBadge}
            </p>
            <p
              className="mt-0.5 flex items-baseline gap-1.5 text-sm font-semibold leading-snug"
              style={{ color: "var(--map-ui-text)" }}
            >
              <span className="text-base" aria-hidden>
                {worldPoiTidbit.icon}
              </span>
              <span className="min-w-0">{worldPoiTidbit.title}</span>
            </p>
            <p
              className="mt-1.5 text-[12px] leading-relaxed"
              style={{ color: "var(--map-ui-text)" }}
            >
              {worldPoiTidbit.fact}
            </p>
          </div>
        )}

      {worldPoiQuiz &&
        !selectedGame &&
        !selectedStation &&
        !showMapLandscapeHint && (
          <div
            className="pointer-events-auto absolute z-[55] max-w-[min(calc(100%-1.5rem),20rem)] rounded-xl border border-violet-400/25 map-ui-surface py-2.5 pl-3 pr-2.5 shadow-lg backdrop-blur-sm"
            style={{
              left: "max(0.75rem, env(safe-area-inset-left, 0px))",
              bottom:
                "max(26rem, calc(24rem + env(safe-area-inset-bottom, 0px)))",
              opacity: Math.max(
                0,
                Math.min(1, worldPoiQuiz.alpha * 0.95 + 0.05),
              ),
            }}
          >
            <p
              className="text-[0.6rem] font-semibold uppercase tracking-wide text-violet-200/90"
              style={{ color: "var(--map-ui-text-muted)" }}
            >
              {t.mapOnisogoBadge}
            </p>
            <p
              className="mt-0.5 flex items-baseline gap-1.5 text-sm font-semibold leading-snug"
              style={{ color: "var(--map-ui-text)" }}
            >
              <span className="text-base" aria-hidden>
                {worldPoiQuiz.point.icon}
              </span>
              <span className="min-w-0">{worldPoiQuiz.point.title}</span>
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {worldPoiQuiz.solved ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/35 bg-emerald-950/40 px-2.5 py-1 text-[11px] font-medium text-emerald-100/95">
                  {t.mapOnisogoSolvedChip}
                </span>
              ) : (
                <button
                  type="button"
                  className={cn(
                    "rounded-full border border-amber-400/50 bg-amber-950/55 px-3 py-1.5",
                    "text-xs font-semibold uppercase tracking-wide text-amber-100 shadow-sm",
                    "transition hover:border-amber-300/55 hover:bg-amber-900/45",
                  )}
                  onClick={() => setOnisogoModalSlug(worldPoiQuiz.point.slug)}
                >
                  {t.mapOnisogoOpenCta}
                </button>
              )}
            </div>
          </div>
        )}

      <MapOnisogoModal
        open={onisogoModalSlug != null}
        onOpenChange={(o) => {
          if (!o) setOnisogoModalSlug(null);
        }}
        point={onisogoModalPoint}
        lang={lang}
        t={t}
        userEmail={userEmail}
        solved={
          onisogoModalPoint
            ? onisogoSolvedSlugs.includes(onisogoModalPoint.slug)
            : false
        }
        onSolved={() => {
          onOnisogoSolved?.();
        }}
      />

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
          weeklyActiveHint={stationWeeklyActiveHint}
          weeklyExhaustedHint={t.stationPopupWeeklyExhausted}
          cultureCaption={t.mapStationCultureCaption}
          stepsTitle={t.stationPopupStepsTitle}
          stepTravel={t.stationPopupStepTravel}
          stepPickGame={t.stationPopupStepPickGame}
          gameAboutLabel={t.stationPopupGameAbout}
          perGameWeekCapLabel={perGameWeekCapLabel}
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
          weeklyPlaysRemaining={gameWeeklyPlaysRemaining(
            selectedGame.stationSlug,
            selectedGame.gameSlug,
            stationGameVisits,
          )}
          onCompleted={(r) => {
            if (r === "win") onGameCompleted?.();
            setSelectedGame(null);
          }}
        />
      )}
    </main>
  );
}
