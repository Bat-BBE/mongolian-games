"use client";

import { useMemo } from "react";
import { LuCheck, LuChevronDown, LuChevronUp } from "react-icons/lu";
import type { DashStrings, DashLang } from "./dashboard-strings";
import type { MapStationApiRow, StationGameBundleRow } from "@/lib/api";
import { cn } from "@/lib/utils";
import { MapWorldRadar } from "./MapWorldRadar";

export interface MapFloatingQuestPanelProps {
  t: DashStrings;
  lang: DashLang;
  heroStationId: string | null;
  nearbyStationId?: string | null;
  selectedStationName?: string | null;
  heroRadarPoint?: { x: number; y: number } | null;
  stationRadarPoints?: Record<string, { x: number; y: number }>;
  peerRadarPoints?: { x: number; y: number }[];
  mapStations: MapStationApiRow[];
  stationGames?: StationGameBundleRow[];
  currentStationLabel?: string;
  stationGameVisits?: Record<string, Record<string, number[]>>;
  /** Даалгаврын самбар нээлттэй эсэх — радартай нийлүүлэх */
  questSheetOpen: boolean;
  onQuestSheetOpenChange: (open: boolean) => void;
}

export function MapFloatingQuestPanel({
  t,
  lang,
  heroStationId,
  nearbyStationId = null,
  selectedStationName = null,
  heroRadarPoint = null,
  stationRadarPoints = {},
  peerRadarPoints = [],
  mapStations,
  currentStationLabel,
  questSheetOpen,
  onQuestSheetOpenChange,
}: MapFloatingQuestPanelProps) {
  const activeStationId = heroStationId;
  const isAtHome = activeStationId === "home";
  const isAtStation = !!activeStationId && activeStationId !== "home";

  const stationInfo = useMemo(
    () =>
      isAtStation
        ? mapStations.find((s) => s.id === activeStationId)
        : null,
    [mapStations, activeStationId, isAtStation],
  );
  const nearbyStationName = useMemo(() => {
    if (!nearbyStationId || nearbyStationId === "home") return "";
    return (
      mapStations.find((s) => s.id === nearbyStationId)?.name?.trim() ||
      nearbyStationId
    );
  }, [mapStations, nearbyStationId]);

  const stationName = (
    stationInfo?.name ||
    currentStationLabel ||
    activeStationId ||
    ""
  ).trim();
  const movingTargetName = (selectedStationName || nearbyStationName || "").trim();
  const statusTitle =
    isAtHome
      ? t.sidebarAtHomeBadge
      : isAtStation
        ? lang === "mn"
        ? `Одоо: ${stationName}`
        : `Now at: ${stationName}`
        : lang === "mn"
          ? movingTargetName
            ? `Ойролцоо: ${movingTargetName}`
            : "Замд явж байна"
          : movingTargetName
            ? `Nearby: ${movingTargetName}`
            : "On the way";
  const statusHint =
    isAtHome
      ? t.sidebarAtHomeHint
      : isAtStation
        ? lang === "mn"
          ? "Энэ өртөөнөөс тоглоом руу орно. Өөр өртөө рүү явах бол map дээрээс сонгоод «Очих» дар."
          : "Open games from this station. To move, select another station on the map and tap Go there."
        : lang === "mn"
          ? movingTargetName
            ? `«${movingTargetName}» өртөө рүү ойртож байна. Илүү хурдан очих бол map дээрээс «Очих» дар.`
            : "Өртөөний ойролцоо байна. Map дээр өртөөг сонгоод «Очих» дар."
          : movingTargetName
            ? `Approaching ${movingTargetName}. Tap Go there on the map to reach faster.`
            : "You are between stations. Select a station and tap Go there.";

  return (
    <div
      data-tour-anchor="dashboard-sidebar"
      className="pointer-events-auto w-full max-w-[min(22rem,calc(100vw-1.5rem))]"
    >
      <div className="dash-map-quest-panel relative overflow-hidden rounded-2xl sm:rounded-3xl">
        {isAtHome ? (
          <div className="flex items-center justify-between gap-2 border-b border-[color:var(--map-ui-border)] px-3 py-2 sm:px-3.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[color:var(--map-ui-text-muted)] sm:text-[12px]">
              {t.questsPanelTitle}
            </span>
            <button
              type="button"
              onClick={() => onQuestSheetOpenChange(!questSheetOpen)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[color:var(--map-ui-border-subtle)] text-[color:var(--map-ui-text-muted)] transition hover:border-[color:var(--map-ui-border-bright)] hover:text-[color:var(--map-gold)]"
              aria-expanded={questSheetOpen}
              aria-label={
                questSheetOpen
                  ? t.questsPanelCollapseAria
                  : t.questsPanelExpandAria
              }
            >
              {questSheetOpen ? (
                <LuChevronUp className="size-4" aria-hidden />
              ) : (
                <LuChevronDown className="size-4" aria-hidden />
              )}
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2 border-b border-[color:var(--map-ui-border)] px-3 py-2 sm:px-3.5">
            <span className="min-w-0 flex-1 truncate text-[11px] font-semibold uppercase tracking-[0.1em] text-[color:var(--map-ui-text-muted)] sm:text-[12px]">
              {t.currentExpedition}
            </span>
            <button
              type="button"
              onClick={() => onQuestSheetOpenChange(!questSheetOpen)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[color:var(--map-ui-border-subtle)] text-[color:var(--map-ui-text-muted)] transition hover:border-[color:var(--map-ui-border-bright)] hover:text-[color:var(--map-gold)]"
              aria-expanded={questSheetOpen}
              aria-label={
                questSheetOpen
                  ? t.questsPanelCollapseAria
                  : t.questsPanelExpandAria
              }
            >
              {questSheetOpen ? (
                <LuChevronUp className="size-4" aria-hidden />
              ) : (
                <LuChevronDown className="size-4" aria-hidden />
              )}
            </button>
          </div>
        )}

        <div
          className={cn(
            "flex max-h-[min(42vh,320px)] flex-col gap-2.5 overflow-y-auto p-3 sm:max-h-[min(38vh,360px)]",
            !questSheetOpen && "hidden",
          )}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <MapWorldRadar
              className="shrink-0 self-center sm:mt-0.5 sm:self-start"
              heroPoint={heroRadarPoint}
              stationPoints={stationRadarPoints}
              peerPoints={peerRadarPoints}
              nearbyStationId={nearbyStationId}
            />
            <div className="flex min-w-0 flex-1 items-start gap-2.5">
              <span
                className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-emerald-500/45 bg-emerald-500/15"
                aria-hidden
              >
                <LuCheck className="size-3.5 text-emerald-400" strokeWidth={2.75} />
              </span>
              <div className="min-w-0 flex-1 space-y-1">
                <p className="font-display text-sm font-semibold leading-snug text-[color:var(--map-ui-text)] sm:text-base">
                  {statusTitle}
                </p>
                <p className="text-[12px] leading-relaxed text-[color:var(--map-ui-text-muted)] sm:text-sm">
                  {statusHint}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
