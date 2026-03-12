"use client";

import { useState, useEffect } from "react";
import { DASH_STRINGS, type DashLang } from "./dashboard-strings";
import { DashNav } from "./DashNav";
import { LeftPanel } from "./LeftPanel";
import { MapArea } from "./MapArea";
import  UrtuuMap  from "./UrtuuMap";
import { getUserByEmail } from "@/lib/firebase-auth";
import { loadPlayer } from "@/components/hero-select/hero-data";

interface GameDashboardProps {
  defaultLang?: DashLang;
}

export function GameDashboard({ defaultLang = "en" }: GameDashboardProps) {
  const [lang, setLang] = useState<DashLang>(defaultLang);
  const [season, setSeason] = useState<"spring" | "summer" | "autumn" | "winter">("summer");
  const [player, setPlayer] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const t = DASH_STRINGS[lang];

  useEffect(() => {
    async function load() {
      const saved = loadPlayer();
      if (!saved) {
        setLoading(false);
        return;
      }
      const data = await getUserByEmail(saved.name);
      if (!data) {
        setLoading(false);
        return;
      }
      setPlayer({
        name: data.profile.heroName,
        title: data.profile.heroTitle,
        image: data.profile.heroImages,
        level: data.profile.level,
        kp: data.profile.kp,
        tokens: { used: 0, max: 20 },
        xp: data.progress.xp,
        xpMax: data.progress.xpMax,
        accentColor: data.profile.accentColor,
        currentStationId: data.progress.currentStationId,
        doneStationIds: data.progress.doneStationIds,
      });
      setLoading(false);
    }

    load();
  }, []);

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
        // kp={player.kp}
        // tokens={player.tokens}
      />

      <div className="flex flex-1 overflow-hidden relative">
        <LeftPanel
          t={t}
          accentColor={player.accentColor}
          xp={player.xp}
          xpMax={player.xpMax}
          avatarUrl={player.image}
          bonusMultiplier="x1.5"
          bonusTitle="Steppe Speedster"
          // onJournal={() => console.log("Journal")}
          // onBeginRelay={() => console.log("Begin relay")}
        />

        <MapArea
          t={t}
          currentStationId={player?.currentStationId ?? ""}
          doneStationIds={player?.doneStationIds ?? []}
        />
      </div>
    </div>
  );
}