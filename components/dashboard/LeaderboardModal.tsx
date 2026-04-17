"use client";

import { useEffect, useState } from "react";
import { LuTrophy as Trophy, LuMedal as Medal } from "react-icons/lu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getApiBaseUrl, getContentHeroes, getLeaderboard, type LeaderboardEntry } from "@/lib/api";
import { HEROES } from "@/components/hero-select/hero-data";
import { parseHeroId } from "@/components/hero-select/hero-strings";
import type { DashLang } from "./dashboard-strings";
import { cn } from "@/lib/utils";

type LeaderboardModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lang: DashLang;
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
    isPlainRecord(ls) && typeof ls.sheep === "number" ? (ls.sheep as number) : null;
  const goat =
    isPlainRecord(ls) && typeof (ls as any).goat === "number" ? ((ls as any).goat as number) : null;
  const cow =
    isPlainRecord(ls) && typeof (ls as any).cow === "number" ? ((ls as any).cow as number) : null;
  const horse =
    isPlainRecord(ls) && typeof ls.horse === "number" ? (ls.horse as number) : null;
  const camel =
    isPlainRecord(ls) && typeof ls.camel === "number" ? (ls.camel as number) : null;
  return { kp, gerLevel, sheep, goat, cow, horse, camel };
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

function resolveImg(apiBase: string, raw: unknown): string {
  const s = typeof raw === "string" ? raw.trim() : "";
  if (!s) return "";
  return s.startsWith("/") ? `${apiBase}${s}` : s;
}

