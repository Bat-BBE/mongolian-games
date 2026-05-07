"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { homeExchangeGemsForCoins } from "@/lib/api";
import { WEALTH_COINS_PER_GEM } from "@/lib/homeEconomy";
import type { DashLang, DashStrings } from "./dashboard-strings";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";
import { LuBell, LuCircleHelp, LuCoins, LuHouse, LuLogOut, LuTrophy, LuUser, LuX } from "react-icons/lu";

type StatKey = "coins" | "gems" | "kp" | "ger" | "livestock";
type NotifId = "welcome" | "chat";

export interface MapFloatingTopBarProps {
  t: DashStrings;
  lang: DashLang;
  setLang: (l: DashLang) => void;
  playerName: string;
  playerTitle: string;
  avatarUrl: string;
  level: number;
  userEmail: string;
  coins?: number;
  gems?: number;
  gerLevel?: number;
  kp?: number;
  livestockTotal?: number;
  livestock?: { sheep: number; goat: number; cow: number; horse: number; camel: number };
  onTreasuryChanged?: () => void;
  onOpenProfile: () => void;
  onLogout: () => void;
  onOpenLeaderboard?: () => void;
  onShowIntroTour?: () => void;
}

type ChestStatKey = "coins" | "kp" | "livestock";
type LivestockKind = "sheep" | "goat" | "cow" | "horse" | "camel";

const pill =
  "dash-hud-pill inline-flex h-9 items-center rounded-full px-2.5 sm:h-10 sm:px-3";
const statBtn =
  "inline-flex h-7 items-center gap-1 rounded-full border border-transparent bg-transparent px-2 text-[11px] font-semibold tabular-nums text-[color:var(--map-ui-text-muted)] transition hover:border-white/20 hover:bg-white/[0.07] hover:text-[color:var(--map-ui-text)] sm:h-8 sm:text-xs";
const iconFab =
  "dash-hud-icon-btn flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[color:var(--map-ui-text)] transition-colors sm:h-10 sm:w-10";

