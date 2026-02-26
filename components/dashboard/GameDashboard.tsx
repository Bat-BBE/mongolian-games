"use client";

import { useState } from "react";
import { DASH_STRINGS, type DashLang } from "./dashboard-strings";
import { DashNav } from "./DashNav";
import { LeftPanel } from "./LeftPanel";
import { MapArea } from "./MapArea";
import { RightPanel } from "./RightPanel";
import { DashFooter } from "./DashFooter";

const AVATAR = "https://lh3.googleusercontent.com/aida-public/AB6AXuBN1zFT6L8i3Yf5A5uZOyAfGIcwjio6h-in5xePSGBWb4Xa1CfRutgVZ8ZVt05B70PjdPypiONl2l30uDXl3dsmn4FpW91OhpkGzVBCgkoqFZlVqW75bS5uRK2LtrOfyLTXaZbnh6-YHRnWCKeaKGwxBk22tqMDr8mypGRkXQruWQwgyi-kPQK8fNmxje9v7TiosQVfs_tKVr_a7UHlAtAZTn5ijPm-ar9zpoCdZbaN0wBSu0_k_locWH4y2pDBi_R8Bx7Xe9-TfzgY";

interface GameDashboardProps {
  defaultLang?: DashLang;
}

export function GameDashboard({ defaultLang = "en" }: GameDashboardProps) {
  const [lang, setLang] = useState<DashLang>(defaultLang);
  const [season, setSeason] = useState<"spring" | "summer" | "autumn" | "winter">("summer");

  const t = DASH_STRINGS[lang];

  const player = {
    name: lang === "mn" ? "Бату Хаан" : "Batu Khan",
    title: lang === "mn" ? "Эзэнт Элч" : "Imperial Envoy",
    level: 14,
    kp: 42850,
    tokens: { used: 18, max: 20 },
    xp: 850,
    xpMax: 1000,
    accentColor: "#D4AF37",
    currentStationId: "orkhon",
    doneStationIds: ["kharakhorum"],
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <DashNav
        t={t}
        lang={lang}
        setLang={setLang}
        playerName={player.name}
        playerTitle={player.title}
        avatarUrl={AVATAR}
        level={player.level}
        kp={player.kp}
        tokens={player.tokens}
      />

      <div className="flex flex-1 overflow-hidden relative">

        <LeftPanel
          t={t}
          accentColor={player.accentColor}
          xp={player.xp}
          xpMax={player.xpMax}
          avatarUrl={AVATAR}
          bonusMultiplier="x1.5"
          bonusTitle={lang === "mn" ? "Талын Хурдан" : "Steppe Speedster"}
          onJournal={() => console.log("Journal")}
          onBeginRelay={() => console.log("Begin relay")}
        />

        <MapArea
          t={t}
          currentStationId={player.currentStationId}
          doneStationIds={player.doneStationIds}
        />

        {/* <RightPanel
          t={t}
          stationsTotal={t.stations.length * 3}
          stationsFound={t.stations.filter((s) => s.available).length}
          activeSeason={season}
          onSeasonChange={setSeason}
        /> */}
      </div>

      {/* <DashFooter
        t={t}
        avatarUrl={AVATAR}
        bonusMultiplier="x1.5"
        bonusTitle={lang === "mn" ? "Талын Хурдан" : "Steppe Speedster"}
        onJournal={() => console.log("Journal")}
        onBeginRelay={() => console.log("Begin relay")}
      /> */}
    </div>
  );
}