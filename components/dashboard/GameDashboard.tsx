"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "../AppContext";
import {
  DASH_STRINGS,
  type DashLang,
  type DashStrings,
} from "./dashboard-strings";
import { MapArea } from "./MapArea";
import { getUserByEmail } from "@/lib/firebase-auth";
import { loadPlayer, HEROES } from "@/components/hero-select/hero-data";
import { normalizeStationId } from "./mapConstants";
import {
  getDashboardBundle,
  getOnisogoPoints,
  resolveAssetUrl,
  type MapStationApiRow,
  type OnisogoMapPoint,
  type StationGameBundleRow,
} from "@/lib/api";
import { LeaderboardModal } from "./LeaderboardModal";
import { ProfileModal } from "./ProfileModal";
import { HomeModal } from "./HomeModal";
import { clearPlayer } from "@/components/hero-select/hero-data";
import {
  DashboardIntroTour,
  readDashboardIntroDone,
} from "./DashboardIntroTour";

interface GameDashboardProps {
  defaultLang?: DashLang;
}

function num(v: unknown, fallback: number): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function isPlainRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function readStationSteps(
  progress: Record<string, unknown>,
): Record<string, { completedGameSlugs: string[] }> {
  const raw = progress.stationSteps;
  if (!isPlainRecord(raw)) return {};
  const out: Record<string, { completedGameSlugs: string[] }> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (!isPlainRecord(v)) continue;
    const arr = (v as Record<string, unknown>).completedGameSlugs;
    out[k] = {
      completedGameSlugs: Array.isArray(arr) ? arr.map((x) => String(x)) : [],
    };
  }
  return out;
}

function readOnisogoSolvedSlugs(
  progress: Record<string, unknown>,
): string[] {
  const raw = progress.onisogoSolvedSlugs;
  if (!Array.isArray(raw)) return [];
  return raw.map((x) => String(x)).filter((x) => x.length > 0);
}

function readStationGameVisits(
  progress: Record<string, unknown>,
): Record<string, Record<string, number[]>> {
  const raw = progress.stationGameVisits;
  if (!isPlainRecord(raw)) return {};
  const out: Record<string, Record<string, number[]>> = {};
  for (const [sk, sv] of Object.entries(raw)) {
    if (!isPlainRecord(sv)) continue;
    const inner: Record<string, number[]> = {};
    for (const [gk, arr] of Object.entries(sv)) {
      if (!Array.isArray(arr)) continue;
      inner[gk] = arr.map((x) => Number(x)).filter((n) => Number.isFinite(n));
    }
    out[sk] = inner;
  }
  return out;
}

