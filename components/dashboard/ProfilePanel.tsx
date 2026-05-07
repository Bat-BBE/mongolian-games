"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  getUserByEmail,
  updateHeroForEmail,
  updateNicknameForEmail,
} from "@/lib/firebase-auth";
import {
  loadPlayer,
  savePlayer,
  HEROES,
} from "@/components/hero-select/hero-data";
import {
  parseHeroId,
  type HeroId,
} from "@/components/hero-select/hero-strings";
import {
  getDashboardBundle,
  getContentHeroes,
  resolveAssetUrl,
  type MapStationApiRow,
  type HeroRow,
} from "@/lib/api";
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
  active?: boolean;
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
  const [savingNick, setSavingNick] = useState(false);
  const [nickname, setNickname] = useState("");
  const [initialNickname, setInitialNickname] = useState("");
  const [cooldownMs, setCooldownMs] = useState(0);
  const [heroRows, setHeroRows] = useState<HeroRow[]>([]);
  const [livestock, setLivestock] = useState({
    sheep: 0,
    goat: 0,
    cow: 0,
    horse: 0,
    camel: 0,
  });

  const heroImageById = useCallback(
    (id: HeroId): string => {
      const row =
        heroRows.find((h) => h.slug === id) ||
        heroRows.find((h) => h.id === id);
      if (row?.image_url) return resolveAssetUrl(row.image_url);
      const local = HEROES.find((h) => h.id === id);
      return local?.imageUrl ?? "";
    },
    [heroRows],
  );

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
        const [bundle, heroesResp] = await Promise.all([
          getDashboardBundle(saved.name, lang),
          getContentHeroes().catch(() => ({ heroes: [] as HeroRow[] })),
        ]);
        if (cancelled) return;
        setHeroRows(heroesResp.heroes ?? []);
        setMapStations(bundle.mapStations ?? []);
        setUserEmail(String(bundle.user.email ?? saved.name));
        const prof = bundle.user.profile as Record<string, unknown>;
        const prog = bundle.user.progress as Record<string, unknown>;
        const h = bundle.hero;
        setHeroName(
          String(bundle.computed.displayHeroName ?? prof.heroName ?? ""),
        );
        const loadedNick = String(
          bundle.user.display_name ?? prof.name ?? saved.name ?? "",
        ).trim();
        setNickname(loadedNick);
        setInitialNickname(loadedNick);
        setHeroTitle(
          String(bundle.computed.displayHeroTitle ?? prof.heroTitle ?? ""),
        );
        const heroId =
          typeof prof.heroId === "string"
            ? parseHeroId(prof.heroId)
            : parseHeroId(saved.heroId);
        const rowImg =
          typeof h?.image_url === "string" ? resolveAssetUrl(h.image_url) : "";
        const profImg = resolveAssetUrl((prof as any).heroImages);
        const localImg = HEROES.find((x) => x.id === heroId)?.imageUrl ?? "";
        setHeroImage(rowImg || profImg || localImg);
        setTier(bundle.computed.tier ?? "—");
        setLevel(num(prof.level, 1));
        setKp(num(prof.kp, 0));
        setLivestock({
          sheep: num((prof as any).sheep, 0),
          goat: num((prof as any).goat, 0),
          cow: num((prof as any).cow, 0),
          horse: num((prof as any).horse, 0),
          camel: num((prof as any).camel, 0),
        });
        setXp(num(prog.xp, 0));
        setXpMax(num(prog.xpMax, 100));
        setCurrentStationLabel(bundle.computed.currentStationLabel ?? "—");
        const rawDone = prog.doneStationIds;
        const ids = Array.isArray(rawDone)
          ? rawDone.map((x) => normalizeStationId(String(x)))
          : [];
        setDoneIds(ids);
        setCurrentHeroId(heroId);
        setSelectedId(heroId);
      } catch {
        const data = await getUserByEmail(saved.name);
        if (cancelled || !data) {
          setLoading(false);
          return;
        }
        const prof = data.profile as Record<string, unknown>;
        const prog = data.progress as Record<string, unknown>;
        setHeroName(String(prof.heroName ?? ""));
        const loadedNick = String(prof.name ?? saved.name ?? "").trim();
        setNickname(loadedNick);
        setInitialNickname(loadedNick);
        setHeroTitle(String(prof.heroTitle ?? ""));
        const hid0 = parseHeroId(prof.heroId ?? saved.heroId);
        setHeroImage(
          resolveAssetUrl((prof as any).heroImages) ||
            HEROES.find((x) => x.id === hid0)?.imageUrl ||
            "",
        );
        setLevel(num(prof.level, 1));
        setKp(num(prof.kp, 0));
        setLivestock({
          sheep: num((prof as any).sheep, 0),
          goat: num((prof as any).goat, 0),
          cow: num((prof as any).cow, 0),
          horse: num((prof as any).horse, 0),
          camel: num((prof as any).camel, 0),
        });
        setXp(num(prog.xp, 0));
        setXpMax(num(prog.xpMax, 100));
        const curSid =
          typeof prog.currentStationId === "string"
            ? normalizeStationId(prog.currentStationId)
            : "";
        setCurrentStationLabel(
          curSid
            ? (STATION_CONFIGS[curSid as keyof typeof STATION_CONFIGS]
                ?.region ?? curSid)
            : "—",
        );
        const rawDone = prog.doneStationIds;
        setDoneIds(
          Array.isArray(rawDone)
            ? rawDone.map((x) => normalizeStationId(String(x)))
            : [],
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

  const onSaveNickname = async () => {
    const next = nickname.trim();
    if (!userEmail || !next || next === initialNickname) return;
    setSavingNick(true);
    try {
      await updateNicknameForEmail(userEmail, next);
      setInitialNickname(next);
      onHeroSaved?.();
    } catch (e) {
      console.error(e);
    } finally {
      setSavingNick(false);
    }
  };

  const loadingLabel = useMemo(
    () => (lang === "mn" ? "Ачаалж байна…" : "Loading…"),
    [lang],
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

  const livestockRows = [
    { key: "sheep", icon: "🐑", label: lang === "mn" ? "Хонь" : "Sheep", value: livestock.sheep },
    { key: "goat", icon: "🐐", label: lang === "mn" ? "Ямаа" : "Goat", value: livestock.goat },
    { key: "cow", icon: "🐄", label: lang === "mn" ? "Үхэр" : "Cow", value: livestock.cow },
    { key: "horse", icon: "🐎", label: lang === "mn" ? "Адуу" : "Horse", value: livestock.horse },
    { key: "camel", icon: "🐫", label: lang === "mn" ? "Тэмээ" : "Camel", value: livestock.camel },
  ];
  const totalLivestock = livestockRows.reduce((sum, row) => sum + row.value, 0);

  return (
    <div className="space-y-4 pr-1">
      <div className="rounded-2xl border border-[color:var(--map-ui-border)] bg-[color-mix(in_srgb,var(--map-ui-base)_50%,transparent)] p-3.5 shadow-[0_14px_40px_-24px_rgba(0,0,0,0.5)]">
      <div className="flex flex-col sm:flex-row gap-3.5 items-center sm:items-start">
        <div className="shrink-0 h-20 w-20 rounded-full overflow-hidden border border-[color:var(--map-ui-border-bright)] shadow-[0_0_18px_rgba(212,175,55,0.22)]">
          <img
            src={heroImage || "/images/shikhikhutag.png"}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 text-center sm:text-left space-y-0.5 min-w-0">
          <h2 className="font-display text-lg tracking-wide text-foreground">
            {heroName}
          </h2>
          <p className="text-xs text-[color:var(--map-gold)]">{heroTitle}</p>
          <p className="text-[10px] font-mono text-muted-foreground truncate">
            {userEmail}
          </p>
          <div className="flex items-center gap-1.5 pt-1 justify-center sm:justify-start">
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value.slice(0, 36))}
              placeholder={lang === "mn" ? "Таны nickname" : "Your nickname"}
              className="h-7 w-full max-w-[230px] rounded-md border border-[color:var(--map-ui-border-subtle)] bg-background/75 px-2 text-[11px] text-foreground outline-none focus:border-[color:var(--map-ui-border-bright)]"
            />
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={
                savingNick || !nickname.trim() || nickname.trim() === initialNickname
              }
              onClick={() => void onSaveNickname()}
              className="h-7 px-2.5 text-[11px]"
            >
              {savingNick ? "…" : lang === "mn" ? "Хадгалах" : "Save"}
            </Button>
          </div>
          <p className="pt-1">
            <span className="inline-flex items-center rounded-full border border-[color:var(--map-ui-border-subtle)] bg-[color-mix(in_srgb,var(--map-ui-base)_56%,transparent)] px-2 py-0.5 text-[10px] text-muted-foreground">
              <span className="text-foreground/80 mr-1">{t.profileStationLabel}:</span>
              {currentStationLabel}
            </span>
          </p>
        </div>
        <div className="w-full sm:w-[19rem] space-y-1.5">
          <div className="grid grid-cols-3 gap-1.5">
            <div className="rounded-lg border border-[color:var(--map-ui-border-subtle)] p-2 text-center space-y-0.5 bg-[color-mix(in_srgb,var(--map-ui-base)_56%,transparent)]">
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground">
                {t.profileLevelLabel}
              </p>
              <p className="text-lg font-semibold tabular-nums leading-none">{level}</p>
            </div>
            <div className="rounded-lg border border-[color:var(--map-ui-border-subtle)] p-2 text-center space-y-0.5 bg-[color-mix(in_srgb,var(--map-ui-base)_56%,transparent)]">
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground">
                {t.profileXpLabel}
              </p>
              <p className="text-[11px] font-semibold tabular-nums leading-tight">
                {xp} / {xpMax}
              </p>
            </div>
            <div className="rounded-lg border border-[color:var(--map-ui-border-subtle)] p-2 text-center space-y-0.5 bg-[color-mix(in_srgb,var(--map-ui-base)_56%,transparent)]">
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground">
                {t.treasury}
              </p>
              <p className="text-lg font-semibold tabular-nums leading-none">{kp}</p>
            </div>
          </div>
          <div className="rounded-lg border border-[color:var(--map-ui-border-subtle)] bg-[color-mix(in_srgb,var(--map-ui-base)_52%,transparent)] p-2">
            <div className="mb-1 flex items-center justify-between">
              <h3 className="font-display text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
                {lang === "mn" ? "Таван хошуу мал" : "Livestock"}
              </h3>
              <span className="text-[10px] tabular-nums text-foreground/90">
                {lang === "mn" ? "Нийт" : "Total"}: {totalLivestock}
              </span>
            </div>
            <div className="h-16 overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-1 sm:grid-cols-5">
                {livestockRows.map((row) => (
                  <div
                    key={row.key}
                    className="rounded-md border border-[color:var(--map-ui-border-subtle)] bg-[color-mix(in_srgb,var(--map-ui-base)_60%,transparent)] px-1 py-1 text-center"
                  >
                    <p className="text-[12px] leading-none">{row.icon}</p>
                    <p className="mt-0.5 text-[9px] text-muted-foreground truncate">
                      {row.label}
                    </p>
                    <p className="text-[10px] font-semibold tabular-nums">{row.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>

      <section className="mb-4">
        <h3 className="font-display text-xs tracking-[0.15em] text-muted-foreground uppercase mb-2">
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

      <section className="space-y-2 border-t border-border pt-4">
        <h3 className="font-display text-xs tracking-[0.15em] text-muted-foreground uppercase">
          {t.profileChangeHeroTitle}
        </h3>
        <div className="flex items-center gap-2 justify-between px-4">
          <p className="text-[11px] text-muted-foreground leading-snug">
            {t.profileHeroOnCooldown}
          </p>
          <div
            className={cn(
              "rounded-xl border px-3 py-1 text-xs tabular-nums",
              cooldownMs > 0
                ? "border-amber-500/40 bg-amber-500/10 text-amber-200"
                : "border-primary/30 bg-primary/5",
            )}
          >
            <span className="text-muted-foreground text-[10px] uppercase tracking-wider">
              {t.profileHeroCooldownLabel}:{" "}
            </span>
            {formatCooldownHMS(cooldownMs, lang)}
          </div>
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
                  "rounded-lg border overflow-hidden text-left transition-all h-[180px] w-[140px]",
                  sel
                    ? "border-primary ring-2 ring-primary/40"
                    : "border-border hover:border-primary/50",
                  !h.available && "opacity-40 cursor-not-allowed",
                )}
              >
                <img
                  src={heroImageById(h.id) || h.imageUrl}
                  alt=""
                  className="w-full aspect-square object-cover h-[154px]"
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
