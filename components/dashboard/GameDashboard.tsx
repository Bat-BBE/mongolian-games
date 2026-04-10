"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "../AppContext";
import {
  DASH_STRINGS,
  type DashLang,
  type DashStrings,
} from "./dashboard-strings";
import { DashNav } from "./DashNav";
import { LeftPanel } from "./LeftPanel";
import { MapArea } from "./MapArea";
import { getUserByEmail } from "@/lib/firebase-auth";
import { loadPlayer } from "@/components/hero-select/hero-data";
import { JOURNEY_ORDER, normalizeStationId } from "./mapConstants";
import {
  getDashboardBundle,
  type MapStationApiRow,
  type StationGameBundleRow,
} from "@/lib/api";
import { LeaderboardModal } from "./LeaderboardModal";
import { ProfileModal } from "./ProfileModal";
import { HomeModal } from "./HomeModal";
import { clearPlayer } from "@/components/hero-select/hero-data";

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

function readStationSteps(progress: Record<string, unknown>): Record<string, { completedGameSlugs: string[] }> {
  const raw = progress.stationSteps;
  if (!isPlainRecord(raw)) return {};
  const out: Record<string, { completedGameSlugs: string[] }> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (!isPlainRecord(v)) continue;
    const arr = (v as Record<string, unknown>).completedGameSlugs;
    out[k] = { completedGameSlugs: Array.isArray(arr) ? arr.map((x) => String(x)) : [] };
  }
  return out;
}

function readStationVisits(progress: Record<string, unknown>): Record<string, number[]> {
  const raw = progress.stationVisits;
  if (!isPlainRecord(raw)) return {};
  const out: Record<string, number[]> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (!Array.isArray(v)) continue;
    out[k] = v.map((x) => Number(x)).filter((n) => Number.isFinite(n));
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
    stationVisits?: Record<string, number[]>;
    homeGerLevel?: number;
    homeLivestock?: { sheep: number; horse: number; camel: number };
    treasury?: {
      kp: number;
      coins: number;
      gems: number;
      gerLevel: number;
      livestock: { sheep: number; horse: number; camel: number };
    };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileReloadTick, setProfileReloadTick] = useState(0);
  const [gameReloadTick, setGameReloadTick] = useState(0);
  const [homeOpen, setHomeOpen] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [stationGames, setStationGames] = useState<StationGameBundleRow[]>([]);
  const [mapStations, setMapStations] = useState<MapStationApiRow[]>([]);

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
      } catch {
        /* Хэрэглэгч зөвхөн Firebase эсвэл API уншихгүй */
      }
      if (cancelled) return;
      setT(merged);
      setStationGames(bundle?.stationGames ?? []);
      setMapStations(bundle?.mapStations ?? []);

      const data = await getUserByEmail(saved.name);
      if (cancelled) return;
      if (!data) {
        setLoading(false);
        return;
      }

      const prof = data.profile as Record<string, unknown>;
      const prog = data.progress as Record<string, unknown>;
      const inv =
        isPlainRecord(prof.inventory) ? (prof.inventory as Record<string, unknown>) : {};
      const gerRec =
        isPlainRecord(prof.ger) ? (prof.ger as Record<string, unknown>) : {};
      const lsRec =
        isPlainRecord(prof.livestock)
          ? (prof.livestock as Record<string, unknown>)
          : {};
      const hero = bundle?.hero;
      const bundleStation =
        typeof bundle?.computed?.currentStationSlug === "string"
          ? String(bundle.computed.currentStationSlug)
          : typeof bundle?.currentStation?.slug === "string"
            ? String(bundle.currentStation.slug)
            : null;

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

      setPlayer({
        name,
        title,
        image:
          typeof hero?.image_url === "string" ? hero.image_url : String(prof.heroImages ?? ""),
        level: num(prof.level, 1),
        kp: num(prof.kp, 0),
        tokens: { used: 0, max: 20 },
        xp: num(prog.xp, 0),
        xpMax: num(prog.xpMax, 100),
        accentColor:
          typeof hero?.color === "string" ? hero.color : String(prof.accentColor ?? "#ffd559"),
        // Single source-of-truth: PostgreSQL dashboard-bundle
        currentStationId: normalizeStationId(
          bundleStation ?? (typeof prog.currentStationId === "string" ? prog.currentStationId : undefined)
        ),
        doneStationIds: prog.doneStationIds,
        bonusMultiplier: bundle?.computed.bonusMultiplier ?? "x1.5",
        bonusTitle: bundle?.computed.bonusTitle ?? "Steppe Speedster",
        journeyDay: bundle?.computed.journeyDay,
        stationIndex: bundle?.computed.stationIndexOneBased,
        totalStations: bundle?.computed.totalStations,
        currentStationLabel: bundle?.computed.currentStationLabel,
        heroTier: bundle?.computed.tier,
        heroModelPath:
          typeof hero?.model_path === "string"
            ? hero.model_path
            : typeof prof.heroModelPath === "string"
              ? String(prof.heroModelPath)
              : null,
        stationSteps: readStationSteps(prog),
        stationVisits: readStationVisits(prog),
        homeGerLevel: num(gerRec.level, 1),
        homeLivestock: {
          sheep: num(lsRec.sheep, 0),
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
            horse: num(lsRec.horse, 0),
            camel: num(lsRec.camel, 0),
          },
        },
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

  const openLb = () => setLeaderboardOpen(true);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <DashNav
        t={t}
        lang={lang}
        setLang={setLang}
        playerName={player.name}
        playerTitle={player.title}
        avatarUrl={player.image}
        level={player.level}
        userEmail={userEmail}
        onOpenProfile={() => setProfileOpen(true)}
        onLogout={() => {
          clearPlayer();
          router.push("/");
        }}
        onOpenLeaderboard={openLb}
      />

      <LeaderboardModal
        open={leaderboardOpen}
        onOpenChange={setLeaderboardOpen}
        lang={lang}
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
        onChanged={() => setGameReloadTick((n) => n + 1)}
      />

      <div className="flex flex-1 overflow-hidden relative">
        <LeftPanel
          t={t}
          lang={lang}
          accentColor={player.accentColor}
          xp={player.xp}
          xpMax={player.xpMax}
          avatarUrl={player.image}
          bonusMultiplier={player.bonusMultiplier}
          bonusTitle={player.bonusTitle}
          journeyDay={player.journeyDay}
          stationIndex={player.stationIndex}
          totalStations={player.totalStations}
          currentStationLabel={player.currentStationLabel}
          heroTier={player.heroTier}
          stationGames={stationGames}
          currentStationId={player.currentStationId}
          stationSteps={player.stationSteps}
          stationVisits={player.stationVisits}
          treasury={player.treasury}
          onOpenLeaderboard={openLb}
        />

        <MapArea
          t={t}
          userEmail={userEmail}
          homeGerLevel={player.homeGerLevel ?? 1}
          homeLivestock={player.homeLivestock}
          currentStationId={
            player.currentStationId?.trim() || JOURNEY_ORDER[0]
          }
          doneStationIds={Array.isArray(player.doneStationIds) ? player.doneStationIds : []}
          stations={mapStations}
          heroModelPath={player.heroModelPath ?? null}
          stationSteps={player.stationSteps}
          stationVisits={player.stationVisits}
          onGameCompleted={() => setGameReloadTick((n) => n + 1)}
          onOpenHome={() => setHomeOpen(true)}
        />
      </div>
    </div>
  );
}