export function GameDashboard({ defaultLang = "en" }: GameDashboardProps) {
  const router = useRouter();
  const { language, setLanguage } = useApp();
  const lang = language as DashLang;
  const setLang = setLanguage as (l: DashLang) => void;
  const [t, setT] = useState<DashStrings>(() => DASH_STRINGS[defaultLang]);
  const [player, setPlayer] = useState<{
    name: string;
    title: string;
    image: string;
    level: number;
    kp: number;
    tokens: { used: number; max: number };
    xp: number;
    xpMax: number;
    accentColor: string;
    currentStationId: string;
    doneStationIds: unknown;
    bonusMultiplier: string;
    bonusTitle: string;
    journeyDay?: number;
    stationIndex?: number;
    totalStations?: number;
    currentStationLabel?: string;
    heroTier?: string;
    heroModelPath?: string | null;
    stationSteps?: Record<string, { completedGameSlugs: string[] }>;
    stationGameVisits?: Record<string, Record<string, number[]>>;
    homeGerLevel?: number;
    homeLivestock?: {
      sheep: number;
      goat: number;
      cow: number;
      horse: number;
      camel: number;
    };
    treasury?: {
      kp: number;
      coins: number;
      gems: number;
      gerLevel: number;
      livestock: {
        sheep: number;
        goat: number;
        cow: number;
        horse: number;
        camel: number;
      };
    };
    onisogoSolvedSlugs?: string[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileReloadTick, setProfileReloadTick] = useState(0);
  const [gameReloadTick, setGameReloadTick] = useState(0);
  const [homeOpen, setHomeOpen] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [playerNickname, setPlayerNickname] = useState("");
  const [stationGames, setStationGames] = useState<StationGameBundleRow[]>([]);
  const [mapStations, setMapStations] = useState<MapStationApiRow[]>([]);
  const [onisogoPoints, setOnisogoPoints] = useState<OnisogoMapPoint[]>([]);
  const flyHomeRef = useRef<(() => void) | null>(null);
  /** Танилцах аяллыг цэснээс дахин нээсэн */
  const [introReplayOpen, setIntroReplayOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const saved = loadPlayer();
      if (!saved) {
        setLoading(false);
        return;
      }

      setUserEmail(saved.name);

      let merged = DASH_STRINGS[lang];
      let bundle: Awaited<ReturnType<typeof getDashboardBundle>> | null = null;
      try {
        bundle = await getDashboardBundle(saved.name, lang);
        // Labels stay static (frontend). Only the quest content comes from the player's current station.
        merged = {
          ...DASH_STRINGS[lang],
          questTitle: bundle.computed.questTitle,
          questDesc: bundle.computed.questDesc,
        };
        setUserEmail(String(bundle.user.email ?? saved.name));
        setPlayerNickname(
          String(bundle.user.display_name ?? bundle.user.email ?? saved.name ?? ""),
        );
      } catch {
        /* Хэрэглэгч зөвхөн Firebase эсвэл API уншихгүй */
      }
      if (cancelled) return;
      setT(merged);
      setStationGames(bundle?.stationGames ?? []);
      setMapStations(bundle?.mapStations ?? []);
      try {
        const og = await getOnisogoPoints(lang);
        if (!cancelled) setOnisogoPoints(og.points);
      } catch {
        if (!cancelled) setOnisogoPoints([]);
      }

      const data = await getUserByEmail(saved.name);
      if (cancelled) return;
      if (!data) {
        setLoading(false);
        return;
      }
      const fbProf = isPlainRecord(data.profile)
        ? { ...(data.profile as Record<string, unknown>) }
        : {};
      const fbProg = isPlainRecord(data.progress)
        ? { ...(data.progress as Record<string, unknown>) }
        : {};
      const prof = {
        ...fbProf,
        ...(bundle?.user?.profile && isPlainRecord(bundle.user.profile)
          ? (bundle.user.profile as Record<string, unknown>)
          : {}),
      };
      const prog = {
        ...fbProg,
        ...(bundle?.user?.progress && isPlainRecord(bundle.user.progress)
          ? (bundle.user.progress as Record<string, unknown>)
          : {}),
      };
      const fallbackNick =
        typeof fbProf.name === "string" && fbProf.name.trim()
          ? fbProf.name.trim()
          : saved.name;
      setPlayerNickname((prev) => (prev.trim() ? prev : fallbackNick));
      const inv = isPlainRecord(prof.inventory)
        ? (prof.inventory as Record<string, unknown>)
        : {};
      const gerRec = isPlainRecord(prof.ger)
        ? (prof.ger as Record<string, unknown>)
        : {};
      const lsRec = isPlainRecord(prof.livestock)
        ? (prof.livestock as Record<string, unknown>)
        : {};
      const hero = bundle?.hero;
      const name =
        bundle?.computed.displayHeroName &&
        String(bundle.computed.displayHeroName).length > 0
          ? String(bundle.computed.displayHeroName)
          : String(prof.heroName ?? "");
      const title =
        bundle?.computed.displayHeroTitle &&
        String(bundle.computed.displayHeroTitle).length > 0
          ? String(bundle.computed.displayHeroTitle)
          : String(prof.heroTitle ?? "");

      const rawCs =
        typeof prog.currentStationId === "string"
          ? String(prog.currentStationId).trim()
          : "";
      const resolvedStationId =
        rawCs === "" || rawCs.toLowerCase() === "home"
          ? "home"
          : normalizeStationId(rawCs);

      // Resolve hero avatar URL: backend rows may hand back
      // `/uploads/heroes/x.jpg` (served by the API) or a bundled fallback
      // like `/images/x.png` (served by Next.js `public/`). `resolveAssetUrl`
      // picks the right origin. Falls back to the locally shipped hero
      // portrait so the avatar never silently breaks.
      const heroIdStr =
        typeof prof.heroId === "string" ? prof.heroId : undefined;
      const localHeroEntry = heroIdStr
        ? HEROES.find((h) => h.id === heroIdStr)
        : null;
      const avatarImg =
        resolveAssetUrl(
          typeof hero?.image_url === "string"
            ? hero.image_url
            : (prof.heroImages as string | undefined),
        ) ||
        localHeroEntry?.imageUrl ||
        "";

      setPlayer({
        name,
        title,
        image: avatarImg,
        level: num(prof.level, 1),
        kp: num(prof.kp, 0),
        tokens: { used: 0, max: 20 },
        xp: num(prog.xp, 0),
        xpMax: num(prog.xpMax, 100),
        accentColor:
          typeof hero?.color === "string"
            ? hero.color
            : String(prof.accentColor ?? "#ffd559"),
        currentStationId: resolvedStationId,
        doneStationIds: prog.doneStationIds,
        bonusMultiplier: bundle?.computed.bonusMultiplier ?? "x1.5",
        bonusTitle: bundle?.computed.bonusTitle ?? "Steppe Speedster",
        journeyDay: bundle?.computed.journeyDay,
        stationIndex: bundle?.computed.stationIndexOneBased,
        totalStations: bundle?.computed.totalStations,
        currentStationLabel: bundle?.computed.currentStationLabel,
        heroTier: bundle?.computed.tier,
        heroModelPath: (() => {
          // Resolve the hero's 3D model:
          //   1. Freshest: the server-side (PG) hero row.
          //   2. Local authoritative hero-data (always matches the bundled
          //      assets shipped with the current build; protects against
          //      stale paths saved to Firebase/PG before heroes were swapped).
          //   3. Whatever the user's saved profile says, as a last resort.
          let raw: string | null = null;
          if (typeof hero?.model_path === "string" && hero.model_path.trim()) {
            raw = hero.model_path;
          } else {
            const heroIdFromProfile =
              typeof prof.heroId === "string" ? prof.heroId : null;
            const localHero = heroIdFromProfile
              ? HEROES.find((h) => h.id === heroIdFromProfile)
              : null;
            if (localHero?.modelPath) raw = localHero.modelPath;
            else if (
              typeof prof.heroModelPath === "string" &&
              prof.heroModelPath.trim()
            ) {
              raw = String(prof.heroModelPath);
            } else {
              raw = HEROES[0]?.modelPath ?? "/models/hero-22.fbx";
            }
          }
          return raw;
        })(),
        stationSteps: readStationSteps(prog),
        stationGameVisits: readStationGameVisits(prog),
        homeGerLevel: num(gerRec.level, 1),
        homeLivestock: {
          sheep: num(lsRec.sheep, 0),
          goat: num(lsRec.goat, 0),
          cow: num(lsRec.cow, 0),
          horse: num(lsRec.horse, 0),
          camel: num(lsRec.camel, 0),
        },
        treasury: {
          kp: num(prof.kp, 0),
          coins: num(inv.coins, 0),
          gems: num(inv.gems, 0),
          gerLevel: num(gerRec.level, 1),
          livestock: {
            sheep: num(lsRec.sheep, 0),
            goat: num(lsRec.goat, 0),
            cow: num(lsRec.cow, 0),
            horse: num(lsRec.horse, 0),
            camel: num(lsRec.camel, 0),
          },
        },
        onisogoSolvedSlugs: readOnisogoSolvedSlugs(prog),
      });
      setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [lang, profileReloadTick, gameReloadTick]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  if (!player) {
    return (
      <div className="flex items-center justify-center h-screen">
        No player found
      </div>
    );
  }

  const introMandatoryOpen = !readDashboardIntroDone();
  const introTourOpen = introMandatoryOpen || introReplayOpen;
  const introTourAllowSkip = introReplayOpen && !introMandatoryOpen;

  const openLb = () => setLeaderboardOpen(true);

  return (
    <div className="relative h-screen w-full overflow-hidden bg-background">
      <LeaderboardModal
        open={leaderboardOpen}
        onOpenChange={setLeaderboardOpen}
        lang={lang}
        viewerEmail={userEmail}
      />

      <ProfileModal
        open={profileOpen}
        onOpenChange={setProfileOpen}
        t={t}
        lang={lang}
        onHeroSaved={() => setProfileReloadTick((n) => n + 1)}
      />

      <HomeModal
        open={homeOpen}
        onOpenChange={setHomeOpen}
        t={t}
        lang={lang}
        onChanged={(next) => {
          if (next) {
            setPlayer((prev) =>
              prev
                ? {
                    ...prev,
                    kp: next.kp,
                    homeGerLevel: next.gerLevel,
                    homeLivestock: next.livestock,
                    treasury: {
                      kp: next.kp,
                      coins: next.coins,
                      gems: next.gems,
                      gerLevel: next.gerLevel,
                      livestock: next.livestock,
                    },
                  }
                : prev,
            );
          }
          setGameReloadTick((n) => n + 1);
        }}
      />

      <DashboardIntroTour
        t={t}
        open={introTourOpen}
        allowSkip={introTourAllowSkip}
        onDismiss={() => setIntroReplayOpen(false)}
      />

      <div className="absolute inset-0 min-h-0 min-w-0">
        <MapArea
          t={t}
          lang={lang}
          userEmail={userEmail}
          playerDisplayName={playerNickname || player.name}
          homeGerLevel={player.homeGerLevel ?? 1}
          homeLivestock={player.homeLivestock}
          currentStationId={player.currentStationId?.trim() || "home"}
          doneStationIds={
            Array.isArray(player.doneStationIds) ? player.doneStationIds : []
          }
          stations={mapStations}
          heroModelPath={player.heroModelPath ?? null}
          stationSteps={player.stationSteps}
          stationGameVisits={player.stationGameVisits}
          onGameCompleted={() => setGameReloadTick((n) => n + 1)}
          onOpenHome={() => setHomeOpen(true)}
          homeModalOpen={homeOpen}
          onRegisterFlyHome={(fn) => {
            flyHomeRef.current = fn;
          }}
          mapHudSetLang={setLang}
          mapHudPlayerName={player.name}
          mapHudPlayerTitle={player.title}
          mapHudAvatarUrl={player.image}
          mapHudLevel={player.level}
          mapHudUserEmail={userEmail}
          mapHudCoins={player.treasury?.coins ?? 0}
          mapHudGems={player.treasury?.gems ?? 0}
          mapHudGerLevel={
            player.treasury?.gerLevel ?? player.homeGerLevel ?? 1
          }
          mapHudKp={player.treasury?.kp ?? player.kp}
          mapHudLivestock={
            player.homeLivestock ?? {
              sheep: 0,
              goat: 0,
              cow: 0,
              horse: 0,
              camel: 0,
            }
          }
          mapHudLivestockTotal={
            (player.homeLivestock?.sheep ?? 0) +
            (player.homeLivestock?.goat ?? 0) +
            (player.homeLivestock?.cow ?? 0) +
            (player.homeLivestock?.horse ?? 0) +
            (player.homeLivestock?.camel ?? 0)
          }
          mapHudOnTreasuryChanged={() => setGameReloadTick((n) => n + 1)}
          mapHudOnOpenProfile={() => setProfileOpen(true)}
          mapHudOnLogout={() => {
            clearPlayer();
            router.push("/");
          }}
          mapHudOnOpenLeaderboard={openLb}
          mapHudOnShowIntroTour={() => setIntroReplayOpen(true)}
          stationGames={stationGames}
          currentStationLabel={player.currentStationLabel}
          onisogoPoints={onisogoPoints}
          onisogoSolvedSlugs={player.onisogoSolvedSlugs ?? []}
          onOnisogoSolved={() => setGameReloadTick((n) => n + 1)}
        />
      </div>
    </div>
  );
}
