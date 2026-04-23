"use client";

import { useEffect, useMemo, useState } from "react";
import { LuTrophy as Trophy, LuMedal as Medal } from "react-icons/lu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getApiBaseUrl,
  getContentHeroes,
  getLeaderboard,
  resolveAssetUrl,
  type LeaderboardEntry,
} from "@/lib/api";
import { HEROES } from "@/components/hero-select/hero-data";
import { parseHeroId } from "@/components/hero-select/hero-strings";
import type { DashLang } from "./dashboard-strings";
import { cn } from "@/lib/utils";

type LeaderboardModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lang: DashLang;
  /** Одоогийн тоглогчийг жагсаалтад тодорхойлж, байрлалыг онцлон харуулна */
  viewerEmail?: string;
};

function isPlainRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function breakdownFrom(entry: LeaderboardEntry): {
  kp: number | null;
  gerLevel: number | null;
  sheep: number | null;
  goat: number | null;
  cow: number | null;
  horse: number | null;
  camel: number | null;
} {
  const kp = typeof entry.meta?.kp === "number" ? entry.meta.kp : null;
  const gerLevel =
    isPlainRecord(entry.meta?.ger) && typeof entry.meta?.ger?.level === "number"
      ? (entry.meta.ger.level as number)
      : null;
  const ls = entry.meta?.livestock;
  const sheep =
    isPlainRecord(ls) && typeof ls.sheep === "number"
      ? (ls.sheep as number)
      : null;
  const goat =
    isPlainRecord(ls) && typeof (ls as any).goat === "number"
      ? ((ls as any).goat as number)
      : null;
  const cow =
    isPlainRecord(ls) && typeof (ls as any).cow === "number"
      ? ((ls as any).cow as number)
      : null;
  const horse =
    isPlainRecord(ls) && typeof ls.horse === "number"
      ? (ls.horse as number)
      : null;
  const camel =
    isPlainRecord(ls) && typeof ls.camel === "number"
      ? (ls.camel as number)
      : null;
  return { kp, gerLevel, sheep, goat, cow, horse, camel };
}

function livestockTotal(b: ReturnType<typeof breakdownFrom>): number | null {
  const nums = [b.sheep, b.goat, b.cow, b.horse, b.camel].filter(
    (n): n is number => typeof n === "number",
  );
  if (nums.length === 0) return null;
  return nums.reduce((a, c) => a + c, 0);
}

function entryMetaSummary(
  b: ReturnType<typeof breakdownFrom>,
  lang: DashLang,
): string {
  const mal = livestockTotal(b);
  const metaParts: string[] = [];
  if (b.gerLevel != null) {
    metaParts.push(lang === "mn" ? `Гэр ${b.gerLevel}` : `Ger ${b.gerLevel}`);
  }
  if (b.kp != null) {
    metaParts.push(
      lang === "mn"
        ? `${b.kp.toLocaleString()} КП`
        : `${b.kp.toLocaleString()} KP`,
    );
  }
  if (mal != null && mal > 0) {
    metaParts.push(
      lang === "mn"
        ? `${mal.toLocaleString()} мал`
        : `${mal.toLocaleString()} livestock`,
    );
  }
  return metaParts.join(" · ");
}

function heroDisplayName(heroId: string | null): string {
  if (!heroId) return "—";
  try {
    const id = parseHeroId(heroId);
    return HEROES.find((h) => h.id === id)?.name ?? heroId;
  } catch {
    return heroId;
  }
}

// Kept around as a thin alias so call sites don't change; dispatches to the
// shared helper that knows to only prefix `/uploads/**` with the API base.
function resolveImg(_apiBase: string, raw: unknown): string {
  return resolveAssetUrl(raw);
}

