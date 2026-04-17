"use client";

import {
  LuChevronLeft as ChevronLeft,
  LuChevronRight as ChevronRight,
  LuMap as Map,
  LuGem as Gem,
  LuTrendingUp as TrendingUp,
  LuTrophy as Trophy,
} from "react-icons/lu";
import type { DashStrings, DashLang } from "./dashboard-strings";
import type { MapStationApiRow, StationGameBundleRow } from "@/lib/api";
import { useState, useEffect, useMemo } from "react";

interface LeftPanelProps {
  t: DashStrings;
  lang: DashLang;
  accentColor: string;
  xp: number;
  xpMax: number;
  avatarUrl: string;
  bonusMultiplier: string;
  bonusTitle: string;
  /** Аяллын өдөр, одоогийн уртуу — backend `dashboard-bundle`-аас */
  journeyDay?: number;
  stationIndex?: number;
  totalStations?: number;
  currentStationLabel?: string;
  heroTier?: string;
  stationGames?: StationGameBundleRow[];
  currentStationId?: string;
  /** Газрын 3D дээр баатар одоо байгаа өртөө (хаалганы дотор) — байхгүй бол `currentStationId` */
  heroStationId?: string | null;
  mapStations?: MapStationApiRow[];
  stationSteps?: Record<string, { completedGameSlugs: string[] }>;
  stationVisits?: Record<string, number[]>;
  treasury?: {
    kp: number;
    coins: number;
    gems: number;
    gerLevel: number;
    livestock: { sheep: number; goat: number; cow: number; horse: number; camel: number };
  };
  /** Газрын зураг дээр гэр рүү камер шилжүүлэх */
  onGoToGer?: () => void;
  onOpenLeaderboard?: () => void;
}

function TreasuryRow({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-primary/15 bg-background/60 px-3 py-2">
      <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </span>
      <span className="text-sm font-semibold tabular-nums text-foreground">
        {value}
        {hint ? (
          <span className="ml-2 text-[10px] font-normal text-muted-foreground">
            {hint}
          </span>
        ) : null}
      </span>
    </div>
  );
}

