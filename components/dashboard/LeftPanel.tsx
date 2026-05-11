"use client";

import {
  LuChevronLeft as ChevronLeft,
  LuChevronRight as ChevronRight,
  LuChevronDown,
  LuChevronUp,
  LuCheck,
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
import {
  claimRankChest,
  homeExchangeGemsForCoins,
} from "@/lib/api";
import { WEALTH_COINS_PER_GEM } from "@/lib/homeEconomy";
import type { DashStrings, DashLang } from "./dashboard-strings";
import type { MapStationApiRow, StationGameBundleRow } from "@/lib/api";
import { useState, useEffect, useMemo } from "react";
import {
  gameWeeklyPlaysRemaining,
  STATION_GAME_WEEKLY_PLAY_CAP,
} from "./mapConstants";
import { cn } from "@/lib/utils";
import { MapWorldRadar } from "./MapWorldRadar";
import {
  RewardChestDialog,
  type RewardChestItem,
} from "@/components/ui/reward-chest-dialog";

type MobileSheetId = "quest" | "treasury" | "progress";

interface LeftPanelProps {
  t: DashStrings;
  lang: DashLang;
  accentColor: string;
  xp: number;
  xpMax: number;
  avatarUrl: string;
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
  onTreasuryChanged?: () => void;
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
    <div className="flex items-center justify-between gap-2 rounded-xl border border-border/35 bg-background/35 px-2.5 py-1.5 backdrop-blur-sm dark:border-white/8 dark:bg-black/25">
      <span className="text-[11px] font-medium text-muted-foreground">
        {label}
      </span>
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
  accentColor: _accentColor,
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
  onTreasuryChanged,
  onOpenLeaderboard,
  lang,
}: LeftPanelProps) {
  const [rankXp, setRankXp] = useState(() => Math.max(0, Math.floor(xp)));
  const [rankXpMax, setRankXpMax] = useState(() =>
    Math.max(1, Math.floor(xpMax)),
  );
  const safeMax = Math.max(1, rankXpMax);
  const xpPct = Math.min(100, Math.round((rankXp / safeMax) * 100));
  const chestReady = rankXp >= safeMax;
  const [chestBusy, setChestBusy] = useState(false);
  const [chestDialogOpen, setChestDialogOpen] = useState(false);
  const [chestItems, setChestItems] = useState<RewardChestItem[]>([]);
  const [chestIntroText, setChestIntroText] = useState<string | undefined>(
    undefined,
  );
  const [gemExchangeOpen, setGemExchangeOpen] = useState(false);
  const [gemExBusy, setGemExBusy] = useState(false);
  const [gemExErr, setGemExErr] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileSheet, setMobileSheet] = useState<MobileSheetId | null>(null);
  /** Гэр дээр: даалгавар + жижиг зургийн хэсгийг хураах (зурагтай ижил) */
  const [homeQuestOpen, setHomeQuestOpen] = useState(true);
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

  useEffect(() => {
    setRankXp(Math.max(0, Math.floor(xp)));
    setRankXpMax(Math.max(1, Math.floor(xpMax)));
  }, [xp, xpMax]);

  const gemCount = treasury?.gems ?? 0;
  const stationName = (stationInfo?.name || currentStationLabel || activeStationId).trim();
  const statusTitle =
    activeStationId === "home"
      ? t.sidebarAtHomeBadge
      : lang === "mn"
        ? `Одоо: ${stationName}`
        : `Now at: ${stationName}`;
  const statusHint =
    activeStationId === "home"
      ? t.sidebarAtHomeHint
      : lang === "mn"
        ? "Эндээс тоглоом сонгоод нээнэ. Өөр өртөө рүү явах бол зураг дээр дараад «Очих» ашиглана."
        : "Open a game from this station. To move, pick another station on the map and tap Go there.";

  async function exchangeGems(qty: number) {
    const em = userEmail?.trim();
    if (!em || qty < 1) return;
    setGemExBusy(true);
    setGemExErr(null);
    try {
      await homeExchangeGemsForCoins({ email: em, gems: qty });
      onTreasuryChanged?.();
      setGemExchangeOpen(false);
    } catch (e) {
      setGemExErr(e instanceof Error ? e.message : "—");
    } finally {
      setGemExBusy(false);
    }
  }

  const renderContent = (sheetFilter?: MobileSheetId | null) => {
    const relaxed = !!sheetFilter;
    const tx = (compact: string, loose: string) => (relaxed ? loose : compact);
    const show = (id: MobileSheetId) => !sheetFilter || sheetFilter === id;

    if (collapsed && sheetFilter == null) {
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
      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1",
          relaxed && "gap-5 pb-2",
        )}
      >
        {show("quest") ? (
          <div className="flex shrink-0 flex-col gap-2">
            {sheetFilter == null && activeStationId !== "home" ? (
              <SectionTitle>{t.currentExpedition}</SectionTitle>
            ) : null}
            <div className="dash-map-quest-panel relative shrink-0 overflow-hidden">
              {activeStationId === "home" ? (
                <div className="flex items-center justify-between gap-2 border-b border-[color:var(--map-ui-border)] px-3 py-2 sm:px-3.5">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[color:var(--map-ui-text-muted)] sm:text-[12px]">
                    {t.questsPanelTitle}
                  </span>
                  <button
                    type="button"
                    onClick={() => setHomeQuestOpen((o) => !o)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[color:var(--map-ui-border-subtle)] text-[color:var(--map-ui-text-muted)] transition hover:border-[color:var(--map-ui-border-bright)] hover:text-[color:var(--map-gold)]"
                    aria-expanded={homeQuestOpen}
                    aria-label={
                      homeQuestOpen
                        ? t.questsPanelCollapseAria
                        : t.questsPanelExpandAria
                    }
                  >
                    {homeQuestOpen ? (
                      <LuChevronUp className="size-4" aria-hidden />
                    ) : (
                      <LuChevronDown className="size-4" aria-hidden />
                    )}
                  </button>
                </div>
              ) : null}
              <div
                className={cn(
                  "flex flex-col gap-2.5 p-3",
                  activeStationId === "home" && !homeQuestOpen && "hidden",
                  activeStationId !== "home" &&
                    sheetFilter == null &&
                    "max-h-[min(38vh,280px)] overflow-y-auto",
                  relaxed &&
                    "gap-3 p-4 sm:p-4 max-h-[min(60vh,480px)] overflow-y-auto",
                )}
              >
                {activeStationId !== "home" ? (
                  <span
                    className={cn(
                      "inline-flex w-fit rounded-full bg-primary/12 px-2 py-0.5 font-semibold text-primary",
                      tx("text-[9px]", "text-xs"),
                    )}
                  >
                    {lang === "mn" ? "Өртөө" : "Station"}
                  </span>
                ) : null}
                {activeStationId !== "home" && stationInfo ? (
                  <>
                    <div className="flex aligin-center">
                      <h4
                        className={cn(
                          "font-display font-semibold leading-tight tracking-tight text-foreground",
                          tx("text-[16px]", "text-base"),
                        )}
                      >
                        {stationInfo.name}
                      </h4>
                      {/* {stationInfo.region ? (
                        <p
                          className={cn(
                            "mt-0.5 font-medium text-primary/85",
                            tx("text-[10px]", "text-sm"),
                          )}
                        >
                          {stationInfo.region}
                        </p>
                      ) : null} */}
                    </div>
                    {/* {stationStoryText.title || stationStoryText.desc ? (
                      <div className="rounded-lg border border-sky-500/20 bg-sky-950/10 px-2 py-1.5 sm:px-3 sm:py-2">
                        <p
                          className={cn(
                            "mb-0.5 font-semibold uppercase tracking-wider text-sky-200/85",
                            tx("text-[9px]", "text-xs"),
                          )}
                        >
                          {t.mapStationHistoryTitle}
                        </p>
                        {stationStoryText.title ? (
                          <p
                            className={cn(
                              "font-medium leading-snug text-foreground",
                              tx(
                                "line-clamp-2 text-[10px]",
                                "text-sm line-clamp-none",
                              ),
                            )}
                          >
                            {stationStoryText.title}
                          </p>
                        ) : null}
                        {stationStoryText.desc ? (
                          <p
                            className={cn(
                              "leading-relaxed text-muted-foreground",
                              tx(
                                "line-clamp-4 text-[10px]",
                                "text-sm line-clamp-none mt-1.5",
                              ),
                              stationStoryText.title ? "mt-1" : "",
                            )}
                          >
                            {stationStoryText.desc}
                          </p>
                        ) : null}
                      </div>
                    ) : ( */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-3">
                      {(sheetFilter == null || sheetFilter === "quest") ? (
                        <MapWorldRadar className="shrink-0 self-center sm:mt-0.5 sm:self-start" />
                      ) : null}
                      <div className="flex min-w-0 flex-1 items-start gap-2.5">
                        <span
                          className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-emerald-500/45 bg-emerald-500/15"
                          aria-hidden
                        >
                          <LuCheck
                            className="size-3.5 text-emerald-400"
                            strokeWidth={2.75}
                          />
                        </span>
                        <div className="min-w-0 flex-1 space-y-1">
                          <p
                            className={cn(
                              "font-display font-semibold leading-snug text-[color:var(--map-ui-text)]",
                              tx("text-sm", "text-base"),
                            )}
                          >
                            {statusTitle}
                          </p>
                          <p
                            className={cn(
                              "leading-relaxed text-[color:var(--map-ui-text-muted)]",
                              tx("text-[12px]", "text-sm"),
                            )}
                          >
                            {statusHint}
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                ) : activeStationId !== "home" ? (
                  <>
                    <h4
                      className={cn(
                        "font-display font-semibold leading-tight text-foreground",
                        tx("text-[14px]", "text-base"),
                      )}
                    >
                      {currentStationLabel?.trim() || activeStationId}
                    </h4>
                    <p
                      className={cn(
                        "leading-relaxed text-muted-foreground",
                        tx(
                          "line-clamp-2 text-[10px]",
                          "text-sm line-clamp-none",
                        ),
                      )}
                    >
                      {t.questDesc}
                    </p>
                  </>
                ) : (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-3">
                      {(sheetFilter == null || sheetFilter === "quest") ? (
                        <MapWorldRadar className="shrink-0 self-center sm:mt-0.5 sm:self-start" />
                      ) : null}
                      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
                        <div className="flex items-start gap-2.5">
                          <span
                            className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-emerald-500/45 bg-emerald-500/15"
                            aria-hidden
                          >
                            <LuCheck
                              className="size-3.5 text-emerald-400"
                              strokeWidth={2.75}
                            />
                          </span>
                          <div className="min-w-0 flex-1 space-y-1">
                            <p
                              className={cn(
                                "font-display font-semibold leading-snug text-[color:var(--map-ui-text)]",
                                tx("text-sm", "text-base"),
                              )}
                            >
                              {statusTitle}
                            </p>
                            <p
                              className={cn(
                                "leading-relaxed text-[color:var(--map-ui-text-muted)]",
                                tx("text-[12px]", "text-sm"),
                              )}
                            >
                              {statusHint}
                            </p>
                          </div>
                        </div>
                      </div>
                  </div>
                )}
                {/* {activeStationId !== "home" &&
                  journeyDay != null &&
                  totalStations != null &&
                  totalStations > 0 && (
                    <p
                      className={cn(
                        "border-t border-border/40 pt-2 leading-snug text-muted-foreground",
                        tx(
                          "line-clamp-2 text-[9px]",
                          "text-xs line-clamp-none",
                        ),
                      )}
                    >
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
                            {lang === "mn"
                              ? "Зураг дээр сонгоно"
                              : "Pick on map"}
                          </span>
                        </>
                      )}
                    </p>
                  )} */}
                {activeStationId !== "home" && displayGames.length > 0 && (
                  <div className="min-h-0 shrink rounded-lg bg-muted px-2 py-2 sm:px-3 sm:py-2.5">
                    <p
                      className={cn(
                        "mb-1.5 font-semibold uppercase tracking-wider text-foreground/80",
                        tx("text-[10px]", "text-xs"),
                      )}
                    >
                      {lang === "mn" ? "Тоглоом" : "Games"}
                    </p>
                    <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                      {displayGames.slice(0, 4).map((g) => {
                        const wkRem =
                          activeStationId && g.slug
                            ? gameWeeklyPlaysRemaining(
                                activeStationId,
                                g.slug,
                                stationGameVisits,
                              )
                            : STATION_GAME_WEEKLY_PLAY_CAP;
                        const cap = STATION_GAME_WEEKLY_PLAY_CAP;
                        const wkLabel =
                          wkRem <= 0
                            ? lang === "mn"
                              ? `7 хоногийн лимит (${cap})`
                              : `Weekly cap (${cap})`
                            : lang === "mn"
                              ? `Үлдсэн: ${wkRem} / ${cap}`
                              : `Left: ${wkRem} / ${cap}`;

                        return (
                          <div
                            key={g.id}
                            className="rounded-md border border-primary/30 bg-nuted px-1.5 py-1 sm:px-2 sm:py-1.5"
                          >
                            <p
                              className={cn(
                                "line-clamp-2 font-medium leading-tight text-",
                                tx("text-[10px]", "text-sm"),
                              )}
                            >
                              {lang === "mn" ? g.name_mn : g.name_en}
                            </p>
                            <p
                              className={cn(
                                "mt-0.5 tabular-nums text-muted-foreground",
                                tx("text-[9px]", "text-xs"),
                              )}
                            >
                              {wkLabel}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                    {displayGames.length > 4 ? (
                      <p
                        className={cn(
                          "mt-1 text-muted-foreground",
                          tx("text-[9px]", "text-xs"),
                        )}
                      >
                        {lang === "mn"
                          ? `+${displayGames.length - 4} бусад — зураг дээр нээнэ үү`
                          : `+${displayGames.length - 4} more — open on map`}
                      </p>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {show("treasury") ? (
          <div className="w-full shrink-0">
            {sheetFilter == null ? (
              <SectionTitle>{t.treasury}</SectionTitle>
            ) : null}
            <div
              className={cn(
                "mt-2 rounded-2xl border border-border/60 bg-muted/15 shadow-sm",
                relaxed ? "p-3 sm:p-4" : "p-2",
              )}
            >
              <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
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
                <button
                  type="button"
                  title={t.treasuryGemExchangeTitle}
                  disabled={!userEmail?.trim()}
                  onClick={() => {
                    setGemExErr(null);
                    setGemExchangeOpen(true);
                  }}
                  className="flex w-full items-center justify-between gap-2 rounded-lg border border-primary/30 bg-muted/25 px-2.5 py-1.5 text-left transition-colors hover:border-primary/35 hover:bg-muted/40 disabled:pointer-events-none disabled:opacity-45"
                >
                  <span
                    className={cn(
                      "font-medium text-muted-foreground",
                      tx("text-[11px]", "text-sm"),
                    )}
                  >
                    {t.treasuryGemsLabel}
                  </span>
                  <span
                    className={cn(
                      "font-semibold tabular-nums text-foreground",
                      tx("text-sm", "text-base"),
                    )}
                  >
                    {gemCount.toLocaleString()}
                  </span>
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {show("progress") ? (
          <div className="w-full shrink-0">
            {sheetFilter == null ? <SectionTitle>{t.rank}</SectionTitle> : null}
            <div
              className={cn(
                "mt-1 rounded-2xl border border-border/60 bg-background/80 shadow-sm dark:bg-background/50",
                relaxed ? "p-4" : "p-3",
              )}
            >
              <div
                className={cn(
                  "mb-1 flex justify-between gap-1 text-foreground",
                  tx("text-[11px]", "text-sm"),
                )}
              >
                <span className="font-semibold text-primary">
                  {t.rankTitle}
                </span>
                <span className="tabular-nums font-medium text-foreground">
                  {rankXp.toLocaleString()} / {safeMax.toLocaleString()}
                </span>
              </div>
              <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${xpPct}%`,
                    background: "var(--gold-gradient, var(--grad-gold))",
                  }}
                />
              </div>
              {chestReady ? (
                <div className="mt-3 space-y-2 rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-950/35 to-background/90 px-2.5 py-2 sm:px-3 sm:py-2.5">
                  <p
                    className={cn(
                      "flex items-start gap-2 leading-snug text-amber-100/95",
                      tx("text-[11px]", "text-sm"),
                    )}
                  >
                    <PackageIcon
                      className={cn(
                        "shrink-0 text-amber-400",
                        relaxed ? "size-5" : "size-4",
                      )}
                    />
                    <span
                      className={relaxed ? "line-clamp-none" : "line-clamp-3"}
                    >
                      {t.rankChestOpen}
                    </span>
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    className="h-9 w-full bg-amber-600 text-xs font-medium text-white hover:bg-amber-600/95 sm:text-sm"
                    disabled={chestBusy || !userEmail?.trim()}
                    onClick={async () => {
                      const em = userEmail?.trim();
                      if (!em) return;
                      setChestBusy(true);
                      setChestIntroText(
                        lang === "mn"
                          ? "Rank дүүрлээ. Авдрыг нээгээд шагналаа авна уу."
                          : "Rank is full. Open the chest to claim your reward.",
                      );
                      try {
                        const { reward, user } = await claimRankChest({
                          email: em,
                        });
                        const item: RewardChestItem = {
                          icon:
                            reward.kind === "gem"
                              ? "💎"
                              : reward.kind === "kp"
                                ? "⭐"
                                : "🪙",
                          label:
                            reward.kind === "gem"
                              ? lang === "mn"
                                ? "Эрдэнийн чулуу"
                                : "Gems"
                              : reward.kind === "kp"
                                ? "KP"
                                : lang === "mn"
                                  ? "Зоос"
                                  : "Coins",
                          value: `+${reward.amount.toLocaleString()}`,
                          tone: "positive",
                        };
                        setChestItems([item]);
                        setChestDialogOpen(true);
                        const prog =
                          user && typeof user.progress === "object" && user.progress
                            ? (user.progress as Record<string, unknown>)
                            : {};
                        const nextXp = Number(prog.xp);
                        const nextXpMax = Number(prog.xpMax);
                        if (Number.isFinite(nextXp)) {
                          setRankXp(Math.max(0, Math.floor(nextXp)));
                        }
                        if (Number.isFinite(nextXpMax) && nextXpMax > 0) {
                          setRankXpMax(Math.max(1, Math.floor(nextXpMax)));
                        }
                        window.setTimeout(() => onChestClaimed?.(), 450);
                      } catch (e) {
                        const msg = e instanceof Error ? e.message : "";
                        setChestItems([
                          {
                            icon: "⚠️",
                            label: lang === "mn" ? "Алдаа" : "Error",
                            value:
                              msg ||
                              (lang === "mn"
                                ? "Шагнал авахад алдаа гарлаа"
                                : "Failed to claim reward"),
                            tone: "negative",
                          },
                        ]);
                        setChestIntroText(
                          lang === "mn"
                            ? "Авдар нээх үед алдаа гарлаа."
                            : "There was an issue opening the chest.",
                        );
                        setChestDialogOpen(true);
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
        ) : null}

        {sheetFilter == null ? (
          <div className="w-full shrink-0 pb-1">
            <SectionTitle>{t.leaderboard}</SectionTitle>
            <button
              type="button"
              onClick={() => onOpenLeaderboard?.()}
              className="group mt-1 flex w-full items-center gap-2.5 rounded-2xl border border-border/60 bg-muted/20 px-3 py-2 text-left transition-colors hover:border-primary/35 hover:bg-muted/35"
            >
              <div className="flex -space-x-1.5 shrink-0">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-6 w-6 overflow-hidden rounded-full border-2 bg-background ring-1 ring-background/60"
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
        ) : null}
      </div>
    );
  };

  const sharedDialogs = (
    <>
      {chestDialogOpen ? (
        <RewardChestDialog
          open={chestDialogOpen}
          onOpenChange={setChestDialogOpen}
          lang={lang}
          title={lang === "mn" ? "Rank авдар" : "Rank chest"}
          introText={chestIntroText}
          items={chestItems}
        />
      ) : null}

      <Dialog
        open={gemExchangeOpen}
        onOpenChange={(o) => {
          setGemExchangeOpen(o);
          if (!o) setGemExErr(null);
        }}
      >
        <DialogContent className="w-[min(100vw-1.5rem,400px)] border-primary/20 bg-muted">
          <DialogHeader>
            <DialogTitle className="font-display text-base">
              {t.treasuryGemExchangeTitle}
            </DialogTitle>
          </DialogHeader>
          <p className="text-[12px] text-muted-foreground leading-snug sm:text-sm">
            {lang === "mn" ? (
              <>
                1 чулуу ={" "}
                <strong className="text-foreground">
                  {WEALTH_COINS_PER_GEM} зоос
                </strong>
                . {t.treasuryGemExchangeBlurb}
              </>
            ) : (
              <>
                <strong className="text-foreground">1 gem</strong> ={" "}
                <strong className="text-foreground">
                  {WEALTH_COINS_PER_GEM} coins
                </strong>
                . {t.treasuryGemExchangeBlurb}
              </>
            )}
          </p>
          {gemExErr ? (
            <p className="text-sm text-destructive">{gemExErr}</p>
          ) : null}
          <p className="text-xs tabular-nums text-foreground/90 sm:text-sm">
            {lang === "mn" ? "Таны чулуу: " : "Your gems: "}
            <strong>{gemCount.toLocaleString()}</strong>
          </p>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {([1, 5, 10] as const).map((n) => (
              <Button
                key={n}
                type="button"
                size="sm"
                variant="outline"
                disabled={gemExBusy || gemCount < n}
                onClick={() => void exchangeGems(n)}
              >
                {n === 1
                  ? lang === "mn"
                    ? `1 → ${WEALTH_COINS_PER_GEM}`
                    : `1 → ${WEALTH_COINS_PER_GEM}`
                  : `${n}`}
              </Button>
            ))}
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={gemExBusy || gemCount < 1}
              onClick={() => void exchangeGems(gemCount)}
            >
              {t.treasuryGemExchangeAll}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );

  const mobileSheetTitle =
    mobileSheet === "quest"
      ? activeStationId === "home"
        ? t.questsPanelTitle
        : t.currentExpedition
      : mobileSheet === "treasury"
        ? t.treasury
        : mobileSheet === "progress"
          ? t.rank
          : "";

  if (isMobile) {
    return (
      <>
        <div
          data-tour-anchor="dashboard-sidebar"
          className="fixed bottom-0 left-0 z-30 flex h-[78px] w-full shrink-0 justify-around border-t border-[color:var(--map-ui-border)] bg-[color-mix(in_srgb,var(--map-ui-base)_74%,transparent)] py-2.5 pb-[max(0.35rem,env(safe-area-inset-bottom))] backdrop-blur-2xl"
        >
          {NAV_ITEMS.map(({ id, Icon, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                if (id === "leaderboard") {
                  onOpenLeaderboard?.();
                  return;
                }
                if (id === "quest") setMobileSheet("quest");
                else if (id === "treasury") setMobileSheet("treasury");
                else if (id === "progress") setMobileSheet("progress");
              }}
              className="flex min-w-0 max-w-[25%] flex-col items-center justify-center px-1.5 text-[color:var(--map-ui-text-muted)] transition-colors hover:text-[color:var(--map-gold)] active:scale-[0.98]"
            >
              <Icon className="mb-0.5 size-5 shrink-0" aria-hidden />
              <span className="max-w-full truncate text-[8px] font-semibold uppercase leading-tight tracking-wide sm:text-[9px]">
                {label}
              </span>
            </button>
          ))}
        </div>

        <Dialog
          open={mobileSheet !== null}
          onOpenChange={(o) => {
            if (!o) setMobileSheet(null);
          }}
        >
          <DialogContent
            showCloseButton
            className={cn(
              "flex max-h-[min(92dvh,900px)] w-[min(100vw-0.75rem,520px)] max-w-[calc(100vw-0.75rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg",
              "rounded-t-2xl border-primary/25 sm:rounded-2xl",
              "max-sm:top-auto max-sm:bottom-0 max-sm:left-1/2 max-sm:max-h-[min(88dvh,900px)] max-sm:translate-x-[-50%] max-sm:translate-y-0 max-sm:rounded-b-none max-sm:data-[state=closed]:slide-out-to-bottom-2 max-sm:data-[state=open]:slide-in-from-bottom-4",
            )}
          >
            <DialogHeader className="shrink-0 space-y-0 border-b border-border/50 bg-muted/25 px-4 py-3 text-left sm:px-5 sm:py-4">
              <DialogTitle className="font-display pr-8 text-left text-lg leading-snug sm:text-xl">
                {mobileSheetTitle}
              </DialogTitle>
            </DialogHeader>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-3 py-3 sm:px-5 sm:py-4 [scrollbar-gutter:stable]">
              {mobileSheet ? renderContent(mobileSheet) : null}
            </div>
          </DialogContent>
        </Dialog>

        {sharedDialogs}
      </>
    );
  }

  return (
    <>
      <aside
        data-tour-anchor="dashboard-sidebar"
        className={`dash-sidebar-shell z-20 flex h-full min-h-0 shrink-0 flex-col border-r transition-all duration-300 ${
          collapsed
            ? "w-24 p-2"
            : "w-[22rem] min-w-[20rem] max-w-[min(22rem,92vw)] p-4"
        }`}
      >
        <div
          className={`mb-2 flex w-full shrink-0 ${collapsed ? "justify-center" : "justify-end"}`}
        >
          <button
            type="button"
            className="dash-hud-icon-btn flex h-9 w-9 items-center justify-center rounded-full p-0 transition-colors"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? (
              <ChevronRight className="size-4 text-[color:var(--map-gold)]" />
            ) : (
              <ChevronLeft className="size-4 text-[color:var(--map-gold)]" />
            )}
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {renderContent()}
        </div>
      </aside>
      {sharedDialogs}
    </>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-0 flex items-center gap-2 font-[family-name:var(--font-inter)] text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--map-ui-text-muted)] sm:text-[12px]">
      {children}
      <span className="h-px flex-1 bg-[color:var(--map-ui-border)]" />
    </h3>
  );
}
