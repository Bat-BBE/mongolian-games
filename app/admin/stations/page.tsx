"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  LuBookMarked as BookMarked,
  LuRefreshCw as RefreshCw,
  LuSave as Save,
} from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { useAdminAuth } from "@/components/admin/AdminAuthContext";
import {
  adminGetStationGames,
  adminListGames,
  adminListStations,
  adminPutStationGames,
  adminUpdateStation,
  adminUploadStationImage,
  resolveAssetUrl,
  type GameRow,
  type MapStationRow,
} from "@/lib/api";

export default function AdminStationsPage() {
  const { token } = useAdminAuth();
  const [stations, setStations] = useState<MapStationRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [selectedSlug, setSelectedSlug] = useState<string>("");
  const [catalog, setCatalog] = useState<GameRow[]>([]);
  const [orderedGameIds, setOrderedGameIds] = useState<string[]>([]);
  const [gamesBusy, setGamesBusy] = useState(false);
  const [stationBusy, setStationBusy] = useState(false);

  const load = useCallback(async () => {
    const t = token?.trim();
    if (!t) return;
    setLoading(true);
    setMsg(null);
    try {
      const [st, cat] = await Promise.all([
        adminListStations(t),
        adminListGames(t),
      ]);
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
    [stations, selectedSlug],
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
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          {/* <p className="text-[10px] uppercase tracking-[0.35em] text-[var(--admin-subtle)]">
            Өртөө
          </p> */}
          <h1 className="font-display text-2xl md:text-3xl tracking-wide flex items-center gap-2 text-[var(--admin-text)]">
            Өртөөнүүд
          </h1>
          {/* <p className="text-sm text-[var(--admin-muted)] max-w-2xl leading-relaxed">
            Тоглоомын дарааллыг доорх жагсаалаар тохируулна — эхнийх нь газрын
            зурагны шошго, popup-д эхэлж гарна. Quest нь sidebar текст.
          </p> */}
        </div>
        <Button
          type="button"
          variant="default"
          size="sm"
          className="gap-2 border-[var(--admin-border)] text-white hover:border-[var(--admin-text)]"
          disabled={loading}
          onClick={() => void load()}
        >
          <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          Шинэчлэх
        </Button>
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
                <th className="p-3">Түлхүүр</th>
                <th className="p-3">Нэр</th>
                <th className="p-3">Бүс</th>
                <th className="p-3">Quest</th>
              </tr>
            </thead>
            <tbody>
              {stations.map((s) => {
                const active = s.slug === selectedSlug;
                const name = s.name_mn;
                const region = s.region_mn;
                const questTitle = s.quest_hint_mn;
                return (
                  <tr
                    key={s.slug}
                    className={`border-b border-[var(--admin-border)] hover:bg-white/[0.04] cursor-pointer ${active ? "bg-white/[0.06]" : ""}`}
                    onClick={() => setSelectedSlug(s.slug)}
                  >
                    <td className="p-3 text-xs text-[var(--admin-subtle)] tabular-nums">
                      {(s.journey_index ?? 0) + 1}
                    </td>
                    <td className="p-3 font-mono text-xs text-[var(--admin-muted)]">
                      {s.slug}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <div className="text-[var(--admin-text)]">{name}</div>
                      <div className="text-[var(--admin-muted)] text-xs">
                        {s.name_en}
                      </div>
                    </td>
                    <td className="p-3 text-[var(--admin-muted)] whitespace-nowrap">
                      <div className="text-[var(--admin-text)]">{region}</div>
                      <div className="text-[var(--admin-muted)] text-xs">
                        {s.region_en}
                      </div>
                    </td>
                    <td
                      className="p-3 text-[var(--admin-muted)] text-xs max-w-[360px] truncate"
                      title={questTitle ?? ""}
                    >
                      {questTitle?.trim() ? questTitle : "—"}
                    </td>
                  </tr>
                );
              })}
              {stations.length === 0 && !loading && (
                <tr>
                  <td
                    className="p-8 text-center text-[var(--admin-muted)] text-sm"
                    colSpan={5}
                  >
                    Өртөө олдсонгүй.
                  </td>
                </tr>
              )}
              {loading && stations.length === 0 && (
                <tr>
                  <td
                    className="p-8 text-center text-[var(--admin-muted)] text-sm"
                    colSpan={5}
                  >
                    Ачаалж байна…
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="lg:col-span-2 admin-panel p-4 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex gap-1 items-start flex-col">
              <p className="text-[9px] uppercase tracking-[0.28em] text-[var(--admin-subtle,#737373)]">
                Өртөөний дэлгэрэнгүй
              </p>
              <p className="font-display text-lg text-[var(--admin-text,#fafafa)]">
                {selectedStation ? selectedStation.name_mn : "—"}
              </p>
              {/* <p className="text-xs text-[var(--admin-muted)] font-mono">
                {selectedStation?.slug ?? ""}
              </p> */}
            </div>
          </div>

          {!selectedStation ? (
            <p className="text-sm text-[var(--admin-muted)]">
              Засах өртөөг хүснэгтээс сонгоно уу.
            </p>
          ) : (
            <StationDetailEditor
              station={selectedStation}
              saving={stationBusy}
              token={token ?? ""}
              onReload={() => void load()}
              onSave={(patch) => void saveStation(selectedStation.slug, patch)}
            />
          )}

          {selectedStation ? (
            <div className="pt-2 border-t border-[var(--admin-border)] space-y-3 mt-4 flex flex-col">
              <div className="flex flex-col items-start gap-1">
                <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--admin-subtle,#737373)]">
                  Тоглоом тохируулах
                </p>
                <p className="text-[10px] text-[var(--admin-muted)]">
                  Дараалал: 1 = эхний шошго/тоглоом. Дээш/доош дарж солино.
                </p>
              </div>

              {gamesBusy ? (
                <p className="text-xs text-[var(--admin-muted)]">
                  Ачаалж байна…
                </p>
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
                            <span className="leading-snug">{g.name_mn}</span>
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
                            {g.slug} · {g.name_mn}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              )}
              <Button
                type="button"
                size="sm"
                variant="default"
                disabled={gamesBusy || !selectedSlug}
                onClick={() => void saveStationGames()}
              >
                Хадгалах
              </Button>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function StationDetailEditor({
  station,
  saving,
  token,
  onReload,
  onSave,
}: {
  station: MapStationRow;
  saving: boolean;
  token: string;
  onReload: () => void;
  onSave: (patch: Partial<MapStationRow>) => void;
}) {
  const [nameMn, setNameMn] = useState(station.name_mn);
  const [nameEn, setNameEn] = useState(station.name_en);
  const [regionMn, setRegionMn] = useState(station.region_mn);
  const [regionEn, setRegionEn] = useState(station.region_en);
  const [icon, setIcon] = useState(station.icon ?? "📍");
  const [imageUrl, setImageUrl] = useState(station.image_url ?? "");
  const [imageBusy, setImageBusy] = useState(false);
  const [journeyIndex, setJourneyIndex] = useState<number>(
    station.journey_index ?? 0,
  );

  const [questTitleMn, setQuestTitleMn] = useState(station.quest_hint_mn ?? "");
  const [questTitleEn, setQuestTitleEn] = useState(station.quest_hint_en ?? "");
  const [questDescMn, setQuestDescMn] = useState(station.quest_desc_mn ?? "");
  const [questDescEn, setQuestDescEn] = useState(station.quest_desc_en ?? "");

  useEffect(() => {
    setNameMn(station.name_mn);
    setNameEn(station.name_en);
    setRegionMn(station.region_mn);
    setRegionEn(station.region_en);
    setIcon(station.icon ?? "📍");
    setImageUrl(station.image_url ?? "");
    setJourneyIndex(station.journey_index ?? 0);
  }, [station]);

  useEffect(() => {
    setQuestTitleMn(station.quest_hint_mn ?? "");
    setQuestTitleEn(station.quest_hint_en ?? "");
    setQuestDescMn(station.quest_desc_mn ?? "");
    setQuestDescEn(station.quest_desc_en ?? "");
  }, [station]);

  const saveAll = () => {
    const basePatch: Partial<MapStationRow> = {
      name_mn: nameMn,
      name_en: nameEn,
      region_mn: regionMn,
      region_en: regionEn,
      icon,
      image_url: imageUrl.trim() ? imageUrl.trim() : null,
      journey_index: Number.isFinite(journeyIndex)
        ? journeyIndex
        : station.journey_index,
    };
    onSave({
      ...basePatch,
      quest_hint_mn: questTitleMn,
      quest_hint_en: questTitleEn,
      quest_desc_mn: questDescMn,
      quest_desc_en: questDescEn,
    });
  };

  const onPickStationImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    const t = token?.trim();
    if (!f || !t) return;
    setImageBusy(true);
    try {
      await adminUploadStationImage(t, station.slug, f);
      onReload();
    } catch {
      /* toast optional */
    } finally {
      setImageBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--admin-subtle)] mb-1">
            Нэр
          </p>
          <input
            className="w-full rounded-lg border border-[var(--admin-border)] bg-[var(--admin-elevated)] px-2 py-1.5 text-xs text-[var(--admin-text)]"
            value={nameMn}
            onChange={(e) => setNameMn(e.target.value)}
          />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--admin-subtle)] mb-1">
            Нэр (EN)
          </p>
          <input
            className="w-full rounded-lg border border-[var(--admin-border)] bg-[var(--admin-elevated)] px-2 py-1.5 text-xs text-[var(--admin-text)]"
            value={nameEn}
            onChange={(e) => setNameEn(e.target.value)}
          />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--admin-subtle)] mb-1">
            Бүс
          </p>
          <input
            className="w-full rounded-lg border border-[var(--admin-border)] bg-[var(--admin-elevated)] px-2 py-1.5 text-xs text-[var(--admin-text)]"
            value={regionMn}
            onChange={(e) => setRegionMn(e.target.value)}
          />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--admin-subtle)] mb-1">
            Бүс (EN)
          </p>
          <input
            className="w-full rounded-lg border border-[var(--admin-border)] bg-[var(--admin-elevated)] px-2 py-1.5 text-xs text-[var(--admin-text)]"
            value={regionEn}
            onChange={(e) => setRegionEn(e.target.value)}
          />
        </div>
        <div className="col-span-2 space-y-2">
          <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--admin-subtle)] mb-1">
            Зураг (газрын зурагны шошго)
          </p>
          <p className="text-[10px] text-[var(--admin-muted)] mb-1">
            Оруулсан тохиолдолд emoji-г орлож харуулна. Файл эсвэл доорх зам.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <label className="cursor-pointer text-xs px-2 py-1.5 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-elevated)] hover:bg-white/5 text-[var(--admin-text)]">
              {imageBusy ? "…" : "Файл оруулах"}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                disabled={imageBusy || saving}
                onChange={(e) => void onPickStationImage(e)}
              />
            </label>
            {imageUrl.trim() ? (
              <button
                type="button"
                className="text-xs px-2 py-1 rounded border border-[var(--admin-border)] text-[var(--admin-muted)] hover:bg-white/5"
                onClick={() => setImageUrl("")}
              >
                Зургийг авах
              </button>
            ) : null}
          </div>
          <input
            className="w-full rounded-lg border border-[var(--admin-border)] bg-[var(--admin-elevated)] px-2 py-1.5 text-xs text-[var(--admin-text)] font-mono"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="/uploads/stations/… эсвэл бүрэн URL"
          />
          {imageUrl.trim() ? (
            <div className="flex items-center gap-2 mt-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resolveAssetUrl(imageUrl.trim())}
                alt=""
                className="h-14 w-14 rounded-lg object-cover border border-[var(--admin-border)]"
              />
            </div>
          ) : null}
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--admin-subtle)] mb-1">
            Икон (fallback)
          </p>
          <input
            className="w-full rounded-lg border border-[var(--admin-border)] bg-[var(--admin-elevated)] px-2 py-1.5 text-xs text-[var(--admin-text)]"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            placeholder="🏙️"
          />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--admin-subtle)] mb-1">
            Эрэмбэ
          </p>
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
          Quest гарчиг (MN)
        </p>
        <textarea
          className="w-full min-h-[56px] rounded-lg border border-[var(--admin-border)] bg-[var(--admin-elevated)] px-2 py-1.5 text-xs text-[var(--admin-text)]"
          value={questTitleMn}
          onChange={(e) => setQuestTitleMn(e.target.value)}
        />
      </div>

      <div>
        <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--admin-subtle)] mb-1">
          Quest гарчиг (EN)
        </p>
        <textarea
          className="w-full min-h-[56px] rounded-lg border border-[var(--admin-border)] bg-[var(--admin-elevated)] px-2 py-1.5 text-xs text-[var(--admin-text)]"
          value={questTitleEn}
          onChange={(e) => setQuestTitleEn(e.target.value)}
        />
      </div>

      <div>
        <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--admin-subtle)] mb-1">
          Quest тайлбар (MN)
        </p>
        <textarea
          className="w-full min-h-[88px] rounded-lg border border-[var(--admin-border)] bg-[var(--admin-elevated)] px-2 py-1.5 text-xs text-[var(--admin-text)]"
          value={questDescMn}
          onChange={(e) => setQuestDescMn(e.target.value)}
        />
      </div>

      <div>
        <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--admin-subtle)] mb-1">
          Quest тайлбар (EN)
        </p>
        <textarea
          className="w-full min-h-[88px] rounded-lg border border-[var(--admin-border)] bg-[var(--admin-elevated)] px-2 py-1.5 text-xs text-[var(--admin-text)]"
          value={questDescEn}
          onChange={(e) => setQuestDescEn(e.target.value)}
        />
      </div>

      <div className="flex justify-end">
        <Button
          type="button"
          size="sm"
          variant="default"
          disabled={saving}
          onClick={() => saveAll()}
        >
          Хадгалах
        </Button>
      </div>
    </div>
  );
}