function PodiumCard({
  entry,
  place,
  lang,
  heroImg,
}: {
  entry: LeaderboardEntry | undefined;
  place: 1 | 2 | 3;
  lang: DashLang;
  heroImg?: string;
}) {
  const ring =
    place === 1
      ? "border-amber-400/70 shadow-[0_0_32px_-4px_rgba(251,191,36,0.45)]"
      : place === 2
        ? "border-slate-300/50 shadow-[0_0_24px_-6px_rgba(148,163,184,0.35)]"
        : "border-amber-700/50 shadow-[0_0_20px_-6px_rgba(180,83,9,0.35)]";

  const scale = place === 1 ? "sm:scale-105 z-10" : "opacity-95";

  const label =
    place === 1 ? "🥇" : place === 2 ? "🥈" : "🥉";

  if (!entry) {
    return (
      <div
        className={cn(
          "flex-1 min-w-0 rounded-2xl border border-dashed border-primary/20 bg-muted/20 p-4 text-center",
          scale
        )}
      >
        <p className="text-2xl mb-1">{label}</p>
        <p className="text-xs text-muted-foreground">
          {lang === "mn" ? "Хоосон" : "Empty"}
        </p>
      </div>
    );
  }

  const b = breakdownFrom(entry);

  return (
    <div
      className={cn(
        "flex-1 min-w-0 rounded-2xl border-2 bg-gradient-to-b from-card to-background/90 p-4 flex flex-col items-center text-center gap-2",
        ring,
        scale
      )}
    >
      <span className="text-2xl leading-none">{label}</span>
      <div
        className={cn(
          "size-14 rounded-full overflow-hidden bg-muted/30 ring-1 ring-primary/20",
          place === 1 ? "shadow-[0_0_18px_rgba(212,175,55,0.35)]" : "shadow-[0_0_14px_rgba(212,175,55,0.22)]"
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={heroImg || "/images/shikhikhutag.png"}
          alt=""
          className="w-full h-full object-cover"
        />
      </div>
      <p className="font-display text-sm font-semibold truncate w-full px-1">
        {entry.name}
      </p>
      <p className="text-[10px] text-muted-foreground truncate w-full">
        {heroDisplayName(entry.hero_id)}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        {b.gerLevel != null ? (
          <span className="text-[10px] px-2 py-0.5 rounded-full border border-primary/15 bg-primary/5 text-muted-foreground">
            {lang === "mn" ? `Гэр Lv ${b.gerLevel}` : `Ger Lv ${b.gerLevel}`}
          </span>
        ) : null}
        {b.sheep != null ? (
          <span className="text-[10px] px-2 py-0.5 rounded-full border border-primary/15 bg-primary/5 text-muted-foreground">
            🐑 {b.sheep}
          </span>
        ) : null}
        {b.goat != null ? (
          <span className="text-[10px] px-2 py-0.5 rounded-full border border-primary/15 bg-primary/5 text-muted-foreground">
            🐐 {b.goat}
          </span>
        ) : null}
        {b.cow != null ? (
          <span className="text-[10px] px-2 py-0.5 rounded-full border border-primary/15 bg-primary/5 text-muted-foreground">
            🐄 {b.cow}
          </span>
        ) : null}
        {b.horse != null ? (
          <span className="text-[10px] px-2 py-0.5 rounded-full border border-primary/15 bg-primary/5 text-muted-foreground">
            🐎 {b.horse}
          </span>
        ) : null}
        {b.camel != null ? (
          <span className="text-[10px] px-2 py-0.5 rounded-full border border-primary/15 bg-primary/5 text-muted-foreground">
            🐫 {b.camel}
          </span>
        ) : null}
      </div>
      <p className="text-lg font-bold tabular-nums text-primary mt-auto">
        {entry.xp.toLocaleString()}
        <span className="text-[10px] font-normal text-muted-foreground ml-1">
          {lang === "mn" ? "үнэлгээ" : "score"}
        </span>
      </p>
    </div>
  );
}

export function LeaderboardModal({
  open,
  onOpenChange,
  lang,
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
    void Promise.all([getLeaderboard(), getContentHeroes()])
      .then(([lb, heroes]) => {
        if (cancelled) return;
        setEntries(lb.entries);
        const map: Record<string, string> = {};
        for (const h of heroes.heroes ?? []) {
          // Map by both slug and any id-style string to be safe.
          map[String((h as any).slug)] = resolveImg(apiBase, (h as any).image_url);
          map[String((h as any).id)] = resolveImg(apiBase, (h as any).image_url);
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
  }, [open]);

  const title =
    lang === "mn" ? "Мэдлэгийн онооны жагсаалт" : "Knowledge points ranking";
  const subtitle =
    lang === "mn"
      ? "Системд бүртгэлтэй тоглогчдын эрэмбэ"
      : "Ranked players in the game";

  const top3 = entries.slice(0, 3);
  const second = top3[1];
  const first = top3[0];
  const third = top3[2];
  const rest = entries.slice(3);
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
          "w-[min(100vw-1.5rem,440px)] sm:max-w-lg md:max-w-xl",
          "max-h-[min(88vh,640px)] overflow-hidden flex flex-col p-0 gap-0",
          "border border-primary/30 bg-card/95 backdrop-blur-xl",
          "shadow-[0_24px_80px_-24px_color-mix(in_oklch,var(--primary)_35%,#0a0c18)]",
          "ring-1 ring-primary/10"
        )}
      >
        <DialogHeader className="px-5 pt-5 pb-3 shrink-0 border-b border-primary/20 bg-gradient-to-br from-primary/[0.12] via-transparent to-[color-mix(in_oklch,oklch(35%_0.08_155)_12%,transparent)]">
          <DialogTitle className="font-display flex items-center gap-2.5 text-lg md:text-xl">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary/15 border border-primary/30">
              <Trophy className="size-5 text-primary" strokeWidth={1.5} />
            </span>
            <span className="flex flex-col gap-0.5 text-left">
              <span>{title}</span>
              <span className="text-[11px] font-normal text-muted-foreground font-sans tracking-normal">
                {subtitle}
              </span>
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 min-h-0">
          {err && (
            <p className="text-sm text-destructive text-center py-4">{err}</p>
          )}
          {loading && !err && (
            <p className="text-sm text-muted-foreground py-12 text-center">
              {lang === "mn" ? "Ачаалж байна…" : "Loading…"}
            </p>
          )}
          {!loading && !err && entries.length === 0 && (
            <p className="text-sm text-muted-foreground py-10 text-center">
              {lang === "mn" ? "Одоогоор мэдээлэл байхгүй." : "No entries yet."}
            </p>
          )}
          {!loading && !err && entries.length > 0 && (
            <>
              <div className="flex flex-row items-end justify-center gap-2 sm:gap-3 px-1">
                <PodiumCard entry={second} place={2} lang={lang} heroImg={imgFor(second?.hero_id ?? null)} />
                <PodiumCard entry={first} place={1} lang={lang} heroImg={imgFor(first?.hero_id ?? null)} />
                <PodiumCard entry={third} place={3} lang={lang} heroImg={imgFor(third?.hero_id ?? null)} />
              </div>

              {rest.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                    <Medal className="size-3.5 opacity-70" />
                    {lang === "mn" ? "Бусад тоглогчид" : "Other players"}
                  </p>
                  <ul className="space-y-1.5 pr-1">
                    {rest.map((e) => (
                      (() => {
                        const b = breakdownFrom(e);
                        return (
                          <li
                            key={`${e.rank}-${e.name}`}
                            className="flex items-center gap-3 rounded-xl border border-primary/10 bg-primary/[0.04] px-3 py-2.5 text-sm hover:bg-primary/[0.08] transition-colors"
                          >
                            <span className="tabular-nums font-mono text-xs text-muted-foreground w-7 shrink-0">
                              {e.rank}
                            </span>
                            <div className="size-10 rounded-full overflow-hidden bg-muted/30 ring-1 ring-primary/15 shrink-0">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={imgFor(e.hero_id) || "/images/shikhikhutag.png"}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium truncate">{e.name}</p>
                              <p className="text-[10px] text-muted-foreground truncate">
                                {heroDisplayName(e.hero_id)}
                              </p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {b.gerLevel != null ? (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full border border-primary/15 bg-primary/5 text-muted-foreground">
                                    {lang === "mn"
                                      ? `Гэр Lv ${b.gerLevel}`
                                      : `Ger Lv ${b.gerLevel}`}
                                  </span>
                                ) : null}
                                {b.sheep != null ? (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full border border-primary/15 bg-primary/5 text-muted-foreground">
                                    🐑 {b.sheep}
                                  </span>
                                ) : null}
                                {b.goat != null ? (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full border border-primary/15 bg-primary/5 text-muted-foreground">
                                    🐐 {b.goat}
                                  </span>
                                ) : null}
                                {b.cow != null ? (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full border border-primary/15 bg-primary/5 text-muted-foreground">
                                    🐄 {b.cow}
                                  </span>
                                ) : null}
                                {b.horse != null ? (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full border border-primary/15 bg-primary/5 text-muted-foreground">
                                    🐎 {b.horse}
                                  </span>
                                ) : null}
                                {b.camel != null ? (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full border border-primary/15 bg-primary/5 text-muted-foreground">
                                    🐫 {b.camel}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                            <span className="tabular-nums font-semibold text-primary shrink-0 text-sm">
                              {e.xp.toLocaleString()}
                            </span>
                          </li>
                        );
                      })()
                    ))}
                  </ul>
                </div>
              )}
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
