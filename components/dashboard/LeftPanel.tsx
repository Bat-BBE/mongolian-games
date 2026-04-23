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
import { gameWeeklyPlaysRemaining } from "./mapConstants";

interface LeftPanelProps {
  t: DashStrings;
  lang: DashLang;
  accentColor: string;
  xp: number;
  xpMax: number;
  avatarUrl: string;
  /** odoogiin urtuunii medeelel */
  journeyDay?: number;
  stationIndex?: number;
  totalStations?: number;
  currentStationLabel?: string;
  stationGames?: StationGameBundleRow[];
  heroStationId?: string | null;
  mapStations?: MapStationApiRow[];
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
    <div className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-muted/25 px-2.5 py-1.5">
      <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold tabular-nums text-foreground">
        {value}
        {hint ? (
          <span className="ml-1.5 text-[11px] font-normal text-muted-foreground">
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
  journeyDay,
  stationIndex,
  totalStations,
  currentStationLabel,
  stationGames = [],
  heroStationId = null,
  mapStations = [],
  stationGameVisits,
  treasury,
  userEmail,
  onChestClaimed,
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
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1">
        <div className="flex shrink-0 flex-col gap-2">
          <SectionTitle>
            {activeStationId === "home"
              ? t.sidebarAtHomeSectionTitle
              : t.currentExpedition}
          </SectionTitle>
          <div
            className="relative shrink-0 overflow-hidden rounded-2xl border border-primary/20 bg-background/80 shadow-sm ring-1 ring-black/[0.04] dark:bg-background/60 dark:ring-white/[0.06]"
            style={{
              boxShadow: `0 0 0 1px color-mix(in oklch, ${accentColor} 12%, transparent), 0 8px 24px -12px color-mix(in oklch, ${accentColor} 25%, transparent)`,
            }}
          >
            <div
              className={`flex flex-col gap-2 p-3 ${
                activeStationId !== "home"
                  ? "max-h-[min(44vh,300px)] overflow-y-auto"
                  : ""
              }`}
            >
              {activeStationId !== "home" ? (
                <span className="inline-flex w-fit rounded-full bg-primary/12 px-2.5 py-0.5 text-[10px] font-semibold text-primary">
                  {lang === "mn" ? "Өртөө" : "Station"}
                </span>
              ) : null}
              {activeStationId !== "home" && stationInfo ? (
                <>
                  <h4 className="font-display text-[15px] font-semibold leading-snug tracking-tight text-foreground">
                    {stationInfo.name}
                  </h4>
                  {stationInfo.region ? (
                    <p className="text-[11px] font-medium text-primary/90">
                      {stationInfo.region}
                    </p>
                  ) : null}
                  <p className="line-clamp-3 text-[11px] leading-relaxed text-muted-foreground">
                    {displayGames[0]
                      ? lang === "mn"
                        ? displayGames[0].description_mn
                        : displayGames[0].description_en
                      : t.questDesc}
                  </p>
                </>
              ) : activeStationId !== "home" ? (
                <>
                  <h4 className="font-display text-[15px] font-semibold leading-snug tracking-tight text-foreground">
                    {currentStationLabel?.trim() || activeStationId}
                  </h4>
                  <p className="line-clamp-3 text-[11px] leading-relaxed text-muted-foreground">
                    {t.questDesc}
                  </p>
                </>
              ) : (
                <div className="space-y-2">
                  <p className="font-display text-sm font-semibold text-foreground">
                    {t.sidebarAtHomeBadge}
                  </p>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    {t.sidebarAtHomeHint}
                  </p>
                </div>
              )}
              {activeStationId !== "home" &&
                journeyDay != null &&
                totalStations != null &&
                totalStations > 0 && (
                  <p className="line-clamp-2 border-t border-border/50 pt-2 text-[10px] leading-snug text-muted-foreground">
                    <span className="font-semibold text-primary">
                      {t.journeyDayLabel} {journeyDay}
                    </span>
                    {stationIndex != null && currentStationLabel ? (
                      <>
                        <span className="text-muted-foreground/60"> · </span>
                        <span>
                          {stationIndex}/{totalStations}
                        </span>
                        <span className="text-muted-foreground/60"> · </span>
                        <span className="text-foreground/85">
                          {currentStationLabel}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-muted-foreground/60"> · </span>
                        <span>
                          {lang === "mn" ? "Зураг дээр сонгоно" : "Pick on map"}
                        </span>
                      </>
                    )}
                  </p>
                )}
              {activeStationId !== "home" && displayGames.length > 0 && (
                <div className="min-h-0 shrink rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5">
                  <p className="mb-2 text-[11px] font-semibold text-foreground/90">
                    {lang === "mn" ? "Тоглоом" : "Games"}
                  </p>
                  <ul className="space-y-1.5">
                    {displayGames.slice(0, 5).map((g) => {
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
                          className="flex items-center justify-between gap-2 text-[12px] leading-snug text-foreground"
                        >
                          <span className="min-w-0 truncate">
                            {lang === "mn" ? g.name_mn : g.name_en}
                          </span>
                          <span className="shrink-0 tabular-nums text-[10px] text-muted-foreground">
                            {wkLabel}
                          </span>
                        </li>
                      );
                    })}
                    {displayGames.length > 5 ? (
                      <li className="text-[10px] text-muted-foreground">
                        {lang === "mn"
                          ? `+${displayGames.length - 5} бусад`
                          : `+${displayGames.length - 5} more`}
                      </li>
                    ) : null}
                  </ul>
                </div>
              )}

              {activeStationId !== "home" &&
              (stationStoryText.title || stationStoryText.desc) ? (
                <div className="shrink-0 rounded-xl border border-border/60 bg-muted/15 px-2.5 py-2">
                  <p className="mb-1 text-[10px] font-semibold text-foreground/90">
                    {lang === "mn" ? "Түүх" : "Lore"}
                  </p>
                  {stationStoryText.title ? (
                    <p className="line-clamp-2 text-[11px] font-medium leading-snug text-foreground">
                      {stationStoryText.title}
                    </p>
                  ) : null}
                  {stationStoryText.desc ? (
                    <p
                      className={`line-clamp-3 text-[11px] leading-relaxed text-muted-foreground ${stationStoryText.title ? "mt-1" : ""}`}
                    >
                      {stationStoryText.desc}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="w-full shrink-0">
          <SectionTitle>{t.treasury}</SectionTitle>
          <div className="mt-2 rounded-2xl border border-border/60 bg-muted/15 p-2 shadow-sm">
            <div className="grid grid-cols-2 gap-1.5">
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
          </div>
        </div>

        <div className="w-full shrink-0">
          <SectionTitle>{t.rank}</SectionTitle>
          <div className="mt-2 rounded-2xl border border-border/60 bg-background/80 p-3 shadow-sm dark:bg-background/50">
            <div className="mb-2 flex justify-between gap-2 text-[11px] text-foreground">
              <span className="font-semibold text-primary">{t.rankTitle}</span>
              <span className="tabular-nums font-medium text-foreground">
                {xp.toLocaleString()} / {xpMax.toLocaleString()}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${xpPct}%`,
                  background: "var(--gold-gradient, var(--grad-gold))",
                }}
              />
            </div>
            {chestReady ? (
              <div className="mt-3 space-y-2 rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-950/35 to-background/90 px-2.5 py-2">
                <p className="flex items-start gap-2 text-[11px] leading-snug text-amber-100/95">
                  <PackageIcon className="size-4 shrink-0 text-amber-400" />
                  <span className="line-clamp-3">{t.rankChestOpen}</span>
                </p>
                <Button
                  type="button"
                  size="sm"
                  className="h-8 w-full bg-amber-600 text-[11px] font-medium text-white hover:bg-amber-600/95"
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

        <div className="w-full shrink-0 pb-1">
          <SectionTitle>{t.leaderboard}</SectionTitle>
          <button
            type="button"
            onClick={() => onOpenLeaderboard?.()}
            className="group mt-2 flex w-full items-center gap-3 rounded-2xl border border-border/60 bg-muted/20 px-3 py-2.5 text-left transition-colors hover:border-primary/35 hover:bg-muted/35"
          >
            <div className="flex -space-x-2 shrink-0">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-8 w-8 overflow-hidden rounded-full border-2 bg-background ring-1 ring-background/60"
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
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-[10px] font-semibold text-primary">
                {t.topPlayersLabel}
              </span>
              <span className="line-clamp-2 text-[11px] leading-snug text-muted-foreground">
                {t.leaderboard}
              </span>
            </div>
          </button>
        </div>
      </div>
    );
  };

  if (isMobile) {
    return (
      <div
        data-tour-anchor="dashboard-sidebar"
        className="fixed bottom-0 left-0 w-full bg-background/95 backdrop-blur-md border-t border-primary/20 z-30 flex justify-around py-2.5 shrink-0 h-[78px]"
      >
        {NAV_ITEMS.map(({ id, Icon, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              if (id === "leaderboard") onOpenLeaderboard?.();
            }}
            className="flex flex-col items-center justify-center text-primary/70 hover:text-primary transition-all px-2"
          >
            <Icon className="w-5 h-5 mb-1" />
            <span className="text-[9px] uppercase max-w-[76px] text-center leading-snug font-medium">
              {label}
            </span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <aside
      data-tour-anchor="dashboard-sidebar"
      className={`glass-panel flex h-full min-h-0 shrink-0 flex-col border-r border-border/40 bg-background/40 z-20 transition-all duration-300 dark:bg-background/25 ${
        collapsed ? "w-24 p-2" : "w-[22rem] min-w-[20rem] max-w-[min(22rem,92vw)] p-4"
      }`}
    >
      <div
        className={`flex w-full ${collapsed ? "justify-center" : "justify-end"} mb-2 shrink-0`}
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

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {renderContent()}
      </div>
    </aside>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-display mb-0 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-primary/90">
      {children}
      <span className="h-px flex-1 bg-border/80" />
    </h3>
  );
}
