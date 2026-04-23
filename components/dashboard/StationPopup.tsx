"use client";

import { LuX as X, LuStar as Star } from "react-icons/lu";
import { cn } from "@/lib/utils";
import type { UrtuuStation } from "./UrtuuNode";
import {
  gameWeeklyPlaysRemaining,
  stationAllGamesWeeklyLocked,
} from "./mapConstants";

interface StationPopupProps {
  station: UrtuuStation | null;
  onClose: () => void;
  onPlay: (gameSlug: string, gameName?: string) => void;
  onTravel?: () => void;
  onReturnHome?: () => void;
  onReturnToPreviousSpot?: () => void;
  travelLabel?: string;
  returnHomeLabel?: string;
  returnPrevLabel?: string;
  heroTargetId?: string | null;
  regionLabel: string;
  gamesSectionLabel: string;
  historyTitle: string;
  playLabel: string;
  lockedHint: string;
  doneHint: string;
  canPlay?: boolean;
  stationSteps?: Record<string, { completedGameSlugs: string[] }>;
  stationGameVisits?: Record<string, Record<string, number[]>>;
}

export function StationPopup({
  station,
  onClose,
  onPlay,
  onTravel,
  onReturnHome,
  onReturnToPreviousSpot,
  travelLabel = "Очих",
  returnHomeLabel = "Гэр рүү буцах",
  returnPrevLabel = "Өмнөх байрлал руу",
  heroTargetId = null,
  regionLabel,
  gamesSectionLabel,
  historyTitle,
  playLabel,
  lockedHint,
  doneHint,
  canPlay = true,
  stationSteps,
  stationGameVisits,
}: StationPopupProps) {
  if (!station) return null;

  const list =
    station.games && station.games.length > 0
      ? station.games
      : [
          {
            slug: station.gameSlug ?? "",
            name: station.gameName,
            desc: station.gameDesc,
            reward: station.reward,
          },
        ];

  const completed = new Set(
    stationSteps?.[station.id]?.completedGameSlugs?.map(String) ?? [],
  );
  const gameSlugs = list
    .map((g) => g.slug)
    .filter((s): s is string => Boolean(s && String(s).trim()));
  const stationWeeklyExhausted = stationAllGamesWeeklyLocked(
    station.id,
    gameSlugs,
    stationGameVisits,
  );
  const nextRequired =
    list.map((g) => g.slug).find((slug) => slug && !completed.has(slug)) ??
    null;

  const hintText = station.questHint?.trim();
  const storyText = station.questDesc?.trim();
  const hasStory = Boolean(hintText || storyText);

  return (
    <>
      <div
        className="absolute inset-0 z-[100] bg-black/50 backdrop-blur-[10px]"
        onClick={onClose}
      />
      <div
        className={cn(
          "absolute bottom-4 left-1/2 -translate-x-1/2 z-[100] w-[min(540px,calc(100vw-1rem))] max-h-[min(72vh,620px)] overflow-hidden flex flex-col",
          "rounded-2xl border border-primary/25 bg-gradient-to-b from-slate-950/98 to-slate-900/95 shadow-2xl",
        )}
        style={{
          boxShadow:
            "0 16px 48px rgba(0,0,0,0.55), 0 0 32px rgba(212,175,55,0.06)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-2.5 right-2.5 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-black/30 text-muted-foreground hover:bg-white/10 hover:text-foreground transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        <div className="flex shrink-0 items-start gap-3 border-b border-white/10 p-3 pr-10">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-primary/20 text-2xl"
            style={{
              background:
                "color-mix(in oklch, var(--primary) 12%, transparent)",
            }}
          >
            {station.imageUrl ? (
              <img
                src={station.imageUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <span>{station.icon?.trim() || "📍"}</span>
            )}
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <h4 className="font-display text-base font-semibold leading-tight tracking-wide text-foreground">
              {station.name}
            </h4>
            {station.region ? (
              <p className="mt-0.5 text-[9px] uppercase tracking-[0.18em] text-primary/75">
                {regionLabel}: {station.region}
              </p>
            ) : null}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3 pt-2">
          {hasStory ? (
            <section className="mb-3 rounded-xl border border-sky-500/15 bg-sky-950/20 px-2.5 py-2">
              <p className="mb-1 text-[9px] font-semibold uppercase tracking-wider text-sky-200/90">
                {historyTitle}
              </p>
              {hintText ? (
                <p className="text-[11px] font-medium leading-snug text-foreground/95">
                  {hintText}
                </p>
              ) : null}
              {storyText ? (
                <p
                  className={cn(
                    "text-[10px] leading-relaxed text-muted-foreground",
                    hintText ? "mt-1.5" : "",
                  )}
                >
                  {storyText}
                </p>
              ) : null}
            </section>
          ) : null}

          {onTravel || onReturnHome ? (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {onTravel ? (
                <button
                  type="button"
                  onClick={onTravel}
                  className="rounded-lg border border-primary/35 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-foreground hover:bg-primary/18"
                  style={{ background: "var(--gold-gradient)" }}
                >
                  {travelLabel}
                </button>
              ) : null}
              {onReturnHome ? (
                <button
                  type="button"
                  onClick={onReturnHome}
                  className="rounded-lg border border-primary/35 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-foreground hover:bg-primary/18"
                >
                  {returnHomeLabel}
                </button>
              ) : null}
              {heroTargetId && onReturnToPreviousSpot ? (
                <button
                  type="button"
                  onClick={onReturnToPreviousSpot}
                  className="rounded-lg border border-white/12 bg-black/25 px-2 py-1 text-[9px] text-muted-foreground hover:text-foreground"
                >
                  {returnPrevLabel}
                </button>
              ) : null}
            </div>
          ) : null}

          <p className="mb-1 text-[9px] font-semibold uppercase tracking-wider text-primary/80">
            {gamesSectionLabel}
          </p>
          <p className="mb-2 text-[9px] leading-snug text-muted-foreground/90">
            {stationWeeklyExhausted
              ? "7 хоногийн лимит дууссан."
              : "Тоглоом бүр 7 хоногт хамгийн ихдээ 2 удаа тоголно."}
          </p>

          <div className="grid grid-cols-2 gap-2">
            {list.slice(0, 2).map((g) => {
              const slug = g.slug?.trim() || "";
              const isDone = slug ? completed.has(slug) : false;
              const gameRem = slug
                ? gameWeeklyPlaysRemaining(station.id, slug, stationGameVisits)
                : 0;
              const progressionLocked =
                Boolean(slug) && !completed.has(slug) && slug !== nextRequired;
              const canStart =
                canPlay && Boolean(slug) && gameRem > 0 && !progressionLocked;

              const statusText = progressionLocked
                ? lockedHint
                : gameRem <= 0
                  ? "Лимит"
                  : isDone
                    ? doneHint
                    : lockedHint;

              return (
                <div
                  key={`${station.id}-${g.slug || g.name}`}
                  className="flex flex-col rounded-lg border border-white/10 bg-black/25 p-2"
                >
                  <div className="flex justify-between">
                    <p className="line-clamp-1 min-h-[1.25rem] text-[10px] font-semibold leading-tight text-foreground">
                      {g.name}
                    </p>
                    <p className="flex items-center gap-0.5 text-[9px] font-medium text-primary/90">
                      <Star className="size-2.5 shrink-0" />
                      <span className="truncate">{g.reward}</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={!canStart}
                    onClick={() => canStart && g.slug && onPlay(g.slug, g.name)}
                    className={cn(
                      "mt-1 w-full rounded-lg py-1.5 text-[9px] font-bold uppercase transition-all",
                      canStart
                        ? "text-white/90 bg-primary/10 border border-primary/30 hover:bg-primary/30"
                        : "cursor-not-allowed bg-muted/70 text-muted-foreground opacity-70",
                    )}
                  >
                    {canStart ? playLabel : statusText}
                  </button>
                </div>
              );
            })}
          </div>

          {list.length > 2 ? (
            <ul className="mt-2 space-y-1 border-t border-white/10 pt-2">
              {list.slice(2).map((g) => {
                const slug = g.slug?.trim() || "";
                const gameRem = slug
                  ? gameWeeklyPlaysRemaining(
                      station.id,
                      slug,
                      stationGameVisits,
                    )
                  : 0;
                const progressionLocked =
                  Boolean(slug) &&
                  !completed.has(slug) &&
                  slug !== nextRequired;
                const canStart =
                  canPlay && Boolean(slug) && gameRem > 0 && !progressionLocked;
                return (
                  <li
                    key={`${station.id}-more-${g.slug || g.name}`}
                    className="flex items-center justify-between gap-2 text-[10px]"
                  >
                    <span className="min-w-0 truncate text-muted-foreground">
                      {g.name}
                    </span>
                    <button
                      type="button"
                      disabled={!canStart}
                      onClick={() =>
                        canStart && g.slug && onPlay(g.slug, g.name)
                      }
                      className={cn(
                        "shrink-0 rounded-md px-2 py-0.5 text-[9px] font-semibold uppercase",
                        canStart
                          ? "bg-primary/85 text-primary-foreground"
                          : "opacity-50",
                      )}
                    >
                      {canStart ? playLabel : "—"}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      </div>
    </>
  );
}
