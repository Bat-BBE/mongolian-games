"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { LuBookMarked as BookMarked, LuRefreshCw as RefreshCw, LuSave as Save } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { useAdminAuth } from "@/components/admin/AdminAuthContext";
import {
  adminGetStationGames,
  adminListGames,
  adminListStations,
  adminPutStationGames,
  adminUpdateStation,
  type GameRow,
  type MapStationRow,
} from "@/lib/api";

export default function AdminStationsPage() {
  const { token } = useAdminAuth();
  const [stations, setStations] = useState<MapStationRow[]>([]);
  const [locale, setLocale] = useState<"mn" | "en">("mn");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [selectedSlug, setSelectedSlug] = useState<string>("");
  const [catalog, setCatalog] = useState<GameRow[]>([]);
  /** Эрэмбэ: эхний индекс = label/popup-д эхэнд харагдана. */
  const [orderedGameIds, setOrderedGameIds] = useState<string[]>([]);
  const [gamesBusy, setGamesBusy] = useState(false);
  const [stationBusy, setStationBusy] = useState(false);

  const load = useCallback(async () => {
    const t = token?.trim();
    if (!t) return;
    setLoading(true);
    setMsg(null);
    try {
      const [st, cat] = await Promise.all([adminListStations(t), adminListGames(t)]);
      const s = st.stations;
      setStations(s);
      setCatalog(cat.games);
      setSelectedSlug((prev) => prev || s[0]?.slug || "");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Ачаалахад алдаа");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const saveStation = async (slug: string, patch: Partial<MapStationRow>) => {
    const t = token?.trim();
    if (!t) return;
    setStationBusy(true);
    setMsg(null);
    try {
      await adminUpdateStation(t, slug, patch);
      setMsg("Өртөө хадгалагдлаа.");
      await load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Алдаа");
    } finally {
      setStationBusy(false);
    }
  };

  const selectedStation = useMemo(
    () => stations.find((s) => s.slug === selectedSlug) ?? null,
    [stations, selectedSlug]
  );

  useEffect(() => {
    const t = token?.trim();
    if (!t || !selectedSlug) return;
    let cancelled = false;
    setGamesBusy(true);
    void adminGetStationGames(t, selectedSlug)
      .then(({ games }) => {
        if (cancelled) return;
        setOrderedGameIds(games.map((g) => g.id));
      })
      .catch(() => {
        if (cancelled) return;
        setOrderedGameIds([]);
      })
      .finally(() => {
        if (cancelled) return;
        setGamesBusy(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, selectedSlug]);

  const addGame = (id: string) => {
    if (!id) return;
    setOrderedGameIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  const removeGame = (id: string) => {
    setOrderedGameIds((prev) => prev.filter((x) => x !== id));
  };

  const moveGame = (index: number, dir: -1 | 1) => {
    setOrderedGameIds((prev) => {
      const j = index + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[j]] = [next[j], next[index]];
      return next;
    });
  };

  const saveStationGames = async () => {
    const t = token?.trim();
    if (!t || !selectedSlug) return;
    setMsg(null);
    setGamesBusy(true);
    const ordered = orderedGameIds.filter((id) =>
      catalog.some((g) => g.id === id),
    );
    try {
      await adminPutStationGames(t, selectedSlug, ordered);
      setMsg("Өртөөний тоглоомууд хадгалагдлаа.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Алдаа");
    } finally {
      setGamesBusy(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8 pb-24 text-[var(--admin-text,#fafafa)]">
      <header className="space-y-2">
        <p className="text-[10px] uppercase tracking-[0.35em] text-[var(--admin-subtle)]">
          PostgreSQL
        </p>
        <h1 className="font-display text-2xl md:text-3xl tracking-wide flex items-center gap-2 text-[var(--admin-text)]">
          <BookMarked className="size-7 text-[var(--admin-muted)] stroke-[1.5]" />
          Өртөөнүүд
        </h1>
        <p className="text-sm text-[var(--admin-muted)] max-w-2xl leading-relaxed">
          Тоглоомын дарааллыг доорх жагсаалаар тохируулна — эхнийх нь газрын зурагны шошго, popup-д эхэлж гарна. Quest нь sidebar текст.
        </p>
        <div className="flex flex-wrap gap-2 items-center pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2 border-[var(--admin-border)] text-[var(--admin-muted)]"
            disabled={loading}
            onClick={() => void load()}
          >
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
            Сэргээх
          </Button>
          <div className="flex rounded-lg border border-[var(--admin-border)] overflow-hidden text-xs">
            <button
              type="button"
              className={`px-3 py-1.5 ${locale === "mn" ? "bg-white/10 text-white" : "text-[var(--admin-muted)]"}`}
              onClick={() => setLocale("mn")}
            >
              MN
            </button>
            <button
              type="button"
              className={`px-3 py-1.5 ${locale === "en" ? "bg-white/10 text-white" : "text-[var(--admin-muted)]"}`}
              onClick={() => setLocale("en")}
            >
              EN
            </button>
          </div>
        </div>
      </header>

      {msg && (
        <div className="admin-panel-elevated px-4 py-3 text-sm text-[var(--admin-text)]">
          {msg}
        </div>
      )}

      <section className="grid lg:grid-cols-5 gap-4 items-start">
        <div className="lg:col-span-3 admin-panel overflow-x-auto">
          <table className="w-full text-sm text-left min-w-[860px]">
            <thead>
              <tr className="border-b border-[var(--admin-border)] text-[10px] uppercase tracking-wider text-[var(--admin-subtle,#737373)]">
                <th className="p-3">#</th>
                <th className="p-3">Slug</th>
                <th className="p-3">Нэр</th>
                <th className="p-3">Бүс</th>
                <th className="p-3">Quest</th>
              </tr>
            </thead>
            <tbody>
              {stations.map((s) => {
                const active = s.slug === selectedSlug;
                const name = locale === "mn" ? s.name_mn : s.name_en;
                const region = locale === "mn" ? s.region_mn : s.region_en;
                const questTitle = locale === "mn" ? s.quest_hint_mn : s.quest_hint_en;
                return (
                  <tr
                    key={s.slug}
                    className={`border-b border-[var(--admin-border)] hover:bg-white/[0.04] cursor-pointer ${active ? "bg-white/[0.06]" : ""}`}
                    onClick={() => setSelectedSlug(s.slug)}
                  >
                    <td className="p-3 text-xs text-[var(--admin-subtle)] tabular-nums">
                      {(s.journey_index ?? 0) + 1}
                    </td>
                    <td className="p-3 font-mono text-xs text-[var(--admin-muted)]">{s.slug}</td>
                    <td className="p-3 text-[var(--admin-text)] whitespace-nowrap">{name}</td>
                    <td className="p-3 text-[var(--admin-muted)] whitespace-nowrap">{region}</td>
                    <td className="p-3 text-[var(--admin-muted)] text-xs max-w-[360px] truncate" title={questTitle ?? ""}>
                      {questTitle?.trim() ? questTitle : "—"}
                    </td>
                  </tr>
                );
              })}
              {stations.length === 0 && !loading && (
                <tr>
                  <td className="p-8 text-center text-[var(--admin-muted)] text-sm" colSpan={5}>
                    Өртөө олдсонгүй.
                  </td>
                </tr>
              )}
              {loading && stations.length === 0 && (
                <tr>
                  <td className="p-8 text-center text-[var(--admin-muted)] text-sm" colSpan={5}>
                    Ачаалж байна…
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="lg:col-span-2 admin-panel p-4 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--admin-subtle,#737373)]">Сонгосон өртөө</p>
              <p className="font-display text-lg text-[var(--admin-text,#fafafa)]">
                {selectedStation ? (locale === "mn" ? selectedStation.name_mn : selectedStation.name_en) : "—"}
              </p>
              <p className="text-xs text-[var(--admin-muted)] font-mono">{selectedStation?.slug ?? ""}</p>
            </div>
          </div>

          {!selectedStation ? (
            <p className="text-sm text-[var(--admin-muted)]">Засах өртөөг хүснэгтээс сонгоно уу.</p>
          ) : (
            <StationDetailEditor
              station={selectedStation}
              locale={locale}
              saving={stationBusy}
              onSave={(patch) => void saveStation(selectedStation.slug, patch)}
            />
          )}

          {selectedStation ? (
            <div className="pt-2 border-t border-[var(--admin-border)] space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--admin-subtle,#737373)]">Тоглоомууд — эрэмбэ</p>
                  <p className="text-xs text-[var(--admin-muted)]">
                    Дараалал: 1 = эхний шошго/тоглоом. Дээш/доош дарж солино.
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="gap-1.5 shrink-0 border-[var(--admin-border)] bg-[var(--admin-elevated)]"
                  disabled={gamesBusy || !selectedSlug}
                  onClick={() => void saveStationGames()}
                >
                  <Save className="size-3.5 stroke-[1.5]" />
                  Хадгалах
                </Button>
              </div>

              {gamesBusy ? (
                <p className="text-xs text-[var(--admin-muted)]">Ачаалж байна…</p>
              ) : (
                <div className="space-y-3">
                  <ol className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1">
                    {orderedGameIds.map((id, idx) => {
                      const g = catalog.find((c) => c.id === id);
                      if (!g) return null;
                      return (
                        <li
                          key={id}
                          className="flex items-center gap-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-elevated)] px-2 py-2"
                        >
                          <span className="w-6 text-center text-[10px] tabular-nums text-[var(--admin-subtle)]">
                            {idx + 1}
                          </span>
                          <div className="flex-1 min-w-0 text-xs text-[var(--admin-text)]">
                            <span className="font-mono text-[10px] text-[var(--admin-subtle)] block truncate">
                              {g.slug}
                            </span>
                            <span className="leading-snug">
                              {locale === "mn" ? g.name_mn : g.name_en}
                            </span>
                          </div>
                          <div className="flex items-center gap-0.5 shrink-0">
                            <button
                              type="button"
                              className="h-7 w-7 rounded border border-[var(--admin-border)] text-[var(--admin-muted)] hover:bg-white/5 disabled:opacity-30"
                              disabled={idx === 0}
                              onClick={() => moveGame(idx, -1)}
                              aria-label="Дээш"
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              className="h-7 w-7 rounded border border-[var(--admin-border)] text-[var(--admin-muted)] hover:bg-white/5 disabled:opacity-30"
                              disabled={idx >= orderedGameIds.length - 1}
                              onClick={() => moveGame(idx, 1)}
                              aria-label="Доош"
                            >
                              ↓
                            </button>
                            <button
                              type="button"
                              className="h-7 px-2 rounded border border-[var(--admin-border)] text-[var(--admin-muted)] hover:bg-white/5 text-xs"
                              onClick={() => removeGame(id)}
                            >
                              Хасах
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                  <div>
                    <label className="text-[10px] uppercase tracking-[0.2em] text-[var(--admin-subtle)] block mb-1">
                      Тоглоом нэмэх
                    </label>
                    <select
                      className="w-full rounded-lg border border-[var(--admin-border)] bg-[var(--admin-elevated)] px-2 py-2 text-xs text-[var(--admin-text)]"
                      defaultValue=""
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v) addGame(v);
                        e.target.value = "";
                      }}
                    >
                      <option value="">— Сонгох —</option>
                      {catalog
                        .filter((g) => !orderedGameIds.includes(g.id))
                        .map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.slug} · {locale === "mn" ? g.name_mn : g.name_en}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function StationDetailEditor({
  station,
  locale,
  saving,
  onSave,
}: {
  station: MapStationRow;
  locale: "mn" | "en";
  saving: boolean;
  onSave: (patch: Partial<MapStationRow>) => void;
}) {
  const [nameMn, setNameMn] = useState(station.name_mn);
  const [nameEn, setNameEn] = useState(station.name_en);
  const [regionMn, setRegionMn] = useState(station.region_mn);
  const [regionEn, setRegionEn] = useState(station.region_en);
  const [icon, setIcon] = useState(station.icon ?? "📍");
  const [journeyIndex, setJourneyIndex] = useState<number>(station.journey_index ?? 0);

  const [questTitle, setQuestTitle] = useState(
    locale === "mn" ? station.quest_hint_mn ?? "" : station.quest_hint_en ?? ""
  );
  const [questDesc, setQuestDesc] = useState(
    locale === "mn" ? station.quest_desc_mn ?? "" : station.quest_desc_en ?? ""
  );

  useEffect(() => {
    setNameMn(station.name_mn);
    setNameEn(station.name_en);
    setRegionMn(station.region_mn);
    setRegionEn(station.region_en);
    setIcon(station.icon ?? "📍");
    setJourneyIndex(station.journey_index ?? 0);
  }, [station]);

  useEffect(() => {
    setQuestTitle(locale === "mn" ? station.quest_hint_mn ?? "" : station.quest_hint_en ?? "");
    setQuestDesc(locale === "mn" ? station.quest_desc_mn ?? "" : station.quest_desc_en ?? "");
  }, [station, locale]);

  const saveAll = () => {
    const basePatch: Partial<MapStationRow> = {
      name_mn: nameMn,
      name_en: nameEn,
      region_mn: regionMn,
      region_en: regionEn,
      icon,
      journey_index: Number.isFinite(journeyIndex) ? journeyIndex : station.journey_index,
    };
    const questPatch: Partial<MapStationRow> =
      locale === "mn"
        ? { quest_hint_mn: questTitle, quest_desc_mn: questDesc }
        : { quest_hint_en: questTitle, quest_desc_en: questDesc };
    onSave({ ...basePatch, ...questPatch });
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--admin-subtle)] mb-1">Нэр (MN)</p>
          <input
            className="w-full rounded-lg border border-[var(--admin-border)] bg-[var(--admin-elevated)] px-2 py-1.5 text-xs text-[var(--admin-text)]"
            value={nameMn}
            onChange={(e) => setNameMn(e.target.value)}
          />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--admin-subtle)] mb-1">Нэр (EN)</p>
          <input
            className="w-full rounded-lg border border-[var(--admin-border)] bg-[var(--admin-elevated)] px-2 py-1.5 text-xs text-[var(--admin-text)]"
            value={nameEn}
            onChange={(e) => setNameEn(e.target.value)}
          />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--admin-subtle)] mb-1">Бүс (MN)</p>
          <input
            className="w-full rounded-lg border border-[var(--admin-border)] bg-[var(--admin-elevated)] px-2 py-1.5 text-xs text-[var(--admin-text)]"
            value={regionMn}
            onChange={(e) => setRegionMn(e.target.value)}
          />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--admin-subtle)] mb-1">Бүс (EN)</p>
          <input
            className="w-full rounded-lg border border-[var(--admin-border)] bg-[var(--admin-elevated)] px-2 py-1.5 text-xs text-[var(--admin-text)]"
            value={regionEn}
            onChange={(e) => setRegionEn(e.target.value)}
          />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--admin-subtle)] mb-1">Icon</p>
          <input
            className="w-full rounded-lg border border-[var(--admin-border)] bg-[var(--admin-elevated)] px-2 py-1.5 text-xs text-[var(--admin-text)]"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            placeholder="🏙️"
          />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--admin-subtle)] mb-1">Journey index</p>
          <input
            type="number"
            className="w-full rounded-lg border border-[var(--admin-border)] bg-[var(--admin-elevated)] px-2 py-1.5 text-xs font-mono text-[var(--admin-text)]"
            value={journeyIndex}
            onChange={(e) => setJourneyIndex(Number(e.target.value))}
          />
        </div>
      </div>

      <div>
        <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--admin-subtle)] mb-1">
          Quest title ({locale.toUpperCase()})
        </p>
        <textarea
          className="w-full min-h-[56px] rounded-lg border border-[var(--admin-border)] bg-[var(--admin-elevated)] px-2 py-1.5 text-xs text-[var(--admin-text)]"
          value={questTitle}
          onChange={(e) => setQuestTitle(e.target.value)}
        />
      </div>

      <div>
        <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--admin-subtle)] mb-1">
          Quest description ({locale.toUpperCase()})
        </p>
        <textarea
          className="w-full min-h-[88px] rounded-lg border border-[var(--admin-border)] bg-[var(--admin-elevated)] px-2 py-1.5 text-xs text-[var(--admin-text)]"
          value={questDesc}
          onChange={(e) => setQuestDesc(e.target.value)}
        />
      </div>

      <div className="flex justify-end">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="gap-1.5 border-[var(--admin-border)] bg-[var(--admin-elevated)]"
          disabled={saving}
          onClick={() => saveAll()}
        >
          <Save className="size-3.5" />
          Хадгалах
        </Button>
      </div>
    </div>
  );
}

