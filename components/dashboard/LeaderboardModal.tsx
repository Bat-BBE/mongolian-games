"use client";

import { useEffect, useState } from "react";
import { LuTrophy as Trophy, LuMedal as Medal } from "react-icons/lu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getLeaderboard, type LeaderboardEntry } from "@/lib/api";
import { HEROES } from "@/components/hero-select/hero-data";
import { parseHeroId } from "@/components/hero-select/hero-strings";
import type { DashLang } from "./dashboard-strings";
import { cn } from "@/lib/utils";

type LeaderboardModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lang: DashLang;
};

function heroDisplayName(heroId: string | null): string {
  if (!heroId) return "—";
  try {
    const id = parseHeroId(heroId);
    return HEROES.find((h) => h.id === id)?.name ?? heroId;
  } catch {
    return heroId;
  }
}

function PodiumCard({
  entry,
  place,
  lang,
}: {
  entry: LeaderboardEntry | undefined;
  place: 1 | 2 | 3;
  lang: DashLang;
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

  return (
    <div
      className={cn(
        "flex-1 min-w-0 rounded-2xl border-2 bg-gradient-to-b from-card to-background/90 p-4 flex flex-col items-center text-center gap-2",
        ring,
        scale
      )}
    >
      <span className="text-2xl leading-none">{label}</span>
      <p className="font-display text-sm font-semibold truncate w-full px-1">
        {entry.name}
      </p>
      <p className="text-[10px] text-muted-foreground truncate w-full">
        {heroDisplayName(entry.hero_id)}
      </p>
      <p className="text-lg font-bold tabular-nums text-primary mt-auto">
        {entry.xp.toLocaleString()}
        <span className="text-[10px] font-normal text-muted-foreground ml-1">
          XP
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
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setErr(null);
    void getLeaderboard()
      .then(({ entries: e }) => {
        if (!cancelled) setEntries(e);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "w-[min(100vw-1.5rem,440px)] sm:max-w-lg md:max-w-xl",
          "max-h-[min(88vh,640px)] overflow-hidden flex flex-col p-0 gap-0",
          "border border-primary/25 bg-background/98 backdrop-blur-xl",
          "shadow-[0_0_60px_-12px_color-mix(in_oklch,var(--primary)_40%,transparent)]"
        )}
      >
        <DialogHeader className="px-5 pt-5 pb-3 shrink-0 border-b border-primary/15 bg-gradient-to-b from-primary/8 to-transparent">
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

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
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
                <PodiumCard entry={second} place={2} lang={lang} />
                <PodiumCard entry={first} place={1} lang={lang} />
                <PodiumCard entry={third} place={3} lang={lang} />
              </div>

              {rest.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                    <Medal className="size-3.5 opacity-70" />
                    {lang === "mn" ? "Бусад тоглогчид" : "Other players"}
                  </p>
                  <ul className="space-y-1.5 pr-1">
                    {rest.map((e) => (
                      <li
                        key={`${e.rank}-${e.name}`}
                        className="flex items-center gap-3 rounded-xl border border-primary/10 bg-primary/[0.04] px-3 py-2.5 text-sm hover:bg-primary/[0.08] transition-colors"
                      >
                        <span className="tabular-nums font-mono text-xs text-muted-foreground w-7 shrink-0">
                          {e.rank}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{e.name}</p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {heroDisplayName(e.hero_id)}
                          </p>
                        </div>
                        <span className="tabular-nums font-semibold text-primary shrink-0 text-sm">
                          {e.xp.toLocaleString()}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