export function LeftPanel({
  t,
  accentColor,
  xp,
  xpMax,
  avatarUrl,
  bonusMultiplier,
  bonusTitle,
  journeyDay,
  stationIndex,
  totalStations,
  currentStationLabel,
  heroTier,
  stationGames = [],
  currentStationId,
  heroStationId = null,
  mapStations = [],
  stationSteps,
  stationVisits,
  treasury,
  onGoToGer,
  onOpenLeaderboard,
  lang,
}: LeftPanelProps) {
  const xpPct = Math.round((xp / xpMax) * 100);
  const [isMobile, setIsMobile] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  /** Хаалганд биш үед зөвхөн гэр/төвийн агуулга — өртөө руу очоогүй үед прогрессийн станц самбарт харагдахгүй */
  const activeStationId = heroStationId ?? "home";

  const stationInfo = useMemo(
    () => mapStations.find((s) => s.id === activeStationId),
    [mapStations, activeStationId],
  );

  const displayGames: StationGameBundleRow[] = useMemo(() => {
    if (activeStationId === "home") return [];
    if (stationGames.length > 0) return stationGames;
    const g = stationInfo?.games ?? [];
    return g.map((game, i) => ({
      id: `${activeStationId}-${game.slug}-${i}`,
      slug: game.slug,
      name_mn: game.name,
      name_en: game.name,
      description_mn: game.desc,
      description_en: game.desc,
      is_available: true,
      station_sort: i,
      reward_hint_mn: game.reward ?? "",
      reward_hint_en: game.reward ?? "",
    }));
  }, [activeStationId, stationGames, stationInfo]);

  const NAV_ITEMS = [
    { id: "quest", Icon: Map, label: t.currentExpedition },
    { id: "treasury", Icon: Gem, label: t.treasury },
    { id: "progress", Icon: TrendingUp, label: t.rank },
    { id: "leaderboard", Icon: Trophy, label: t.leaderboard },
  ];

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const renderContent = () => {
    if (collapsed) {
      return (
        <div className="flex flex-col gap-6 mt-4 w-full items-center">
          {NAV_ITEMS.map(({ id, Icon, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                if (id === "leaderboard") onOpenLeaderboard?.();
              }}
              className="flex flex-col items-center justify-center text-primary/70 hover:text-primary transition-all group"
              title={label}
            >
              <div className="p-3 rounded-xl glass bg-background/60 group-hover:bg-primary/20 border border-primary/20 group-hover:border-primary/50 transition-all mb-1">
                <Icon className="w-6 h-6 text-foreground/80 group-hover:text-primary transition-colors" />
              </div>
              <span className="text-[9px] uppercase mt-1 font-medium">
                {label}
              </span>
            </button>
          ))}
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-5">
        {/* Quest Section */}
        <div className="space-y-2 w-full">
          <SectionTitle>{t.currentExpedition}</SectionTitle>
          <div className="relative group">
            <div
              className="absolute -inset-1 rounded-2xl blur opacity-20 group-hover:opacity-40 transition"
              style={{ background: accentColor }}
            />
            <div className="relative glass p-4 rounded-2xl border border-primary/30 bg-background/80">
              <div className="flex items-center justify-between mb-2">
                <span className="bg-primary/20 text-primary text-[10px] px-2 py-0.5 rounded uppercase font-bold">
                  {activeStationId !== "home"
                    ? lang === "mn"
                      ? "Одоогийн өртөө"
                      : "Current station"
                    : t.mainQuest}
                </span>
              </div>
              {activeStationId !== "home" && stationInfo ? (
                <>
                  <h4 className="font-display text-base text-foreground mb-1 font-semibold leading-snug">
                    {stationInfo.name}
                  </h4>
                  {stationInfo.region ? (
                    <p className="text-[11px] text-primary/85 mb-2 font-medium">
                      {stationInfo.region}
                    </p>
                  ) : null}
                  <p className="text-xs text-foreground/75 mb-2 leading-relaxed">
                    {displayGames[0]
                      ? lang === "mn"
                        ? displayGames[0].description_mn
                        : displayGames[0].description_en
                      : t.questDesc}
                  </p>
                </>
              ) : activeStationId !== "home" ? (
                <>
                  <h4 className="font-display text-base text-foreground mb-1.5 font-semibold leading-snug">
                    {currentStationLabel?.trim() || activeStationId}
                  </h4>
                  <p className="text-xs text-foreground/70 mb-2 leading-relaxed">
                    {t.questDesc}
                  </p>
                </>
              ) : (
                <>
                  {onGoToGer ? (
                    <div className="mt-1 space-y-2">
                      <button
                        type="button"
                        onClick={() => onGoToGer()}
                        className="w-full rounded-lg border border-amber-700/45 bg-amber-500/18 px-3 py-2.5 text-sm font-semibold text-amber-950 dark:text-amber-50 hover:bg-amber-500/28 transition-colors"
                      >
                        {t.mapGoToGer}
                      </button>
                      <div className="rounded-lg border border-primary/15 bg-background/40 px-3 py-2">
                        <p className="text-[9px] uppercase tracking-wider text-primary/90 font-bold mb-1">
                          {lang === "mn" ? "Хэрхэн тоглох вэ?" : "How to play"}
                        </p>
                        <ul className="text-[11px] text-foreground/70 leading-relaxed space-y-1">
                          <li>
                            {lang === "mn"
                              ? "1) Газрын зураг дээр өртөө сонгоод хаалган дээр нь очно."
                              : "1) Pick a station on the map and reach its gate."}
                          </li>
                          <li>
                            {lang === "mn"
                              ? "2) Өртөө бүр дээр мини-тоглоом тоглоод шагнал авна."
                              : "2) Play the station minigames to earn rewards."}
                          </li>
                          <li>
                            {lang === "mn"
                              ? "3) Нэг өртөөнд 7 хоногт 2 л удаа тоглоно."
                              : "3) Each station allows 2 plays per 7 days."}
                          </li>
                          <li>
                            {lang === "mn"
                              ? "4) Гэр дээр “Go to ger” дарж гэрээ сайжруулж, мал худалдаж авна."
                              : "4) Use “Go to ger” to upgrade your ger and buy livestock."}
                          </li>
                        </ul>
                      </div>
                    </div>
                  ) : null}
                </>
              )}
              {activeStationId !== "home" &&
                journeyDay != null &&
                totalStations != null &&
                totalStations > 0 && (
                  <p className="text-[10px] text-foreground/65 mb-3 leading-snug">
                    <span className="text-primary/90 font-semibold">
                      {t.journeyDayLabel} {journeyDay}
                    </span>
                    {stationIndex != null && currentStationLabel ? (
                      <>
                        <span className="text-foreground/50"> · </span>
                        <span>
                          {t.urtuuCounter} {stationIndex}/{totalStations}
                        </span>
                        <span className="text-foreground/50"> — </span>
                        <span>{currentStationLabel}</span>
                      </>
                    ) : (
                      <>
                        <span className="text-foreground/50"> · </span>
                        <span>
                          {lang === "mn"
                            ? "Бүх өртөө нээлттэй — газрын зураг дээр сонгоно"
                            : "All stations open — select on the map"}
                        </span>
                      </>
                    )}
                  </p>
                )}
              {activeStationId !== "home" && displayGames.length > 0 && (
                <div className="mb-3 rounded-lg border border-primary/15 bg-background/40 px-2.5 py-2">
                  <p className="text-[9px] uppercase tracking-wider text-primary/90 font-bold mb-1.5">
                    {lang === "mn"
                      ? "Энэ өртөөний тоглоомууд"
                      : "Games at this station"}
                  </p>
                  <p className="text-[10px] text-foreground/60 mb-1.5">
                    {(() => {
                      const now = Date.now();
                      const windowMs = 7 * 24 * 60 * 60 * 1000;
                      const visits = (stationVisits?.[activeStationId] ?? [])
                        .map((x) => Number(x))
                        .filter((n) => Number.isFinite(n) && n >= now - windowMs);
                      const rem = Math.max(0, 2 - visits.length);
                      return lang === "mn"
                        ? `7 хоногт үлдсэн боломж: ${rem}/2`
                        : `Weekly plays remaining: ${rem}/2`;
                    })()}
                  </p>
                  <ul className="space-y-1 max-h-[min(40vh,220px)] overflow-y-auto pr-0.5">
                    {displayGames.map((g) => {
                      const completed = new Set(
                        (activeStationId
                          ? stationSteps?.[activeStationId]?.completedGameSlugs
                          : []) ?? [],
                      );
                      const nextRequired =
                        displayGames.find((x) => !completed.has(x.slug))?.slug ??
                        null;
                      const status =
                        completed.has(g.slug)
                          ? (lang === "mn" ? "Дууссан" : "Done")
                          : g.slug === nextRequired
                            ? (lang === "mn" ? "Дараагийн" : "Next")
                            : (lang === "mn" ? "Түгжээтэй" : "Locked");

                      return (
                        <li
                          key={g.id}
                          className="text-[11px] text-foreground/80 leading-snug flex justify-between gap-2"
                        >
                          <span className="truncate">
                            {lang === "mn" ? g.name_mn : g.name_en}
                          </span>
                          <span className="shrink-0 flex items-center gap-2">
                            <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
                              {status}
                            </span>
                            {(lang === "mn" ? g.reward_hint_mn : g.reward_hint_en)?.trim() ? (
                              <span className="text-primary/80 text-[10px]">
                                {lang === "mn" ? g.reward_hint_mn : g.reward_hint_en}
                              </span>
                            ) : null}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {activeStationId !== "home" && (t.questTitle?.trim() || t.questDesc?.trim()) ? (
                <div className="rounded-lg border border-primary/15 bg-background/40 px-3 py-2">
                  <p className="text-[9px] uppercase tracking-wider text-primary/90 font-bold mb-1">
                    {lang === "mn" ? "Өртөөний түүх" : "Station story"}
                  </p>
                  {t.questTitle?.trim() ? (
                    <p className="text-[11px] text-foreground/80 font-semibold leading-snug">
                      {t.questTitle}
                    </p>
                  ) : null}
                  {t.questDesc?.trim() ? (
                    <p className="text-[11px] text-foreground/70 leading-relaxed mt-1">
                      {t.questDesc}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Treasury Section */}
        <div className="w-full">
          <SectionTitle>{t.treasury}</SectionTitle>
          <div className="space-y-2 mt-1.5">
            <TreasuryRow
              label={lang === "mn" ? "Гэр" : "Ger"}
              value={`Lv ${treasury?.gerLevel ?? 1}`}
            />
            <TreasuryRow
              label={lang === "mn" ? "Эрдэнэс (МО)" : "KP"}
              value={(treasury?.kp ?? 0).toLocaleString()}
            />
            <TreasuryRow
              label={lang === "mn" ? "Зоос" : "Coins"}
              value={(treasury?.coins ?? 0).toLocaleString()}
              hint={lang === "mn" ? "₮" : "$"}
            />
            <TreasuryRow
              label={lang === "mn" ? "Эрдэнийн чулуу" : "Gems"}
              value={(treasury?.gems ?? 0).toLocaleString()}
            />
            <div className="rounded-lg border border-primary/15 bg-background/60 px-3 py-2">
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">
                {lang === "mn" ? "Мал сүрэг" : "Livestock"}
              </p>
              <div className="flex flex-wrap gap-2 text-xs text-foreground/85 tabular-nums">
                <span className="px-2 py-1 rounded-full border border-primary/15 bg-primary/5">
                  🐑 {(treasury?.livestock.sheep ?? 0).toLocaleString()}
                </span>
                <span className="px-2 py-1 rounded-full border border-primary/15 bg-primary/5">
                  🐐 {(treasury?.livestock.goat ?? 0).toLocaleString()}
                </span>
                <span className="px-2 py-1 rounded-full border border-primary/15 bg-primary/5">
                  🐄 {(treasury?.livestock.cow ?? 0).toLocaleString()}
                </span>
                <span className="px-2 py-1 rounded-full border border-primary/15 bg-primary/5">
                  🐎 {(treasury?.livestock.horse ?? 0).toLocaleString()}
                </span>
                <span className="px-2 py-1 rounded-full border border-primary/15 bg-primary/5">
                  🐫 {(treasury?.livestock.camel ?? 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Section */}
        <div className="w-full">
          <SectionTitle>{t.rank}</SectionTitle>
          <div className="glass bg-background/90 p-3 rounded-lg border border-primary/20 mt-1.5">
            <div className="flex justify-between text-[11px] text-foreground mb-1.5">
              <span className="font-bold uppercase tracking-wider text-primary">
                {t.rankTitle}
                {heroTier ? (
                  <span className="ml-1.5 text-[9px] opacity-80 font-mono">
                    · {heroTier}
                  </span>
                ) : null}
              </span>
              <span className="text-foreground font-medium">
                {xp.toLocaleString()} / {xpMax.toLocaleString()}
              </span>
            </div>
            <div className="h-1.5 w-full bg-background/50 border border-primary/20 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${xpPct}%`,
                  background: "var(--gold-gradient, var(--grad-gold))",
                }}
              />
            </div>
          </div>
        </div>

        {/* Leaderboard Section */}
        <div className="w-full">
          <SectionTitle>{t.leaderboard}</SectionTitle>
          <button
            type="button"
            onClick={() => onOpenLeaderboard?.()}
            className="w-full text-left flex items-center justify-between gap-3 mt-1.5 rounded-xl border border-transparent hover:border-primary/25 hover:bg-primary/5 transition-colors p-1 -m-1"
          >
            <div className="flex flex-col">
              <span className="text-[8px] text-primary uppercase tracking-[0.2em] font-bold mb-1.5">
                {t.topPlayersLabel}
              </span>
              <div className="flex items-center -space-x-2">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-7 h-7 rounded-full border-2 overflow-hidden bg-background/80"
                    style={{
                      zIndex: 30 - i * 10,
                      borderColor:
                        i === 0
                          ? "var(--gold-main, var(--gold-bright))"
                          : "color-mix(in oklch, var(--primary) 30%, var(--border))",
                    }}
                  >
                    {i === 0 && (
                      <img
                        src={avatarUrl}
                        alt="top player"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                ))}
                <div className="w-7 h-7 rounded-full bg-background/90 border border-primary/30 flex items-center justify-center font-bold text-primary text-[10px]">
                  +1.2k
                </div>
              </div>
            </div>

            <div className="h-9 w-px bg-primary/20 shrink-0" />

            <div className="flex flex-col">
              <span className="text-[7px] text-primary uppercase tracking-[0.2em] font-bold mb-1">
                {t.activeBonus}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-primary font-bold text-base font-display">
                  {bonusMultiplier}
                </span>
                <span className="text-[10px] text-primary/70 uppercase tracking-widest">
                  {bonusTitle}
                </span>
              </div>
            </div>
          </button>
        </div>
      </div>
    );
  };

  if (isMobile) {
    return (
      <div className="fixed bottom-0 left-0 w-full bg-background/95 backdrop-blur-md border-t border-primary/20 z-30 flex justify-around py-2 shrink-0 h-[72px]">
        {NAV_ITEMS.map(({ id, Icon, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              if (id === "leaderboard") onOpenLeaderboard?.();
            }}
            className="flex flex-col items-center justify-center text-primary/70 hover:text-primary transition-all px-1.5"
          >
            <Icon className="w-5 h-5 mb-0.5" />
            <span className="text-[8px] uppercase max-w-[65px] text-center leading-tight font-medium">
              {label}
            </span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <aside
      className={`glass-panel border-r border-primary/10 flex flex-col z-20 bg-background/30 transition-all duration-300 min-h-0 h-full shrink-0 ${
        collapsed ? "w-24 p-3" : "w-80 min-w-[18rem] p-4"
      }`}
    >
      <div
        className={`flex w-full ${collapsed ? "justify-center" : "justify-end"} shrink-0 mb-3`}
      >
        <button
          className="p-1.5 bg-background/80 border border-primary/30 rounded-md shadow-md hover:bg-primary/20 hover:text-primary transition-all"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4 text-primary" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-primary" />
          )}
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain pr-1 [scrollbar-width:thin]">
        {renderContent()}
      </div>
    </aside>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-display text-[10px] text-primary uppercase tracking-[0.3em] flex items-center gap-2 mb-1.5">
      {children}
      <span className="flex-1 h-px bg-primary/20" />
    </h3>
  );
}
