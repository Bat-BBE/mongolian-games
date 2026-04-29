import { cn } from "@/lib/utils";
import { StationImageOrIcon } from "./StationImageOrIcon";
import type { LabelPos } from "./AnimationController";
import {
  STATION_CONFIGS,
  isStationUnlockedInJourney,
  stationAllGamesWeeklyLocked,
  type StationGameVisits,
} from "./mapConstants";
import type { UrtuuStation } from "./UrtuuNode";

interface StationLabelsProps {
  stations: UrtuuStation[];
  labelPositions: Record<string, LabelPos>;
  currentStationId: string;
  heroAtStationId?: string | null;
  doneStationIds: string[];
  stationGameVisits?: StationGameVisits;
  selectedId: string | null;
  visibleStationId: string | null;
  labelApproachAlpha?: number;
  labelZoomScale?: number;
  showAllVisibleLabels?: boolean;
  homeLabelTitle?: string;
  homeLabelSubtitle?: string;
  onSelect: (id: string) => void;
}

export function StationLabels({
  stations,
  labelPositions,
  currentStationId,
  heroAtStationId = null,
  doneStationIds,
  stationGameVisits,
  selectedId,
  visibleStationId,
  labelApproachAlpha = 1,
  labelZoomScale = 1,
  showAllVisibleLabels = false,
  homeLabelTitle,
  homeLabelSubtitle,
  onSelect,
}: StationLabelsProps) {
  return (
    <div className="absolute inset-0 z-[50] pointer-events-none">
      {stations.map((station) => {
        const lp = labelPositions[station.id];
        if (!lp || !lp.visible) return null;
        const showThis = showAllVisibleLabels
          ? true
          : station.id === visibleStationId;
        if (!showThis) return null;

        const isPlayerHome = station.id === "home";
        const isCurrent =
          heroAtStationId != null && station.id === heroAtStationId;
        const isDone = doneStationIds.includes(station.id);
        const isUnlocked = isStationUnlockedInJourney(
          station.id,
          currentStationId,
        );
        const gameSlugs =
          station.games
            ?.map((g) => g.slug)
            .filter((s): s is string => Boolean(s?.trim())) ??
          (station.gameSlug?.trim() ? [station.gameSlug.trim()] : []);
        const isWeeklyLocked = stationAllGamesWeeklyLocked(
          station.id,
          gameSlugs,
          stationGameVisits,
        );
        const isLocked = !isUnlocked || isWeeklyLocked;
        const isUpcoming = !isCurrent && !isDone && !isLocked;
        const isSelected = station.id === selectedId;
        const fallbackIcon =
          station.icon?.trim() || STATION_CONFIGS[station.id]?.icon || "📍";
        const firstGameName =
          station.games?.[0]?.name?.trim() || station.gameName?.trim() || "";
        const gameCount = station.games?.length ?? (firstGameName ? 1 : 0);
        const homeTitle = homeLabelTitle?.trim() || station.name;
        const homeSub = homeLabelSubtitle?.trim();

        const baseOpacity = isPlayerHome
          ? 1
          : isLocked
            ? 0.48
            : isCurrent
              ? 1
              : isSelected
                ? 0.95
                : isDone
                  ? 0.72
                  : 0.38;
        const ap = labelApproachAlpha;
        const isDoorStation = station.id === visibleStationId;
        const farFade = isPlayerHome
          ? 1
          : showAllVisibleLabels && !isDoorStation
            ? 0.76
            : 0.34 + 0.66 * ap;
        const opacity = baseOpacity * farFade;

        return (
          <div
            key={station.id}
            className="absolute pointer-events-auto cursor-pointer select-none"
            style={{
              left: lp.x,
              top: lp.y,
              transform: isPlayerHome
                ? "translate(-50%, -100%) scale(1)"
                : `translate(-50%, -100%) scale(${labelZoomScale})`,
              opacity,
              transition: "opacity 0.35s ease, transform 0.25s ease",
              zIndex: isPlayerHome
                ? 40
                : showAllVisibleLabels && isDoorStation
                  ? 34
                  : isCurrent
                    ? 33
                    : showAllVisibleLabels
                      ? 16
                      : isSelected
                        ? 25
                        : isLocked
                          ? 5
                          : 12,
            }}
            onClick={() => onSelect(station.id)}
          >
            <div className="flex flex-col items-center gap-0">
              <div
                className={cn(
                  "relative flex items-center gap-1.5 rounded-full border backdrop-blur-sm transition-all duration-200 whitespace-nowrap",
                  isPlayerHome &&
                    cn(
                      "map-label-home px-2.5 py-1.5 rounded-xl text-xs",
                      isCurrent &&
                        "ring-1 ring-emerald-400/55 ring-offset-1 ring-offset-black/30 scale-105",
                    ),
                  !isPlayerHome && isLocked
                    ? "px-2.5 py-1 text-xs font-semibold bg-zinc-950/80 border-zinc-600/50 text-zinc-500 scale-95 shadow-lg"
                    : !isPlayerHome && isCurrent
                      ? "px-2.5 py-1 text-xs font-bold bg-emerald-950/95 border border-emerald-300 text-emerald-50 scale-105 shadow-[0_0_24px_rgba(52,211,153,0.45),0_6px_18px_rgba(0,0,0,0.4)] ring-1 ring-emerald-400/45 ring-offset-1 ring-offset-black/35"
                      : !isPlayerHome &&
                        "px-2.5 py-1 text-xs font-semibold shadow-lg",
                  !isPlayerHome &&
                    !isLocked &&
                    !isCurrent &&
                    (isSelected
                      ? "bg-primary/85 border-primary text-primary-foreground scale-105"
                      : isDone
                        ? "bg-amber-900/75 border-amber-500/70 text-amber-200"
                        : "bg-gray-900/65 border-gray-500/40 text-gray-300"),
                )}
              >
                {isLocked && (
                  <span
                    className="text-[10px] leading-none opacity-90"
                    title={
                      isWeeklyLocked
                        ? "7 хоногийн тоглолт дууссан"
                        : "Түгжигдсэн"
                    }
                  >
                    🔒
                  </span>
                )}
                {isPlayerHome && isCurrent && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-3 w-3">
                    <span className="map-home-ping absolute inset-0 rounded-full animate-ping opacity-70" />
                    <span className="absolute inset-0 rounded-full bg-emerald-300/90" />
                  </span>
                )}
                {!isPlayerHome && isCurrent && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5">
                    <span className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-75" />
                    <span className="absolute inset-0 bg-emerald-400 rounded-full" />
                  </span>
                )}

                {isPlayerHome ? (
                  <span className="text-xs leading-none flex h-7 w-7 min-h-7 min-w-7 items-center justify-center text-lg">
                    🛖
                  </span>
                ) : (
                  <StationImageOrIcon
                    size="label"
                    imageUrl={station.imageUrl}
                    icon={fallbackIcon}
                    alt=""
                  />
                )}

                <span className="flex flex-col items-start gap-0 leading-tight">
                  {isPlayerHome ? (
                    <>
                      <span className="text-xs font-bold tracking-wide text-white drop-shadow-sm">
                        {homeTitle}
                      </span>
                      {homeSub ? (
                <span
                  className="text-[9px] font-medium max-w-[200px] leading-snug"
                  style={{ color: "var(--map-fog)" }}
                  title={homeSub}
                >
                          {homeSub}
                        </span>
                      ) : null}
                    </>
                  ) : (
                    <>
                      <span className="font-semibold tracking-tight drop-shadow-sm">
                        {station.name}
                      </span>
                      {firstGameName &&
                      ap > 0.48 &&
                      (!showAllVisibleLabels || isDoorStation) ? (
                        <span
                          className="text-[9px] font-normal opacity-80 max-w-[200px] truncate"
                          title={firstGameName}
                        >
                          {gameCount > 1 ? `1/${gameCount} · ` : ""}
                          {firstGameName}
                        </span>
                      ) : null}
                    </>
                  )}
                </span>

                {isDone && !isCurrent && !isPlayerHome && (
                  <span className="text-amber-400 text-xs leading-none">✓</span>
                )}

                {isUpcoming && !isSelected && !isLocked && !isPlayerHome && (
                  <span className="text-gray-500 text-xs leading-none">·</span>
                )}
              </div>

              <div
                className={cn(
                  "w-0 h-0",
                  "border-l-[4px] border-r-[4px] border-t-[6px]",
                  "border-l-transparent border-r-transparent",
                  isPlayerHome
                    ? "border-t-[color:var(--map-fog)]"
                    : isLocked
                      ? "border-t-zinc-600/60"
                      : isCurrent
                        ? "border-t-emerald-400"
                        : isSelected
                          ? "border-t-primary"
                          : isDone
                            ? "border-t-amber-500/70"
                            : "border-t-gray-500/50",
                )}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
