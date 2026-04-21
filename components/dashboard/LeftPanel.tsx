"use client";

import {
  LuChevronLeft as ChevronLeft,
  LuChevronRight as ChevronRight,
  LuMap as Map,
  LuGem as Gem,
  LuTrendingUp as TrendingUp,
  LuTrophy as Trophy,
  LuPackage as PackageIcon,
} from "react-icons/lu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { claimRankChest } from "@/lib/api";
import type { DashStrings, DashLang } from "./dashboard-strings";
import type { MapStationApiRow, StationGameBundleRow } from "@/lib/api";
import { useState, useEffect, useMemo } from "react";
import {
  gameWeeklyPlaysRemaining,
  stationAllGamesWeeklyLocked,
} from "./mapConstants";

interface LeftPanelProps {
  t: DashStrings;
  lang: DashLang;
  accentColor: string;
  xp: number;
  xpMax: number;
  avatarUrl: string;
  bonusMultiplier: string;
  bonusTitle: string;
  /** odoogiin urtuunii medeelel */
  journeyDay?: number;
  stationIndex?: number;
  totalStations?: number;
  currentStationLabel?: string;
  heroTier?: string;
  stationGames?: StationGameBundleRow[];
  currentStationId?: string;
  heroStationId?: string | null;
  mapStations?: MapStationApiRow[];
  stationSteps?: Record<string, { completedGameSlugs: string[] }>;
  stationGameVisits?: Record<string, Record<string, number[]>>;
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
  userEmail?: string;
  onChestClaimed?: () => void;
  /** gerluu camer shiljuuleh */
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
  stationGameVisits,
  treasury,
  userEmail,
  onChestClaimed,
  onGoToGer,
  onOpenLeaderboard,
  lang,
}: LeftPanelProps) {
  const safeMax = Math.max(1, xpMax);
  const xpPct = Math.min(100, Math.round((xp / safeMax) * 100));
  const chestReady = xp >= safeMax;
  const [chestBusy, setChestBusy] = useState(false);
  const [chestDialogOpen, setChestDialogOpen] = useState(false);
  const [chestMessage, setChestMessage] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const activeStationId = heroStationId ?? "home";

  const stationInfo = useMemo(
    () => mapStations.find((s) => s.id === activeStationId),
    [mapStations, activeStationId],
  );

  /** Тухайн өртөөний quest_hint / quest_desc (API), байхгүй бол нэгдсэн aяллын t.quest* */
  const stationStoryText = useMemo(() => {
    if (activeStationId === "home") return { title: "", desc: "" };
    const row = mapStations.find((s) => s.id === activeStationId);
    const title = (
      row?.quest_hint?.trim() ||
      t.questTitle?.trim() ||
      ""
    ).trim();
    const desc = (
      row?.quest_desc?.trim() ||
      t.questDesc?.trim() ||
      ""
    ).trim();
    return { title, desc };
  }, [activeStationId, mapStations, t.questTitle, t.questDesc]);

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
                              ? "3) Нэг өртөөний тоглоом бүрт 7 хоногт хамгийн ихдээ 2 удаа тоглоно; бүх тоглоомын лимит дуусвал өртөө түгжигдэнэ."
                              : "3) Each minigame at a station allows up to 2 plays per 7 days; when all are exhausted, the station locks for the week."}
                          </li>
                          <li>
                            {lang === "mn"
                              ? "4) Гэр дээр дарж гэрээ сайжруулж, мал худалдаж авна."
                              : "4) Use to upgrade your ger and buy livestock."}
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
                      const slugs = displayGames.map((x) => x.slug);
                      const allLocked =
                        activeStationId &&
                        stationAllGamesWeeklyLocked(
                          activeStationId,
                          slugs,
                          stationGameVisits,
                        );
                      if (allLocked) {
                        return lang === "mn"
                          ? "Энэ өртөөний бүх тоглоомын 7 хоногийн лимит дууссан — өртөө түгжигдсэн."
                          : "Weekly limits for all minigames here are used — station locked for now.";
                      }
                      return lang === "mn"
                        ? "Тоглоом бүрт 7 хоногт хамгийн ихдээ 2 удаа."
                        : "Up to 2 plays per 7 days for each minigame.";
                    })()}
                  </p>
                  <ul className="dashboard-left-scroll space-y-1 max-h-[min(40vh,220px)] overflow-y-auto pr-0.5">
                    {displayGames.map((g) => {
                      const completed = new Set(
                        (activeStationId
                          ? stationSteps?.[activeStationId]?.completedGameSlugs
                          : []) ?? [],
                      );
                      const nextRequired =
                        displayGames.find((x) => !completed.has(x.slug))
                          ?.slug ?? null;
                      const status = completed.has(g.slug)
                        ? lang === "mn"
                          ? "Дууссан"
                          : "Done"
                        : g.slug === nextRequired
                          ? lang === "mn"
                            ? "Дараагийн"
                            : "Next"
                          : lang === "mn"
                            ? "Түгжээтэй"
                            : "Locked";
                      const wkRem =
                        activeStationId && g.slug
                          ? gameWeeklyPlaysRemaining(
                              activeStationId,
                              g.slug,
                              stationGameVisits,
                            )
                          : 2;
                      const wkLabel =
                        wkRem <= 0
                          ? lang === "mn"
                            ? "7х дууссан"
                            : "Week cap"
                          : lang === "mn"
                            ? `7х ${wkRem}/2`
                            : `wk ${wkRem}/2`;

                      return (
                        <li
                          key={g.id}
                          className="text-[11px] text-foreground/80 leading-snug flex justify-between gap-2"
                        >
                          <span className="truncate">
                            {lang === "mn" ? g.name_mn : g.name_en}
                          </span>
                          <span className="shrink-0 flex items-center gap-2">
                            <span
                              className={
                                wkRem <= 0
                                  ? "text-[9px] uppercase tracking-wider text-amber-700/90 dark:text-amber-400/90"
                                  : "text-[9px] uppercase tracking-wider text-muted-foreground"
                              }
                            >
                              {wkLabel}
                            </span>
                            <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
                              {status}
                            </span>
                            {(lang === "mn"
                              ? g.reward_hint_mn
                              : g.reward_hint_en
                            )?.trim() ? (
                              <span className="text-primary/80 text-[10px]">
                                {lang === "mn"
                                  ? g.reward_hint_mn
                                  : g.reward_hint_en}
                              </span>
                            ) : null}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {activeStationId !== "home" &&
              (stationStoryText.title || stationStoryText.desc) ? (
                <div className="rounded-lg border border-primary/15 bg-background/40 px-3 py-2">
                  <p className="text-[9px] uppercase tracking-wider text-primary/90 font-bold mb-1">
                    {lang === "mn" ? "Өртөөний түүх" : "Station story"}
                  </p>
                  {stationStoryText.title ? (
                    <p className="text-[11px] text-foreground/80 font-semibold leading-snug">
                      {stationStoryText.title}
                    </p>
                  ) : null}
                  {stationStoryText.desc ? (
                    <p
                      className={`text-[11px] text-foreground/70 leading-relaxed ${stationStoryText.title ? "mt-1" : ""}`}
                    >
                      {stationStoryText.desc}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="w-full">
          <SectionTitle>{t.treasury}</SectionTitle>
          <div className="space-y-2 mt-1.5">
            <div className="grid grid-cols-2 gap-2">
              <TreasuryRow
                label={lang === "mn" ? "Гэр" : "Home"}
                value={`Lv ${treasury?.gerLevel ?? 1}`}
              />
              <TreasuryRow
                label={t.treasuryKpLabel}
                value={(treasury?.kp ?? 0).toLocaleString()}
              />
              <TreasuryRow
                label={t.treasuryCoinsLabel}
                value={(treasury?.coins ?? 0).toLocaleString()}
              />
              <TreasuryRow
                label={t.treasuryGemsLabel}
                value={(treasury?.gems ?? 0).toLocaleString()}
              />
            </div>
            <p className="text-[10px] text-muted-foreground leading-snug px-0.5">
              {t.treasuryHint}
            </p>
            <div className="rounded-lg border border-primary/15 bg-background/60 px-3 py-2">
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">
                {lang === "mn" ? "Мал сүрэг" : "Livestock"}
              </p>
              <div className="flex flex-wrap gap-1 text-xs text-foreground/85 tabular-nums">
                <span className="px-2 py-1 rounded-full border border-primary/15 bg-primary/5">
                  🐑 {(treasury?.livestock?.sheep ?? 0).toLocaleString()}
                </span>
                <span className="px-2 py-1 rounded-full border border-primary/15 bg-primary/5">
                  🐐 {(treasury?.livestock?.goat ?? 0).toLocaleString()}
                </span>
                <span className="px-2 py-1 rounded-full border border-primary/15 bg-primary/5">
                  🐄 {(treasury?.livestock?.cow ?? 0).toLocaleString()}
                </span>
                <span className="px-2 py-1 rounded-full border border-primary/15 bg-primary/5">
                  🐎 {(treasury?.livestock?.horse ?? 0).toLocaleString()}
                </span>
                <span className="px-2 py-1 rounded-full border border-primary/15 bg-primary/5">
                  🐫 {(treasury?.livestock?.camel ?? 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full">
          <SectionTitle>{t.rank}</SectionTitle>
          <div className="glass bg-background/90 p-3 rounded-lg border border-primary/20 mt-1.5">
            <div className="flex justify-between text-[11px] text-foreground mb-1.5">
              <span className="font-bold uppercase tracking-wider text-primary">
                {t.rankTitle}
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
            {chestReady ? (
              <div className="mt-2 rounded-lg border border-amber-500/35 bg-gradient-to-br from-amber-950/40 to-background/80 px-3 py-2 space-y-2">
                <p className="text-[11px] text-amber-100/95 leading-snug flex items-start gap-2">
                  <PackageIcon className="size-4 shrink-0 mt-0.5 text-amber-400" />
                  <span>{t.rankChestOpen}</span>
                </p>
                <Button
                  type="button"
                  size="sm"
                  className="w-full gap-2 bg-amber-600/90 hover:bg-amber-600 text-white"
                  disabled={chestBusy || !userEmail?.trim()}
                  onClick={async () => {
                    const em = userEmail?.trim();
                    if (!em) return;
                    setChestBusy(true);
                    try {
                      const { reward } = await claimRankChest({ email: em });
                      const msg =
                        reward.kind === "gem"
                          ? t.rankChestResultGem
                          : reward.kind === "kp"
                            ? t.rankChestResultKp.replace(
                                "{n}",
                                String(reward.amount),
                              )
                            : t.rankChestResultCoins.replace(
                                "{n}",
                                String(reward.amount),
                              );
                      setChestMessage(msg);
                      setChestDialogOpen(true);
                      window.setTimeout(() => onChestClaimed?.(), 500);
                    } catch {
                      /* ignore */
                    } finally {
                      setChestBusy(false);
                    }
                  }}
                >
                  {chestBusy ? "…" : t.rankChestClaim}
                </Button>
              </div>
            ) : null}
          </div>
        </div>

        <Dialog open={chestDialogOpen} onOpenChange={setChestDialogOpen}>
          <DialogContent className="sm:max-w-sm border-primary/20">
            <DialogHeader>
              <DialogTitle className="font-display text-base">
                {lang === "mn" ? "Шагнал" : "Reward"}
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-foreground/90 leading-relaxed">
              {chestMessage}
            </p>
          </DialogContent>
        </Dialog>

        <div className="w-full">
          <SectionTitle>{t.leaderboard}</SectionTitle>
          <button
            type="button"
            onClick={() => onOpenLeaderboard?.()}
            className="group w-full text-left mt-1.5 rounded-xl border border-primary/20 bg-gradient-to-br from-primary/[0.08] via-background/40 to-background/80 hover:border-primary/35 hover:from-primary/[0.12] transition-all duration-200 shadow-sm hover:shadow-md px-3 py-1"
          >
            <div className="flex items-center gap-1">
              <div className="flex flex-col min-w-0 flex-1 gap-1">
                <span className="text-[9px] text-primary uppercase tracking-[0.18em] font-bold">
                  {t.topPlayersLabel}
                </span>
                <span className="text-xs text-muted-foreground leading-snug line-clamp-2">
                  {t.leaderboard}
                </span>
                <div className="flex items-center -space-x-1.5 pt-0.5">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-7 h-7 rounded-full border-2 overflow-hidden bg-background/90 ring-1 ring-background/50"
                      style={{
                        zIndex: 30 - i * 10,
                        borderColor:
                          i === 0
                            ? "var(--gold-main, var(--gold-bright))"
                            : "color-mix(in oklch, var(--primary) 28%, var(--border))",
                      }}
                    >
                      {i === 0 && (
                        <img
                          src={avatarUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                  ))}
                </div>
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

      <div className="dashboard-left-scroll flex-1 min-h-0 overflow-y-auto overscroll-contain pr-1">
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
