"use client";

import { LuX as X, LuStar as Star } from "react-icons/lu";
import { cn } from "@/lib/utils";
import { StationImageOrIcon } from "./StationImageOrIcon";
import type { UrtuuStation } from "./UrtuuNode";
import {
  gameWeeklyPlaysRemaining,
  STATION_GAME_WEEKLY_PLAY_CAP,
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
  weeklyActiveHint: string;
  weeklyExhaustedHint: string;
  cultureCaption: string;
  stepsTitle: string;
  stepTravel: string;
  stepPickGame: string;
  gameAboutLabel: string;
  /** `{remaining}`, `{cap}` */
  gameQuotaActive: string;
  /** `{cap}` */
  gameQuotaLocked: string;
  gameButtonWeekLocked: string;
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
  weeklyActiveHint,
  weeklyExhaustedHint,
  cultureCaption,
  stepsTitle,
  stepTravel,
  stepPickGame,
  gameAboutLabel,
  gameQuotaActive,
  gameQuotaLocked,
  gameButtonWeekLocked,
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

  const capStr = String(STATION_GAME_WEEKLY_PLAY_CAP);
  const fillQuota = (tpl: string, remaining: number) =>
    tpl.replace(/\{remaining\}/g, String(remaining)).replace(/\{cap\}/g, capStr);

  const hintText = station.questHint?.trim();
  const storyText = station.questDesc?.trim();
  const hasStory = Boolean(hintText || storyText);

  return (
    <>
      <div
        className="map-station-scrim absolute inset-0 z-[100] backdrop-blur-[10px]"
        onClick={onClose}
        style={{ background: "var(--map-overlay-scrim)" }}
      />
      <div
        className={cn(
          "map-station-card absolute bottom-4 left-1/2 -translate-x-1/2 z-[100] w-[min(540px,calc(100vw-1rem))] max-h-[min(72vh,620px)] overflow-hidden flex flex-col",
          "rounded-2xl border shadow-2xl",
        )}
        style={{
          borderColor: "var(--map-ui-border)",
          background: `linear-gradient(180deg, var(--map-ui-surface-2) 0%, var(--map-ui-surface) 100%)`,
          color: "var(--map-ui-text)",
          boxShadow:
            "0 16px 48px rgba(0,0,0,0.5), 0 0 36px color-mix(in srgb, var(--gold) 8%, transparent)",
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
          <StationImageOrIcon
            size="popup"
            imageUrl={station.imageUrl}
            icon={station.icon?.trim() || "📍"}
            alt={station.name}
          />
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
            <section
              className="mb-3 rounded-2xl border border-amber-500/18 px-3 py-2.5"
              style={{
                background:
                  "linear-gradient(165deg, rgba(41,37,32,0.55) 0%, rgba(12,10,8,0.72) 100%)",
              }}
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-200/85">
                {historyTitle}
              </p>
              <p className="mt-1 text-[10px] leading-snug text-muted-foreground/95">
                {cultureCaption}
              </p>
              {hintText ? (
                <p className="mt-2 text-[12px] font-medium leading-snug text-foreground/95">
                  {hintText}
                </p>
              ) : null}
              {storyText ? (
                <p className="mt-2 text-[11px] leading-relaxed text-foreground/80">
                  {storyText}
                </p>
              ) : null}
            </section>
          ) : null}

          {/* <section className="mb-3 rounded-xl border border-white/[0.08] bg-black/22 px-2.5 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-primary/85">
              {stepsTitle}
            </p>
            <ol className="mt-1.5 list-decimal space-y-1 pl-4 text-[10px] leading-snug text-foreground/90 sm:text-[11px]">
              <li>{stepTravel}</li>
              <li>{stepPickGame}</li>
            </ol>
          </section> */}

          {onTravel || onReturnHome ? (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {onTravel ? (
                <button
                  type="button"
                  onClick={onTravel}
                  className="rounded-lg border border-primary/35 px-2.5 py-1 text-[11px] font-semibold text-primary-foreground hover:opacity-95"
                  style={{ backgroundImage: "var(--grad-gold)" }}
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
          <p className="mb-2 text-[10px] leading-snug text-muted-foreground/90">
            {stationWeeklyExhausted ? weeklyExhaustedHint : weeklyActiveHint}
          </p>

          <div className="grid grid-cols-2 gap-2">
            {list.slice(0, 2).map((g) => {
              const slug = g.slug?.trim() || "";
              const isDone = slug ? completed.has(slug) : false;
              const gameRem = slug
                ? gameWeeklyPlaysRemaining(station.id, slug, stationGameVisits)
                : 0;
              const usedThisWeek = Math.max(
                0,
                STATION_GAME_WEEKLY_PLAY_CAP - gameRem,
              );
              const progressionLocked =
                Boolean(slug) && !completed.has(slug) && slug !== nextRequired;
              const weekLocked = Boolean(slug) && gameRem <= 0;
              const canStart =
                canPlay && Boolean(slug) && gameRem > 0 && !progressionLocked;

              const statusText = progressionLocked
                ? lockedHint
                : weekLocked
                  ? gameButtonWeekLocked
                  : isDone
                    ? doneHint
                    : lockedHint;

              const desc = g.desc?.trim();
              return (
                <div
                  key={`${station.id}-${g.slug || g.name}`}
                  className="flex flex-col rounded-xl border border-white/10 bg-black/28 p-2"
                >
                  <div className="flex justify-between gap-1">
                    <p className="line-clamp-2 min-h-[1.25rem] text-[10px] font-semibold leading-tight text-foreground">
                      {g.name}
                    </p>
                    <p className="flex max-w-[42%] shrink-0 items-center gap-0.5 text-[9px] font-medium text-primary/90">
                      <Star className="size-2.5 shrink-0" />
                      <span className="truncate">{g.reward}</span>
                    </p>
                  </div>
                  {slug ? (
                    <div className="mt-1.5 space-y-1">
                      <div
                        className="flex h-2 gap-0.5"
                        role="img"
                        aria-label={fillQuota(gameQuotaActive, gameRem)}
                      >
                        {Array.from(
                          { length: STATION_GAME_WEEKLY_PLAY_CAP },
                          (_, i) => (
                            <div
                              key={i}
                              className={cn(
                                "min-h-0 flex-1 rounded-sm transition-colors",
                                i < usedThisWeek
                                  ? weekLocked
                                    ? "bg-rose-500/55"
                                    : "bg-amber-400/70"
                                  : "bg-emerald-500/50",
                              )}
                            />
                          ),
                        )}
                      </div>
                      <p
                        className={cn(
                          "text-[9px] font-semibold leading-snug",
                          weekLocked
                            ? "text-rose-200/90"
                            : "text-emerald-100/90",
                        )}
                      >
                        {weekLocked
                          ? fillQuota(gameQuotaLocked, gameRem)
                          : fillQuota(gameQuotaActive, gameRem)}
                      </p>
                    </div>
                  ) : null}
                  {/* {desc ? (
                    <div className="mt-1.5 border-t border-white/[0.06] pt-1.5">
                      <p className="text-[8px] font-semibold uppercase tracking-wide text-muted-foreground/90">
                        {gameAboutLabel}
                      </p>
                      <p className="mt-0.5 line-clamp-4 text-[9px] leading-snug text-muted-foreground">
                        {desc}
                      </p>
                    </div>
                  ) : null} */}
                  <button
                    type="button"
                    disabled={!canStart}
                    onClick={() => canStart && g.slug && onPlay(g.slug, g.name)}
                    className={cn(
                      "mt-1.5 w-full rounded-lg py-1.5 text-[9px] font-bold uppercase transition-all",
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
                const usedThisWeek = Math.max(
                  0,
                  STATION_GAME_WEEKLY_PLAY_CAP - gameRem,
                );
                const progressionLocked =
                  Boolean(slug) &&
                  !completed.has(slug) &&
                  slug !== nextRequired;
                const weekLocked = Boolean(slug) && gameRem <= 0;
                const canStart =
                  canPlay && Boolean(slug) && gameRem > 0 && !progressionLocked;
                const btnLabel = canStart
                  ? playLabel
                  : progressionLocked
                    ? lockedHint
                    : weekLocked
                      ? gameButtonWeekLocked
                      : "—";
                return (
                  <li
                    key={`${station.id}-more-${g.slug || g.name}`}
                    className="flex flex-col gap-1 rounded-lg border border-white/8 bg-black/20 px-2 py-1.5 text-[10px]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="min-w-0 truncate font-medium text-foreground/90">
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
                            : "opacity-60",
                        )}
                      >
                        {btnLabel}
                      </button>
                    </div>
                    {slug ? (
                      <div className="space-y-0.5">
                        <div className="flex h-1.5 gap-0.5">
                          {Array.from(
                            { length: STATION_GAME_WEEKLY_PLAY_CAP },
                            (_, i) => (
                              <div
                                key={i}
                                className={cn(
                                  "min-h-0 flex-1 rounded-[2px]",
                                  i < usedThisWeek
                                    ? weekLocked
                                      ? "bg-rose-500/55"
                                      : "bg-amber-400/70"
                                    : "bg-emerald-500/50",
                                )}
                              />
                            ),
                          )}
                        </div>
                        <p
                          className={cn(
                            "text-[8px] font-semibold leading-snug",
                            weekLocked
                              ? "text-rose-200/85"
                              : "text-emerald-100/85",
                          )}
                        >
                          {weekLocked
                            ? fillQuota(gameQuotaLocked, gameRem)
                            : fillQuota(gameQuotaActive, gameRem)}
                        </p>
                      </div>
                    ) : null}
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