function PodiumCard({
  entry,
  place,
  lang,
  heroImg,
  isYou,
}: {
  entry: LeaderboardEntry | undefined;
  place: 1 | 2 | 3;
  lang: DashLang;
  heroImg?: string;
  isYou?: boolean;
}) {
  const ring =
    place === 1
      ? "border-amber-400/70 shadow-[0_0_40px_-6px_rgba(251,191,36,0.5)]"
      : place === 2
        ? "border-slate-300/50 shadow-[0_0_28px_-8px_rgba(148,163,184,0.4)]"
        : "border-amber-700/50 shadow-[0_0_24px_-8px_rgba(180,83,9,0.4)]";

  const scale =
    place === 1
      ? "sm:scale-[1.02] z-10 min-h-[200px] sm:min-h-[220px]"
      : "opacity-[0.97] min-h-[188px] sm:min-h-[208px]";

  const label = place === 1 ? "🥇" : place === 2 ? "🥈" : "🥉";
  const avatarSize =
    place === 1
      ? "size-14 sm:size-16"
      : "size-12 sm:size-14";

  if (!entry) {
    return (
      <div
        className={cn(
          "flex-1 min-w-0 max-w-[min(100%,240px)] mx-auto rounded-2xl border border-dashed border-primary/25 bg-muted/15 px-3 py-5 text-center flex flex-col justify-center",
          scale,
        )}
      >
        <p className="text-3xl mb-2">{label}</p>
        <p className="text-sm text-muted-foreground">
          {lang === "mn" ? "Хоосон" : "Empty"}
        </p>
      </div>
    );
  }

  const b = breakdownFrom(entry);
  const metaLine = entryMetaSummary(b, lang);

  return (
    <div
      className={cn(
        "relative flex-1 min-w-0 max-w-[min(100%,240px)] mx-auto rounded-2xl border-2 bg-gradient-to-b from-card via-card/95 to-background/80 px-3 py-4 sm:px-4 sm:py-5 flex flex-col items-center text-center gap-2 sm:gap-2.5",
        ring,
        scale,
        isYou && "ring-2 ring-sky-500/80 ring-offset-2 ring-offset-background",
      )}
    >
      {isYou ? (
        <span className="absolute right-2 top-2 rounded-full bg-sky-600/95 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white shadow-sm sm:text-[10px]">
          {lang === "mn" ? "Та" : "You"}
        </span>
      ) : null}
      <span className="text-2xl sm:text-3xl leading-none drop-shadow-sm">
        {label}
      </span>
      <div
        className={cn(
          "rounded-full overflow-hidden bg-muted/30 ring-2 ring-primary/20",
          avatarSize,
          place === 1
            ? "shadow-[0_0_22px_rgba(212,175,55,0.45)]"
            : "shadow-[0_0_16px_rgba(212,175,55,0.25)]",
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={heroImg || "/images/shikhikhutag.png"}
          alt=""
          className="w-full h-full object-cover"
        />
      </div>
      <div className="w-full space-y-0.5 min-h-0">
        <p className="font-display text-sm sm:text-base font-semibold leading-tight line-clamp-2 px-0.5">
          {entry.name}
        </p>
        <p className="text-[11px] sm:text-xs text-muted-foreground line-clamp-1">
          {heroDisplayName(entry.hero_id)}
        </p>
        {metaLine ? (
          <p className="text-[10px] sm:text-[11px] text-muted-foreground/90 leading-snug line-clamp-2 px-0.5">
            {metaLine}
          </p>
        ) : null}
      </div>
      <p className="text-lg sm:text-xl font-bold tabular-nums text-primary mt-auto pt-0.5">
        {entry.xp.toLocaleString()}
        <span className="block text-[10px] sm:text-[11px] font-normal text-muted-foreground mt-0.5 tracking-wide">
          {lang === "mn" ? "нийт үнэлгээ" : "total score"}
        </span>
      </p>
    </div>
  );
}

function entryMatchesViewer(entry: LeaderboardEntry, viewerKey: string) {
  return entry.name.trim().toLowerCase() === viewerKey;
}

function YourRankRow({
  me,
  lang,
  imgFor,
  meta,
}: {
  me: LeaderboardEntry;
  lang: DashLang;
  imgFor: (heroId: string | null) => string;
  meta: string;
}) {
  return (
    <div className="grid grid-cols-[2.75rem_2.75rem_1fr_auto] sm:grid-cols-[3rem_3rem_1fr_auto] gap-3 sm:gap-4 items-center">
      <span className="flex size-9 sm:size-10 items-center justify-center rounded-xl border-2 border-sky-500/50 bg-sky-500/15 tabular-nums text-xs sm:text-sm font-bold text-sky-900 dark:text-sky-100">
        {me.rank}
      </span>
      <div className="size-11 sm:size-12 rounded-full overflow-hidden bg-muted/30 ring-2 ring-sky-500/30 shrink-0 shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgFor(me.hero_id) || "/images/shikhikhutag.png"}
          alt=""
          className="h-full w-full object-cover"
        />
      </div>
      <div className="min-w-0">
        <p className="font-semibold text-sm sm:text-base leading-snug truncate">
          {me.name}
        </p>
        <p className="text-xs text-muted-foreground truncate mt-0.5">
          {heroDisplayName(me.hero_id)}
        </p>
        {meta ? (
          <p className="text-[11px] sm:text-xs text-muted-foreground/85 mt-1">
            {meta}
          </p>
        ) : null}
      </div>
      <div className="text-right shrink-0 min-w-[4.5rem] sm:min-w-[5.5rem]">
        <span className="tabular-nums font-bold text-primary text-base sm:text-lg block leading-none">
          {me.xp.toLocaleString()}
        </span>
        <span className="text-[10px] text-muted-foreground mt-1 sm:text-[11px]">
          {lang === "mn" ? "нийт үнэлгээ" : "total score"}
        </span>
      </div>
    </div>
  );
}

export function LeaderboardModal({
  open,
  onOpenChange,
  lang,
  viewerEmail,
}: LeaderboardModalProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [heroImgs, setHeroImgs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setErr(null);
    const apiBase = getApiBaseUrl();
    void Promise.all([
      getLeaderboard(viewerEmail?.trim()),
      getContentHeroes(),
    ])
      .then(([lb, heroes]) => {
        if (cancelled) return;
        setEntries(lb.entries);
        const map: Record<string, string> = {};
        for (const h of heroes.heroes ?? []) {
          // Map by both slug and any id-style string to be safe.
          map[String((h as any).slug)] = resolveImg(
            apiBase,
            (h as any).image_url,
          );
          map[String((h as any).id)] = resolveImg(
            apiBase,
            (h as any).image_url,
          );
        }
        setHeroImgs(map);
      })
      .catch((e: unknown) => {
        if (!cancelled) setErr(e instanceof Error ? e.message : "Алдаа");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, viewerEmail]);

  const title = lang === "mn" ? "Онооны жагсаалт" : "Knowledge points ranking";
  const subtitle =
    lang === "mn"
      ? "Нийт бүртгэлтэй тоглогчдын жагсаалт"
      : "Ranked players in the game";

  const viewerKey = viewerEmail?.trim().toLowerCase() ?? "";
  const me = useMemo(() => {
    const byYou = entries.find((e) => e.is_you);
    if (byYou) return byYou;
    if (!viewerKey) return undefined;
    return entries.find((e) => entryMatchesViewer(e, viewerKey));
  }, [entries, viewerKey]);

  const top3 = entries.slice(0, 3);
  const second = top3[1];
  const first = top3[0];
  const third = top3[2];
  /** 4–8 байр: эхний 3-ын дараах 5 мөр */
  const places4to8 = entries.slice(3, 8);
  const showYouBelow = me != null && me.rank > 8;
  const imgFor = (heroId: string | null) => {
    if (!heroId) return "";
    const direct = heroImgs[heroId];
    if (direct) return direct;
    try {
      const parsed = parseHeroId(heroId);
      return heroImgs[String(parsed)] ?? "";
    } catch {
      return "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "w-[min(100vw-1.25rem,56rem)] max-w-none sm:max-w-5xl lg:max-w-6xl",
          "max-h-[min(92vh,760px)] overflow-hidden flex flex-col p-0 gap-0",
          "border border-primary/30 bg-card/95 backdrop-blur-xl",
          "shadow-[0_24px_80px_-24px_color-mix(in_oklch,var(--primary)_35%,#0a0c18)]",
          "ring-1 ring-primary/10",
        )}
      >
        <DialogHeader className="px-6 sm:px-8 pt-6 pb-4 shrink-0 border-b border-primary/20 bg-gradient-to-br from-primary/[0.12] via-transparent to-[color-mix(in_oklch,oklch(35%_0.08_155)_12%,transparent)]">
          <DialogTitle className="font-display flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 text-xl sm:text-2xl w-full text-center">
            <span className="flex flex-col items-center gap-1 min-w-0 max-w-xl">
              <span className="leading-tight">{title}</span>
              <span className="text-xs sm:text-sm font-normal text-muted-foreground font-sans tracking-normal">
                {subtitle}
              </span>
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-5 sm:py-6 space-y-6 sm:space-y-8 min-h-0 [scrollbar-gutter:stable]">
          {err && (
            <p className="text-sm text-destructive text-center py-4">{err}</p>
          )}
          {loading && !err && (
            <div
              className="py-8 space-y-4 max-w-3xl mx-auto"
              aria-busy
              aria-label={lang === "mn" ? "Ачаалж байна" : "Loading"}
            >
              <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className={cn(
                      "rounded-2xl border border-primary/10 bg-muted/20 animate-pulse",
                      i === 1 ? "h-40 sm:h-44" : "h-36 sm:h-40",
                    )}
                  />
                ))}
              </div>
              <div className="space-y-2">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-14 rounded-xl border border-primary/10 bg-muted/15 animate-pulse"
                  />
                ))}
              </div>
            </div>
          )}
          {!loading && !err && entries.length === 0 && (
            <p className="text-sm text-muted-foreground py-10 text-center">
              {lang === "mn" ? "Одоогоор мэдээлэл байхгүй." : "No entries yet."}
            </p>
          )}
          {!loading && !err && entries.length > 0 && (
            <>
              <div className="relative w-full max-w-5xl mx-auto">
                <div
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-24 sm:h-28 rounded-[2rem] bg-gradient-to-t from-primary/[0.07] to-transparent"
                  aria-hidden
                />
                <div className="relative grid grid-cols-3 gap-2 sm:gap-4 lg:gap-6 items-end px-0 sm:px-2">
                  <PodiumCard
                    entry={second}
                    place={2}
                    lang={lang}
                    heroImg={imgFor(second?.hero_id ?? null)}
                    isYou={!!second?.is_you}
                  />
                  <PodiumCard
                    entry={first}
                    place={1}
                    lang={lang}
                    heroImg={imgFor(first?.hero_id ?? null)}
                    isYou={!!first?.is_you}
                  />
                  <PodiumCard
                    entry={third}
                    place={3}
                    lang={lang}
                    heroImg={imgFor(third?.hero_id ?? null)}
                    isYou={!!third?.is_you}
                  />
                </div>
              </div>

              {places4to8.length > 0 && (
                <div className="space-y-3 max-w-4xl mx-auto w-full">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground flex items-center gap-2 font-medium">
                    <Medal className="size-4 opacity-80 shrink-0" />
                    {lang === "mn" ? "4–8 байр" : "Ranks 4–8"}
                  </p>
                  <ul className="space-y-2">
                    {places4to8.map((e) => {
                      const b = breakdownFrom(e);
                      const meta = entryMetaSummary(b, lang);
                      const isYou = !!e.is_you;
                      return (
                        <li key={`${e.rank}-${e.name}`}>
                          <div
                            className={cn(
                              "group grid grid-cols-[2.75rem_2.75rem_1fr_auto] sm:grid-cols-[3rem_3rem_1fr_auto] gap-3 sm:gap-4 items-center rounded-2xl border bg-gradient-to-r from-primary/[0.05] to-transparent px-3 py-3 sm:px-4 sm:py-3.5 text-sm transition-all duration-200",
                              isYou
                                ? "border-2 border-sky-500/70 from-sky-500/10 shadow-[0_0_0_1px_color-mix(in_oklch,var(--primary)_20%,transparent)]"
                                : "border-primary/12 hover:border-primary/25 hover:from-primary/[0.09]",
                            )}
                          >
                            <span
                              className={cn(
                                "flex size-9 sm:size-10 items-center justify-center rounded-xl border tabular-nums text-xs sm:text-sm font-semibold shrink-0",
                                isYou
                                  ? "border-sky-500/50 bg-sky-500/15 text-sky-900 dark:text-sky-100"
                                  : "bg-background/80 border-primary/15 text-muted-foreground group-hover:text-foreground",
                              )}
                            >
                              {e.rank}
                            </span>
                            <div className="size-11 sm:size-12 rounded-full overflow-hidden bg-muted/30 ring-2 ring-primary/15 shrink-0 shadow-sm">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={
                                  imgFor(e.hero_id) ||
                                  "/images/shikhikhutag.png"
                                }
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-sm sm:text-base leading-snug truncate flex items-center gap-2">
                                <span className="truncate">{e.name}</span>
                                {isYou ? (
                                  <span className="shrink-0 rounded bg-sky-600 px-1.5 py-0 text-[9px] font-bold uppercase text-white sm:text-[10px]">
                                    {lang === "mn" ? "Та" : "You"}
                                  </span>
                                ) : null}
                              </p>
                              <p className="text-xs text-muted-foreground truncate mt-0.5">
                                {heroDisplayName(e.hero_id)}
                              </p>
                              {meta ? (
                                <p className="text-[11px] sm:text-xs text-muted-foreground/85 truncate mt-1">
                                  {meta}
                                </p>
                              ) : null}
                            </div>
                            <div className="text-right shrink-0 min-w-[4.5rem] sm:min-w-[5.5rem]">
                              <span className="tabular-nums font-bold text-primary text-base sm:text-lg block leading-none">
                                {e.xp.toLocaleString()}
                              </span>
                              <span className="text-[10px] text-muted-foreground mt-1 hidden sm:block">
                                {lang === "mn" ? "үнэлгээ" : "score"}
                              </span>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {showYouBelow && me ? (
                <div className="max-w-4xl mx-auto w-full space-y-3">
                  <p className="text-center text-xs text-muted-foreground">
                    ···
                  </p>
                  <div className="rounded-2xl border-2 border-sky-500/60 bg-gradient-to-br from-sky-500/12 via-background to-background p-4 shadow-md sm:p-5">
                    <p className="mb-3 text-center font-display text-sm font-semibold uppercase tracking-wide text-sky-700 dark:text-sky-300">
                      {lang === "mn" ? "Таны байрлал" : "Your rank"}
                    </p>
                    <YourRankRow
                      me={me}
                      lang={lang}
                      imgFor={imgFor}
                      meta={entryMetaSummary(breakdownFrom(me), lang)}
                    />
                    <p className="mt-3 text-center text-[11px] leading-snug text-muted-foreground sm:text-xs">
                      {lang === "mn"
                        ? `Жагсаалтын эхний 8-д багтаагүй ч таны амжилт энд харагдана.`
                        : `You’re below the top 8 on this list — your stats are shown here.`}
                    </p>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
        <div
          className="shrink-0 h-2.5 w-full opacity-[0.22] border-t border-primary/10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='24' viewBox='0 0 80 24'%3E%3Cg stroke='%237cb342' stroke-width='1' fill='none' opacity='0.9'%3E%3Cpath d='M4 22 Q6 10 4 4'/%3E%3Cpath d='M14 22 Q16 8 14 2'/%3E%3Cpath d='M24 22 Q22 12 24 6'/%3E%3Cpath d='M34 22 Q36 10 34 4'/%3E%3Cpath d='M44 22 Q42 14 44 8'/%3E%3Cpath d='M54 22 Q56 8 54 2'/%3E%3Cpath d='M64 22 Q62 12 64 6'/%3E%3Cpath d='M74 22 Q76 10 74 4'/%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: "80px 24px",
            backgroundRepeat: "repeat-x",
          }}
          aria-hidden
        />
      </DialogContent>
    </Dialog>
  );
}
