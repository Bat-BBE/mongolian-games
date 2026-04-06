"use client";

import { useState, useEffect } from "react";
import { useApp } from "../AppContext";
import {
  DASH_STRINGS,
  mergeDashboardSidebar,
  type DashLang,
  type DashStrings,
} from "./dashboard-strings";
import { DashNav } from "./DashNav";
import { LeftPanel } from "./LeftPanel";
import { MapArea } from "./MapArea";
import { getUserByEmail } from "@/lib/firebase-auth";
import { loadPlayer } from "@/components/hero-select/hero-data";
import { JOURNEY_ORDER, normalizeStationId } from "./mapConstants";
import { getDashboardBundle, type StationGameBundleRow } from "@/lib/api";
import { LeaderboardModal } from "./LeaderboardModal";

interface GameDashboardProps {
  defaultLang?: DashLang;
}

function num(v: unknown, fallback: number): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function GameDashboard({ defaultLang = "en" }: GameDashboardProps) {
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
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [stationGames, setStationGames] = useState<StationGameBundleRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const saved = loadPlayer();
      if (!saved) {
        setLoading(false);
        return;
      }

      let merged = DASH_STRINGS[lang];
      let bundle: Awaited<ReturnType<typeof getDashboardBundle>> | null = null;
      try {
        bundle = await getDashboardBundle(saved.name, lang);
        merged = mergeDashboardSidebar(DASH_STRINGS[lang], bundle.strings, {
          questTitle: bundle.computed.questTitle,
          questDesc: bundle.computed.questDesc,
        });
      } catch {
        /* Хэрэглэгч зөвхөн Firebase эсвэл API уншихгүй */
      }
      if (cancelled) return;
      setT(merged);
      setStationGames(bundle?.stationGames ?? []);

      const data = await getUserByEmail(saved.name);
      if (cancelled) return;
      if (!data) {
        setLoading(false);
        return;
      }

      const prof = data.profile as Record<string, unknown>;
      const prog = data.progress as Record<string, unknown>;
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
        currentStationId: normalizeStationId(
          typeof prog.currentStationId === "string" ? prog.currentStationId : undefined
        ),
        doneStationIds: prog.doneStationIds,
        bonusMultiplier: bundle?.computed.bonusMultiplier ?? "x1.5",
        bonusTitle: bundle?.computed.bonusTitle ?? "Steppe Speedster",
        journeyDay: bundle?.computed.journeyDay,
        stationIndex: bundle?.computed.stationIndexOneBased,
        totalStations: bundle?.computed.totalStations,
        currentStationLabel: bundle?.computed.currentStationLabel,
        heroTier: bundle?.computed.tier,
      });
      setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [lang]);

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
        onOpenLeaderboard={openLb}
      />

      <LeaderboardModal
        open={leaderboardOpen}
        onOpenChange={setLeaderboardOpen}
        lang={lang}
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
          onOpenLeaderboard={openLb}
        />

        <MapArea
          t={t}
          currentStationId={
            player.currentStationId?.trim() || JOURNEY_ORDER[0]
          }
          doneStationIds={Array.isArray(player.doneStationIds) ? player.doneStationIds : []}
        />
      </div>
    </div>
  );
}