export function MapFloatingTopBar({
  t,
  lang,
  setLang,
  playerName,
  playerTitle,
  avatarUrl,
  level,
  userEmail,
  coins = 0,
  gems = 0,
  gerLevel = 1,
  kp = 0,
  livestockTotal = 0,
  livestock,
  onTreasuryChanged,
  onOpenProfile,
  onLogout,
  onOpenLeaderboard,
  onShowIntroTour,
}: MapFloatingTopBarProps) {
  const [opened, setOpened] = useState<StatKey | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [claimedChests, setClaimedChests] = useState<Set<string>>(new Set());
  const [chestMessage, setChestMessage] = useState<string | null>(null);
  const [dismissedNotifs, setDismissedNotifs] = useState<Set<NotifId>>(
    () => new Set(),
  );
  const [gemBusy, setGemBusy] = useState(false);
  const [gemErr, setGemErr] = useState<string | null>(null);
  const safeLevel = Math.max(1, level);

  const statTargets = useMemo(() => {
    const growth = (base: number, rate: number) =>
      Math.max(base, Math.round(base * Math.pow(rate, safeLevel - 1)));
    const livestockTargets: Record<LivestockKind, number> = {
      sheep: growth(20, 1.2),
      goat: growth(16, 1.2),
      cow: growth(10, 1.18),
      horse: growth(8, 1.18),
      camel: growth(7, 1.18),
    };
    return {
      coins: growth(50, 1.24),
      kp: growth(25, 1.22),
      livestock: livestockTargets,
    };
  }, [safeLevel]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem("mapTopBarClaimedChestsV1");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as string[];
      setClaimedChests(new Set(parsed));
    } catch {
      setClaimedChests(new Set());
    }
  }, []);

  function chestKey(stat: ChestStatKey, sub?: LivestockKind) {
    return sub
      ? `${stat}:${sub}:lv${safeLevel}`
      : `${stat}:lv${safeLevel}`;
  }

  function claimLocalChest(stat: ChestStatKey, sub?: LivestockKind) {
    const key = chestKey(stat, sub);
    if (claimedChests.has(key)) return;
    const next = new Set(claimedChests);
    next.add(key);
    setClaimedChests(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        "mapTopBarClaimedChestsV1",
        JSON.stringify(Array.from(next)),
      );
    }
    const msgMn = sub
      ? "Авдар нээгдлээ! Түвшин ахихад дараагийн зорилт өснө."
      : "Авдар нээгдлээ! Дараагийн түвшинд зорилт өснө.";
    const msgEn = sub
      ? "Chest opened! Next level will require more."
      : "Chest opened! Requirements rise next level.";
    setChestMessage(lang === "mn" ? msgMn : msgEn);
  }

  const livestockRows = useMemo(
    () => [
      {
        kind: "sheep" as const,
        icon: "🐑",
        label: lang === "mn" ? "Хонь" : "Sheep",
        value: livestock?.sheep ?? 0,
      },
      {
        kind: "goat" as const,
        icon: "🐐",
        label: lang === "mn" ? "Ямаа" : "Goat",
        value: livestock?.goat ?? 0,
      },
      {
        kind: "cow" as const,
        icon: "🐄",
        label: lang === "mn" ? "Үхэр" : "Cow",
        value: livestock?.cow ?? 0,
      },
      {
        kind: "horse" as const,
        icon: "🐎",
        label: lang === "mn" ? "Адуу" : "Horse",
        value: livestock?.horse ?? 0,
      },
      {
        kind: "camel" as const,
        icon: "🐫",
        label: lang === "mn" ? "Тэмээ" : "Camel",
        value: livestock?.camel ?? 0,
      },
    ],
    [lang, livestock],
  );

  async function exchangeGems(qty: number) {
    if (!userEmail?.trim() || qty < 1) return;
    setGemBusy(true);
    setGemErr(null);
    try {
      await homeExchangeGemsForCoins({ email: userEmail.trim(), gems: qty });
      onTreasuryChanged?.();
      setOpened(null);
    } catch (e) {
      setGemErr(e instanceof Error ? e.message : "Exchange failed");
    } finally {
      setGemBusy(false);
    }
  }

  const visibleNotifs = ["welcome", "chat"].filter(
    (id) => !dismissedNotifs.has(id as NotifId),
  ) as NotifId[];

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-[85] px-2.5 pt-2 sm:px-4">
      <div className="pointer-events-auto mx-auto flex w-full max-w-[1800px] items-center justify-between gap-2">
        <div className={cn(pill, "w-fit max-w-[calc(100vw-8rem)] flex-none flex-wrap gap-1.5 sm:gap-2")}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex max-w-[min(100%,calc(100vw-5.5rem))] items-center gap-2 rounded-full border border-transparent bg-transparent px-1 py-0.5 text-[color:var(--map-ui-text)] transition hover:border-white/15 hover:bg-white/[0.06]"
              >
                <div className="h-7 w-7 overflow-hidden rounded-full border border-white/15 sm:h-8 sm:w-8">
                  <img src={avatarUrl || "/images/shikhikhutag.png"} alt="" className="h-full w-full object-cover" />
                </div>
                <span className="min-w-0 text-left">
                  <span className="block max-w-[7rem] truncate text-[11px] font-semibold sm:max-w-[10rem] sm:text-xs">{playerName}</span>
                  <span className="block max-w-[7rem] truncate text-[9px] text-[color:var(--map-gold)] sm:max-w-[10rem] sm:text-[10px]">
                    {playerTitle?.trim() ? `${playerTitle} · Lv.${level}` : `Lv. ${level}`}
                  </span>
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[220px] border-border/50 bg-background/95 backdrop-blur-xl">
              <div className="mb-1 truncate border-b border-border/40 px-2 py-1.5 text-[10px] text-muted-foreground">{userEmail}</div>
              <DropdownMenuItem className="cursor-pointer gap-2" onClick={onOpenProfile}>
                <LuUser className="size-4" />
                {t.accountMenuProfile}
              </DropdownMenuItem>
              {onShowIntroTour ? (
                <DropdownMenuItem className="cursor-pointer gap-2" onClick={onShowIntroTour}>
                  <LuCircleHelp className="size-4" />
                  {t.accountMenuTour}
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer gap-2 text-red-600" onClick={onLogout}>
                <LuLogOut className="size-4" />
                {t.accountMenuLogout}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="inline-flex flex-wrap items-center gap-0.5 rounded-full bg-transparent p-0.5 sm:gap-1">
            <Popover open={opened === "coins"} onOpenChange={(o) => setOpened(o ? "coins" : null)}>
              <PopoverTrigger asChild>
                <button type="button" className={statBtn} onClick={(e) => e.stopPropagation()}>
                  <LuCoins className="size-3.5 text-[color:var(--map-gold)]" />
                  {coins.toLocaleString()}
                </button>
              </PopoverTrigger>
              <PopoverContent className="map-ui-surface w-[14rem] border p-2.5">
                <p className="text-xs font-semibold">{t.treasuryCoinsLabel}</p>
                <div className="mt-2 rounded-lg border border-white/10 bg-white/[0.03] p-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[color:var(--map-ui-text-muted)]">
                      {lang === "mn" ? "Таны зоос" : "Your coins"}
                    </span>
                    <span className="font-semibold tabular-nums text-[color:var(--map-gold)]">
                      🪙 {coins.toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-400/80 to-yellow-300/80"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round((coins / Math.max(1, statTargets.coins)) * 100),
                        )}%`,
                      }}
                    />
                  </div>
                  <p className="mt-1 text-[10px] text-[color:var(--map-ui-text-muted)]">
                    {lang === "mn" ? "Зорилт" : "Target"}: {coins.toLocaleString()} /{" "}
                    {statTargets.coins.toLocaleString()}
                  </p>
                  {coins >= statTargets.coins ? (
                    claimedChests.has(chestKey("coins")) ? (
                      <p className="mt-1 text-[10px] text-emerald-200">
                        {lang === "mn" ? "✅ Энэ түвшний авдар нээгдсэн" : "✅ Chest opened for this level"}
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={() => claimLocalChest("coins")}
                        className="mt-1.5 w-full rounded-md border border-amber-300/35 bg-amber-500/10 px-2 py-1 text-[10px] font-semibold text-amber-100"
                      >
                        {lang === "mn" ? "🧰 Авдар нээх" : "🧰 Open chest"}
                      </button>
                    )
                  ) : null}
                </div>
                <p className="mt-2 text-xs leading-relaxed text-[color:var(--map-ui-text-muted)]">
                  {lang === "mn"
                    ? "🛒 Худалдан авалт, ⛺ гэрийн upgrade-д хэрэглэнэ."
                    : "Use for 🛒 purchases and ⛺ home upgrades."}
                </p>
              </PopoverContent>
            </Popover>

            <Popover open={opened === "gems"} onOpenChange={(o) => setOpened(o ? "gems" : null)}>
              <PopoverTrigger asChild>
                <button type="button" className={statBtn} onClick={(e) => e.stopPropagation()}>
                  💎 {gems.toLocaleString()}
                </button>
              </PopoverTrigger>
              <PopoverContent className="map-ui-surface w-[17rem] border p-2.5">
                <p className="text-xs font-semibold">{t.treasuryGemExchangeTitle}</p>
                <p className="mt-1 text-xs text-[color:var(--map-ui-text-muted)]">1 💎 = {WEALTH_COINS_PER_GEM} 🪙</p>
                {gemErr ? <p className="mt-1 text-xs text-rose-300">{gemErr}</p> : null}
                <div className="mt-2 grid grid-cols-3 gap-1.5">
                  {[1, 5, 10].map((n) => (
                    <button key={n} type="button" disabled={gemBusy || gems < n} onClick={() => void exchangeGems(n)} className="rounded-md border border-white/15 bg-white/[0.04] px-2 py-1 text-[11px] font-semibold disabled:opacity-40">
                      -{n} 💎
                    </button>
                  ))}
                </div>
                <button type="button" disabled={gemBusy || gems < 1} onClick={() => void exchangeGems(gems)} className="mt-2 w-full rounded-md border border-emerald-400/35 bg-emerald-500/10 px-2 py-1.5 text-xs font-semibold text-emerald-200 disabled:opacity-40">
                  {t.treasuryGemExchangeAll}
                </button>
              </PopoverContent>
            </Popover>

            <Popover open={opened === "kp"} onOpenChange={(o) => setOpened(o ? "kp" : null)}>
              <PopoverTrigger asChild>
                <button type="button" className={statBtn} onClick={(e) => e.stopPropagation()}>
                  <span className="text-[13px] leading-none">💠</span>
                  {lang === "mn" ? "МО" : "KP"} {kp.toLocaleString()}
                </button>
              </PopoverTrigger>
              <PopoverContent className="map-ui-surface w-[14rem] border p-2.5">
                <p className="text-xs font-semibold">{t.treasuryKpLabel}</p>
                <div className="mt-2 rounded-lg border border-white/10 bg-white/[0.03] p-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[color:var(--map-ui-text-muted)]">
                      {lang === "mn" ? "Таны KP" : "Your KP"}
                    </span>
                    <span className="font-semibold tabular-nums text-[color:var(--map-gold)]">
                      💠 {kp.toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-400/80 to-sky-300/80"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round((kp / Math.max(1, statTargets.kp)) * 100),
                        )}%`,
                      }}
                    />
                  </div>
                  <p className="mt-1 text-[10px] text-[color:var(--map-ui-text-muted)]">
                    {lang === "mn" ? "Зорилт" : "Target"}: {kp.toLocaleString()} /{" "}
                    {statTargets.kp.toLocaleString()}
                  </p>
                  {kp >= statTargets.kp ? (
                    claimedChests.has(chestKey("kp")) ? (
                      <p className="mt-1 text-[10px] text-emerald-200">
                        {lang === "mn" ? "✅ Энэ түвшний авдар нээгдсэн" : "✅ Chest opened for this level"}
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={() => claimLocalChest("kp")}
                        className="mt-1.5 w-full rounded-md border border-violet-300/35 bg-violet-500/10 px-2 py-1 text-[10px] font-semibold text-violet-100"
                      >
                        {lang === "mn" ? "🧰 Авдар нээх" : "🧰 Open chest"}
                      </button>
                    )
                  ) : null}
                </div>
                <p className="mt-2 text-xs leading-relaxed text-[color:var(--map-ui-text-muted)]">
                  {lang === "mn"
                    ? "🏁 Ахиц, rank өсөлтийн гол үзүүлэлт."
                    : "🏁 Main metric for progression and rank growth."}
                </p>
              </PopoverContent>
            </Popover>

            <Popover open={opened === "ger"} onOpenChange={(o) => setOpened(o ? "ger" : null)}>
              <PopoverTrigger asChild>
                <button type="button" className={statBtn} onClick={(e) => e.stopPropagation()}>
                  <span className="text-[13px] leading-none">🛖</span>
                  Lv.{gerLevel}
                </button>
              </PopoverTrigger>
              <PopoverContent className="map-ui-surface w-[14rem] border p-2.5">
                <p className="text-xs font-semibold">{lang === "mn" ? "Гэрийн түвшин" : "Home level"}</p>
                <div className="mt-2 rounded-lg border border-white/10 bg-white/[0.03] p-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[color:var(--map-ui-text-muted)]">
                      {lang === "mn" ? "Таны гэр" : "Your ger"}
                    </span>
                    <span className="font-semibold tabular-nums text-[color:var(--map-gold)]">
                      🛖 Lv.{gerLevel}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-400/80 to-lime-300/80"
                      style={{ width: `${Math.min(100, Math.max(10, gerLevel * 10))}%` }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[10px]">
                    <span className="text-[color:var(--map-ui-text-muted)]">
                      {lang === "mn" ? "Статус" : "Status"}
                    </span>
                    <span className="rounded-full border border-emerald-300/30 bg-emerald-400/10 px-1.5 py-0.5 text-emerald-200">
                      {gerLevel >= 10
                        ? lang === "mn"
                          ? "Сайн"
                          : "Strong"
                        : gerLevel >= 5
                          ? lang === "mn"
                            ? "Өсөлттэй"
                            : "Growing"
                          : lang === "mn"
                            ? "Эхлэл"
                            : "Starter"}
                    </span>
                  </div>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-[color:var(--map-ui-text-muted)]">
                  {lang === "mn"
                    ? "⛺ Түвшин өсөх тусам гэр ба хашааны боломж нэмэгдэнэ."
                    : "⛺ Higher level improves your ger and yard capacity."}
                </p>
              </PopoverContent>
            </Popover>

            <Popover open={opened === "livestock"} onOpenChange={(o) => setOpened(o ? "livestock" : null)}>
              <PopoverTrigger asChild>
                <button type="button" className={statBtn} onClick={(e) => e.stopPropagation()}>
                  <span className="text-[13px] leading-none">🐄</span>
                  {livestockTotal.toLocaleString()}
                </button>
              </PopoverTrigger>
              <PopoverContent className="map-ui-surface w-[17rem] border p-2.5">
                <p className="text-xs font-semibold">{lang === "mn" ? "5 хошуу мал" : "Five livestock"}</p>
                <div className="mt-2 rounded-lg border border-white/10 bg-white/[0.03] p-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[color:var(--map-ui-text-muted)]">
                      {lang === "mn" ? "Нийт мал" : "Total livestock"}
                    </span>
                    <span className="font-semibold tabular-nums text-[color:var(--map-gold)]">
                      🐾 {livestockTotal.toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-300/80 via-emerald-300/80 to-sky-300/80"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round(
                            (livestockTotal /
                              Math.max(
                                1,
                                Object.values(statTargets.livestock).reduce(
                                  (sum, v) => sum + v,
                                  0,
                                ),
                              )) *
                              100,
                          ),
                        )}%`,
                      }}
                    />
                  </div>
                  <p className="mt-2 text-[10px] text-[color:var(--map-ui-text-muted)]">
                    {lang === "mn"
                      ? "Хамгийн ихтэй: " +
                        (livestockRows.reduce((a, b) => (b.value > a.value ? b : a)).icon +
                          " " +
                          livestockRows.reduce((a, b) => (b.value > a.value ? b : a)).label)
                      : "Top: " +
                        (livestockRows.reduce((a, b) => (b.value > a.value ? b : a)).icon +
                          " " +
                          livestockRows.reduce((a, b) => (b.value > a.value ? b : a)).label)}
                  </p>
                </div>
                <div className="mt-2 space-y-1.5">
                  {livestockRows.map((row) => {
                    const target = statTargets.livestock[row.kind];
                    const pct = Math.min(
                      100,
                      Math.round((row.value / Math.max(1, target)) * 100),
                    );
                    const chestId = chestKey("livestock", row.kind);
                    return (
                      <div key={row.label} className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span>{row.icon} {row.label}</span>
                          <span className="font-semibold tabular-nums text-[color:var(--map-gold)]">
                            {row.value.toLocaleString()} / {target.toLocaleString()} · {pct}%
                          </span>
                        </div>
                        <div className="mt-1 h-1 rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full bg-emerald-300/70"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        {pct >= 100 ? (
                          claimedChests.has(chestId) ? (
                            <p className="mt-1 text-[10px] text-emerald-200">
                              {lang === "mn" ? "✅ Авдар нээгдсэн" : "✅ Chest opened"}
                            </p>
                          ) : (
                            <button
                              type="button"
                              onClick={() => claimLocalChest("livestock", row.kind)}
                              className="mt-1 w-full rounded-md border border-emerald-300/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-100"
                            >
                              {lang === "mn" ? "🧰 Авдар нээх" : "🧰 Open chest"}
                            </button>
                          )
                        ) : null}
                      </div>
                    );
                  })}
                </div>
                {chestMessage ? (
                  <p className="mt-2 text-[10px] text-[color:var(--map-gold)]">
                    {chestMessage}
                  </p>
                ) : null}
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
          {onOpenLeaderboard ? (
            <button type="button" onClick={onOpenLeaderboard} className={iconFab} aria-label={t.leaderboard}>
              <LuTrophy className="size-[1.05rem] sm:size-[1.15rem]" />
            </button>
          ) : null}

          <Popover open={notifOpen} onOpenChange={setNotifOpen}>
            <PopoverTrigger asChild>
              <button type="button" className={cn(iconFab, "relative")} aria-label={t.mapNotificationsTitle}>
                <LuBell className="size-[1.05rem] sm:size-[1.15rem]" />
                {visibleNotifs.length > 0 ? <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-amber-400" /> : null}
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" side="bottom" sideOffset={8} className="map-ui-surface z-[200] w-[min(calc(100vw-1.5rem),20rem)] border p-0 shadow-2xl">
              <div className="flex items-center justify-between gap-2 border-b border-[color:var(--map-ui-border)] px-3 py-2">
                <p className="text-xs font-semibold">{t.mapNotificationsTitle}</p>
                {visibleNotifs.length > 0 ? (
                  <button type="button" onClick={() => setDismissedNotifs(new Set(["welcome", "chat"]))} className="text-[10px] font-semibold text-[color:var(--map-gold)]">
                    {t.mapNotificationsClearRead}
                  </button>
                ) : null}
              </div>
              <div className="max-h-[min(50dvh,320px)] overflow-y-auto p-2">
                {visibleNotifs.length === 0 ? (
                  <p className="px-1 py-4 text-center text-xs text-[color:var(--map-ui-text-muted)]">{t.mapNotificationsEmpty}</p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {visibleNotifs.map((id) => {
                      const title = id === "welcome" ? t.mapNotifWelcomeTitle : t.mapNotifChatTitle;
                      const body = id === "welcome" ? t.mapNotifWelcomeBody : t.mapNotifChatBody;
                      return (
                        <li key={id} className="rounded-xl border border-[color:var(--map-ui-border-subtle)] bg-[color-mix(in_srgb,var(--map-ui-base)_35%,transparent)] p-2.5 pr-2">
                          <div className="flex gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="text-[11px] font-semibold leading-snug">{title}</p>
                              <p className="mt-1 text-[11px] leading-relaxed text-[color:var(--map-ui-text-muted)]">{body}</p>
                            </div>
                            <button type="button" onClick={() => setDismissedNotifs((prev) => new Set([...prev, id]))} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[color:var(--map-ui-text-muted)] hover:bg-white/10" aria-label={t.dialogClose}>
                              <LuX className="size-4" />
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </PopoverContent>
          </Popover>

          <div className="dash-hud-pill flex h-9 items-stretch overflow-hidden rounded-full p-0.5 sm:h-10" role="group" aria-label={lang === "mn" ? "Хэл солих" : "Language"}>
            {(["mn", "en"] as const).map((lng) => (
              <button
                key={lng}
                type="button"
                onClick={() => setLang(lng)}
                aria-pressed={lang === lng}
                className={cn(
                  "flex min-w-[2.55rem] flex-1 items-center justify-center rounded-full px-2 text-[10px] font-bold uppercase tracking-[0.14em] transition-colors sm:min-w-[2.85rem] sm:px-2.5 sm:text-[11px]",
                  lang === lng
                    ? "bg-gradient-to-b from-[#b8923a] via-[#edd98a] to-[#9a7420] text-[#14120c]"
                    : "text-[color:var(--map-ui-text-muted)] hover:bg-white/[0.07] hover:text-[color:var(--map-ui-text)]",
                )}
              >
                {lng === "mn" ? "МН" : "EN"}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
