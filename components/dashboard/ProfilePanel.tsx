"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { getUserByEmail, updateHeroForEmail } from "@/lib/firebase-auth";
import {
  loadPlayer,
  savePlayer,
  HEROES,
} from "@/components/hero-select/hero-data";
import { parseHeroId, type HeroId } from "@/components/hero-select/hero-strings";
import { getDashboardBundle, type MapStationApiRow } from "@/lib/api";
import { normalizeStationId, STATION_CONFIGS } from "./mapConstants";
import {
  formatCooldownHMS,
  getHeroChangeRemainingMs,
  setHeroChangeCooldownFromNow,
} from "@/lib/hero-change-cooldown";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DashLang, DashStrings } from "./dashboard-strings";

function num(v: unknown, fallback: number): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export type ProfilePanelProps = {
  t: DashStrings;
  lang: DashLang;
  /** false бол өгөгдөл татахгүй (хаалттай модал) */
  active?: boolean;
  /** Баатар амжилттай солигдсоны дараа */
  onHeroSaved?: () => void;
};

export function ProfilePanel({
  t,
  lang,
  active = true,
  onHeroSaved,
}: ProfilePanelProps) {
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [heroName, setHeroName] = useState("");
  const [heroTitle, setHeroTitle] = useState("");
  const [heroImage, setHeroImage] = useState("");
  const [tier, setTier] = useState("—");
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const [xpMax, setXpMax] = useState(100);
  const [kp, setKp] = useState(0);
  const [currentStationLabel, setCurrentStationLabel] = useState("—");
  const [doneIds, setDoneIds] = useState<string[]>([]);
  const [mapStations, setMapStations] = useState<MapStationApiRow[]>([]);
  const [currentHeroId, setCurrentHeroId] = useState<HeroId>("shikhikhutag");
  const [selectedId, setSelectedId] = useState<HeroId>("shikhikhutag");
  const [saving, setSaving] = useState(false);
  const [cooldownMs, setCooldownMs] = useState(0);

  const tickCooldown = useCallback(() => {
    setCooldownMs(getHeroChangeRemainingMs());
  }, []);

  useEffect(() => {
    tickCooldown();
    const id = window.setInterval(tickCooldown, 1000);
    return () => window.clearInterval(id);
  }, [tickCooldown]);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    void (async () => {
      setLoading(true);
      const saved = loadPlayer();
      if (!saved) {
        setUserEmail("");
        setLoading(false);
        return;
      }
      setUserEmail(saved.name);
      setSelectedId(parseHeroId(saved.heroId));
      setCurrentHeroId(parseHeroId(saved.heroId));

      try {
        const bundle = await getDashboardBundle(saved.name, lang);
        if (cancelled) return;
        setMapStations(bundle.mapStations ?? []);
        setUserEmail(String(bundle.user.email ?? saved.name));
        const prof = bundle.user.profile as Record<string, unknown>;
        const prog = bundle.user.progress as Record<string, unknown>;
        const h = bundle.hero;
        setHeroName(
          String(bundle.computed.displayHeroName ?? prof.heroName ?? "")
        );
        setHeroTitle(
          String(bundle.computed.displayHeroTitle ?? prof.heroTitle ?? "")
        );
        setHeroImage(
          typeof h?.image_url === "string"
            ? h.image_url
            : String(prof.heroImages ?? "")
        );
        setTier(bundle.computed.tier ?? "—");
        setLevel(num(prof.level, 1));
        setKp(num(prof.kp, 0));
        setXp(num(prog.xp, 0));
        setXpMax(num(prog.xpMax, 100));
        setCurrentStationLabel(bundle.computed.currentStationLabel ?? "—");
        const rawDone = prog.doneStationIds;
        const ids = Array.isArray(rawDone)
          ? rawDone.map((x) => normalizeStationId(String(x)))
          : [];
        setDoneIds(ids);
        const hid =
          typeof prof.heroId === "string"
            ? parseHeroId(prof.heroId)
            : parseHeroId(saved.heroId);
        setCurrentHeroId(hid);
        setSelectedId(hid);
      } catch {
        const data = await getUserByEmail(saved.name);
        if (cancelled || !data) {
          setLoading(false);
          return;
        }
        const prof = data.profile as Record<string, unknown>;
        const prog = data.progress as Record<string, unknown>;
        setHeroName(String(prof.heroName ?? ""));
        setHeroTitle(String(prof.heroTitle ?? ""));
        setHeroImage(String(prof.heroImages ?? ""));
        setLevel(num(prof.level, 1));
        setKp(num(prof.kp, 0));
        setXp(num(prog.xp, 0));
        setXpMax(num(prog.xpMax, 100));
        const curSid =
          typeof prog.currentStationId === "string"
            ? normalizeStationId(prog.currentStationId)
            : "";
        setCurrentStationLabel(
          curSid
            ? STATION_CONFIGS[curSid as keyof typeof STATION_CONFIGS]?.region ??
                curSid
            : "—"
        );
        const rawDone = prog.doneStationIds;
        setDoneIds(
          Array.isArray(rawDone)
            ? rawDone.map((x) => normalizeStationId(String(x)))
            : []
        );
        const hid = parseHeroId(prof.heroId ?? saved.heroId);
        setCurrentHeroId(hid);
        setSelectedId(hid);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [lang, active]);

  function stationLabel(id: string) {
    const sid = normalizeStationId(id);
    const row = mapStations.find((s) => s.id === sid);
    if (row?.name) return row.name;
    const cfg = STATION_CONFIGS[sid as keyof typeof STATION_CONFIGS];
    return cfg?.region ?? sid;
  }

  const onSaveHero = async () => {
    if (selectedId === currentHeroId) return;
    if (cooldownMs > 0) return;
    if (!userEmail) return;
    setSaving(true);
    try {
      await updateHeroForEmail(userEmail, selectedId);
      setHeroChangeCooldownFromNow();
      savePlayer({ name: userEmail, heroId: selectedId });
      setCurrentHeroId(selectedId);
      tickCooldown();
      onHeroSaved?.();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const loadingLabel = useMemo(
    () => (lang === "mn" ? "Ачаалж байна…" : "Loading…"),
    [lang]
  );

  if (!active) return null;

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground py-10 text-center">
        {loadingLabel}
      </p>
    );
  }

  if (!userEmail) {
    return (
      <p className="text-sm text-muted-foreground py-6">{t.profileNoSession}</p>
    );
  }

  return (
    <div className="space-y-6 pr-1">
      <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start">
        <div className="shrink-0 w-24 h-24 rounded-full border-2 border-primary overflow-hidden shadow-[0_0_20px_rgba(212,175,55,0.35)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={heroImage || "/images/shikhikhutag.png"}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 text-center sm:text-left space-y-1 min-w-0">
          <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            {tier}
          </p>
          <h2 className="font-display text-lg sm:text-xl tracking-wide">
            {heroName}
          </h2>
          <p className="text-sm text-muted-foreground">{heroTitle}</p>
          <p className="text-[11px] font-mono text-muted-foreground truncate">
            {userEmail}
          </p>
          <p className="text-xs text-muted-foreground">
            <span className="text-foreground/80">{t.profileStationLabel}:</span>{" "}
            {currentStationLabel}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="admin-panel rounded-xl p-3 text-center space-y-0.5">
          <p className="text-[9px] uppercase tracking-wider text-muted-foreground">
            {t.profileLevelLabel}
          </p>
          <p className="text-xl font-semibold tabular-nums">{level}</p>
        </div>
        <div className="admin-panel rounded-xl p-3 text-center space-y-0.5">
          <p className="text-[9px] uppercase tracking-wider text-muted-foreground">
            {t.profileXpLabel}
          </p>
          <p className="text-sm font-semibold tabular-nums leading-tight">
            {xp} / {xpMax}
          </p>
        </div>
        <div className="admin-panel rounded-xl p-3 text-center space-y-0.5">
          <p className="text-[9px] uppercase tracking-wider text-muted-foreground">
            {t.treasury}
          </p>
          <p className="text-xl font-semibold tabular-nums">{kp}</p>
        </div>
      </div>

      <section className="space-y-2">
        <h3 className="font-display text-xs tracking-[0.15em] text-muted-foreground uppercase">
          {t.profileVisitedStationsTitle}
        </h3>
        {doneIds.length === 0 ? (
          <p className="text-xs text-muted-foreground">—</p>
        ) : (
          <ul className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
            {doneIds.map((id) => (
              <li
                key={id}
                className="text-[10px] px-2 py-0.5 rounded-full border border-primary/25 bg-primary/5"
              >
                {stationLabel(id)}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3 border-t border-border pt-4">
        <h3 className="font-display text-xs tracking-[0.15em] text-muted-foreground uppercase">
          {t.profileChangeHeroTitle}
        </h3>
        <p className="text-[11px] text-muted-foreground leading-snug">
          {t.profileHeroOnCooldown}
        </p>

        <div
          className={cn(
            "rounded-xl border px-3 py-2 text-xs tabular-nums",
            cooldownMs > 0
              ? "border-amber-500/40 bg-amber-500/10 text-amber-200"
              : "border-primary/30 bg-primary/5"
          )}
        >
          <span className="text-muted-foreground text-[10px] uppercase tracking-wider">
            {t.profileHeroCooldownLabel}:{" "}
          </span>
          {formatCooldownHMS(cooldownMs, lang)}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {HEROES.map((h) => {
            const sel = selectedId === h.id;
            return (
              <button
                key={h.id}
                type="button"
                disabled={!h.available}
                onClick={() => setSelectedId(h.id)}
                className={cn(
                  "rounded-lg border overflow-hidden text-left transition-all",
                  sel
                    ? "border-primary ring-2 ring-primary/40"
                    : "border-border hover:border-primary/50",
                  !h.available && "opacity-40 cursor-not-allowed"
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={h.imageUrl}
                  alt=""
                  className="w-full aspect-square object-cover"
                />
                <div className="p-1.5 space-y-0">
                  <p className="text-[10px] font-display font-semibold truncate">
                    {h.name}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        <Button
          type="button"
          className="w-full"
          disabled={saving || selectedId === currentHeroId || cooldownMs > 0}
          onClick={() => void onSaveHero()}
        >
          {saving ? "…" : t.profileHeroConfirm}
        </Button>
      </section>
    </div>
  );
}
