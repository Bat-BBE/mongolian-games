"use client";

import { useCallback, useEffect, useState } from "react";
import { BookMarked, RefreshCw, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAdminAuth } from "@/components/admin/AdminAuthContext";
import {
  adminGetStationGames,
  adminListGames,
  adminListHeroes,
  adminListStations,
  adminListUiStrings,
  adminPutStationGames,
  adminPutUiString,
  adminUpdateHero,
  adminUpdateStation,
  type GameRow,
  type HeroRow,
  type MapStationRow,
  type UiStringRow,
} from "@/lib/api";

export default function AdminContentPage() {
  const { token } = useAdminAuth();
  const [heroes, setHeroes] = useState<HeroRow[]>([]);
  const [stations, setStations] = useState<MapStationRow[]>([]);
  const [strings, setStrings] = useState<UiStringRow[]>([]);
  const [locale, setLocale] = useState<"mn" | "en">("mn");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const t = token?.trim();
    if (!t) return;
    setLoading(true);
    setMsg(null);
    try {
      const [{ heroes: h }, { stations: s }, { strings: str }] = await Promise.all([
        adminListHeroes(t),
        adminListStations(t),
        adminListUiStrings(t, locale),
      ]);
      setHeroes(h);
      setStations(s);
      setStrings(str);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Ачаалахад алдаа");
    } finally {
      setLoading(false);
    }
  }, [token, locale]);

  useEffect(() => {
    void load();
  }, [load]);

  const saveHero = async (slug: string, patch: Partial<HeroRow>) => {
    const t = token?.trim();
    if (!t) return;
    setMsg(null);
    try {
      await adminUpdateHero(t, slug, patch);
      setMsg("Баатар хадгалагдлаа.");
      await load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Алдаа");
    }
  };

  const saveStation = async (slug: string, patch: Partial<MapStationRow>) => {
    const t = token?.trim();
    if (!t) return;
    setMsg(null);
    try {
      await adminUpdateStation(t, slug, patch);
      setMsg("Өртөө хадгалагдлаа.");
      await load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Алдаа");
    }
  };

  const saveString = async (row: UiStringRow, value: string) => {
    const t = token?.trim();
    if (!t) return;
    if (value === row.value) return;
    setMsg(null);
    try {
      await adminPutUiString(t, {
        key: row.key,
        locale: row.locale as "mn" | "en",
        value,
      });
      setMsg("Текст шинэчлэгдлээ.");
      await load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Алдаа");
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-10 pb-24">
      <header className="space-y-2">
        <p className="text-[10px] uppercase tracking-[0.35em] text-[var(--gold-bright)] opacity-80">
          PostgreSQL
        </p>
        <h1 className="font-display text-2xl md:text-3xl text-slate-100 tracking-wide flex items-center gap-2">
          <BookMarked className="size-7 text-[var(--gold-bright)]" strokeWidth={1.5} />
          Контент баатар · уртуу · sidebar
        </h1>
        <p className="text-sm text-slate-500 max-w-2xl leading-relaxed">
          Home sidebar текст, баатарын зэрэг (C, B…), нэр, ур чадварын статистик, өртөөний даалгаврын
          товч текстийг эндээс засна. Хэрэглэгчийн аяллын өдөр, одоогийн уртуу нь{" "}
          <code className="text-xs text-slate-400">app_users.progress</code> болон эндхийн өгөгдлөөс
          уншигдана.
        </p>
        <div className="flex flex-wrap gap-2 items-center pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2 border-white/15"
            disabled={loading}
            onClick={() => void load()}
          >
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
            Сэргээх
          </Button>
          <div className="flex rounded-lg border border-white/10 overflow-hidden text-xs">
            <button
              type="button"
              className={`px-3 py-1.5 ${locale === "mn" ? "bg-amber-950/40 text-[var(--gold-bright)]" : "text-slate-400"}`}
              onClick={() => setLocale("mn")}
            >
              MN
            </button>
            <button
              type="button"
              className={`px-3 py-1.5 ${locale === "en" ? "bg-amber-950/40 text-[var(--gold-bright)]" : "text-slate-400"}`}
              onClick={() => setLocale("en")}
            >
              EN
            </button>
          </div>
        </div>
      </header>

      {msg && (
        <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/25 px-4 py-3 text-sm text-emerald-100/95">
          {msg}
        </div>
      )}

      <section className="space-y-4">
        <h2 className="font-display text-sm tracking-[0.2em] text-slate-400 uppercase">Баатрууд</h2>
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-zinc-950/40">
          <table className="w-full text-sm text-left min-w-[720px]">
            <thead>
              <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-slate-500">
                <th className="p-3">Slug</th>
                <th className="p-3">Нэр (MN)</th>
                <th className="p-3">Нэр (EN)</th>
                <th className="p-3">Зэрэг</th>
                <th className="p-3">Bonus</th>
                <th className="p-3 w-28" />
              </tr>
            </thead>
            <tbody>
              {heroes.map((h) => (
                <HeroEditRow key={h.id} hero={h} onSave={saveHero} />
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-sm tracking-[0.2em] text-slate-400 uppercase">
          Уртуу (даалгаврын товч)
        </h2>
        <p className="text-xs text-slate-500">
          Бүх уртуу — доорх хэсгээс өртөө бүрт тоглоом холбоно.
        </p>
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-zinc-950/40">
          <table className="w-full text-sm text-left min-w-[640px]">
            <thead>
              <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-slate-500">
                <th className="p-3">Slug</th>
                <th className="p-3">quest_hint (MN)</th>
                <th className="p-3">quest_hint (EN)</th>
                <th className="p-3 w-24" />
              </tr>
            </thead>
            <tbody>
              {stations.map((s) => (
                <StationEditRow key={s.slug} station={s} onSave={saveStation} />
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <StationGamesLinker
        token={token?.trim() ?? ""}
        stations={stations}
        locale={locale}
        onMsg={setMsg}
      />

      <section className="space-y-4">
        <h2 className="font-display text-sm tracking-[0.2em] text-slate-400 uppercase">
          Sidebar текст ({locale.toUpperCase()})
        </h2>
        <div className="rounded-2xl border border-white/10 bg-zinc-950/40 divide-y divide-white/5">
          {strings.map((row) => (
            <StringEditRow key={`${row.key}-${row.locale}`} row={row} onSave={saveString} />
          ))}
        </div>
        {strings.length === 0 && !loading && (
          <p className="text-sm text-slate-500">Текст олдсонгүй. Миграци ажилласан эсэхийг шалгана уу.</p>
        )}
      </section>
    </div>
  );
}

function StationGamesLinker({
  token,
  stations,
  locale,
  onMsg,
}: {
  token: string;
  stations: MapStationRow[];
  locale: "mn" | "en";
  onMsg: (msg: string | null) => void;
}) {
  const [slug, setSlug] = useState(stations[0]?.slug ?? "");
  const [catalog, setCatalog] = useState<GameRow[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    void adminListGames(token)
      .then(({ games }) => {
        if (!cancelled) setCatalog(games);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (!stations.length) return;
    setSlug((s) => s || stations[0].slug);
  }, [stations]);

  useEffect(() => {
    if (!token || !slug) return;
    let cancelled = false;
    setBusy(true);
    void adminGetStationGames(token, slug)
      .then(({ games }) => {
        if (!cancelled) setSelected(new Set(games.map((g) => g.id)));
      })
      .catch(() => {
        if (!cancelled) setSelected(new Set());
      })
      .finally(() => {
        if (!cancelled) setBusy(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, slug]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const save = async () => {
    if (!token || !slug) return;
    onMsg(null);
    const ordered = catalog
      .filter((g) => selected.has(g.id))
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((g) => g.id);
    try {
      await adminPutStationGames(token, slug, ordered);
      onMsg("Өртөөний тоглоомууд хадгалагдлаа.");
    } catch (e) {
      onMsg(e instanceof Error ? e.message : "Алдаа");
    }
  };

  if (!token) return null;

  return (
    <section className="space-y-4">
      <h2 className="font-display text-sm tracking-[0.2em] text-slate-400 uppercase">
        Өртөө ↔ тоглоом
      </h2>
      <p className="text-xs text-slate-500 max-w-2xl">
        Каталогийн тоглоомыг сонгож тухайн уртuuт холбоно. Эрэмбэ нь каталогийн дараалалаар хадгалагдана.
      </p>
      <div className="rounded-2xl border border-white/10 bg-zinc-950/40 p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <label className="text-xs text-slate-400 shrink-0">Өртөө</label>
          <select
            className="flex-1 bg-zinc-900/80 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          >
            {stations.map((s) => (
              <option key={s.slug} value={s.slug}>
                {locale === "mn" ? s.name_mn : s.name_en} ({s.slug})
              </option>
            ))}
          </select>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="gap-1.5 shrink-0"
            disabled={busy || !slug}
            onClick={() => void save()}
          >
            <Save className="size-3.5" />
            Хадгалах
          </Button>
        </div>
        {busy ? (
          <p className="text-xs text-slate-500">Ачаалж байна…</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-2 max-h-[320px] overflow-y-auto pr-1">
            {catalog.map((g) => (
              <label
                key={g.id}
                className="flex items-start gap-2 rounded-lg border border-white/10 bg-zinc-900/40 px-3 py-2 cursor-pointer hover:border-primary/30"
              >
                <input
                  type="checkbox"
                  className="mt-1 rounded border-white/20"
                  checked={selected.has(g.id)}
                  onChange={() => toggle(g.id)}
                />
                <span className="text-xs text-slate-300 leading-snug">
                  <span className="font-mono text-[10px] text-slate-500">{g.slug}</span>
                  <br />
                  {locale === "mn" ? g.name_mn : g.name_en}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function HeroEditRow({
  hero,
  onSave,
}: {
  hero: HeroRow;
  onSave: (slug: string, p: Partial<HeroRow>) => void;
}) {
  const [nameMn, setNameMn] = useState(hero.name_mn);
  const [nameEn, setNameEn] = useState(hero.name_en);
  const [tier, setTier] = useState(hero.tier);
  const [bonus, setBonus] = useState(hero.bonus_multiplier);
  useEffect(() => {
    setNameMn(hero.name_mn);
    setNameEn(hero.name_en);
    setTier(hero.tier);
    setBonus(hero.bonus_multiplier);
  }, [hero]);
  return (
    <tr className="border-b border-white/5 hover:bg-white/[0.03]">
      <td className="p-3 font-mono text-xs text-slate-400">{hero.slug}</td>
      <td className="p-2">
        <input
          className="w-full bg-zinc-900/80 border border-white/10 rounded px-2 py-1 text-slate-200 text-xs"
          value={nameMn}
          onChange={(e) => setNameMn(e.target.value)}
        />
      </td>
      <td className="p-2">
        <input
          className="w-full bg-zinc-900/80 border border-white/10 rounded px-2 py-1 text-slate-200 text-xs"
          value={nameEn}
          onChange={(e) => setNameEn(e.target.value)}
        />
      </td>
      <td className="p-2">
        <input
          className="w-14 bg-zinc-900/80 border border-white/10 rounded px-2 py-1 text-slate-200 text-xs font-mono"
          value={tier}
          onChange={(e) => setTier(e.target.value)}
          maxLength={4}
        />
      </td>
      <td className="p-2">
        <input
          className="w-20 bg-zinc-900/80 border border-white/10 rounded px-2 py-1 text-slate-200 text-xs"
          value={bonus}
          onChange={(e) => setBonus(e.target.value)}
        />
      </td>
      <td className="p-2">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="h-8 gap-1 text-xs"
          onClick={() =>
            void onSave(hero.slug, {
              name_mn: nameMn,
              name_en: nameEn,
              tier,
              bonus_multiplier: bonus,
            })
          }
        >
          <Save className="size-3.5" />
        </Button>
      </td>
    </tr>
  );
}

function StationEditRow({
  station,
  onSave,
}: {
  station: MapStationRow;
  onSave: (slug: string, p: Partial<MapStationRow>) => void;
}) {
  const [mn, setMn] = useState(station.quest_hint_mn ?? "");
  const [en, setEn] = useState(station.quest_hint_en ?? "");
  useEffect(() => {
    setMn(station.quest_hint_mn ?? "");
    setEn(station.quest_hint_en ?? "");
  }, [station]);
  return (
    <tr className="border-b border-white/5 hover:bg-white/[0.03]">
      <td className="p-3 font-mono text-xs text-slate-400">{station.slug}</td>
      <td className="p-2">
        <textarea
          className="w-full min-h-[52px] bg-zinc-900/80 border border-white/10 rounded px-2 py-1 text-slate-200 text-xs"
          value={mn}
          onChange={(e) => setMn(e.target.value)}
        />
      </td>
      <td className="p-2">
        <textarea
          className="w-full min-h-[52px] bg-zinc-900/80 border border-white/10 rounded px-2 py-1 text-slate-200 text-xs"
          value={en}
          onChange={(e) => setEn(e.target.value)}
        />
      </td>
      <td className="p-2">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="h-8 gap-1 text-xs"
          onClick={() =>
            void onSave(station.slug, { quest_hint_mn: mn, quest_hint_en: en })
          }
        >
          <Save className="size-3.5" />
        </Button>
      </td>
    </tr>
  );
}

function StringEditRow({
  row,
  onSave,
}: {
  row: UiStringRow;
  onSave: (row: UiStringRow, value: string) => void;
}) {
  const [val, setVal] = useState(row.value);
  useEffect(() => {
    setVal(row.value);
  }, [row]);
  return (
    <div className="p-4 flex flex-col sm:flex-row gap-3 sm:items-start">
      <div className="sm:w-56 shrink-0">
        <code className="text-[11px] text-slate-500 break-all">{row.key}</code>
      </div>
      <textarea
        className="flex-1 min-h-[56px] bg-zinc-900/80 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200"
        value={val}
        onChange={(e) => setVal(e.target.value)}
      />
      <Button
        type="button"
        size="sm"
        variant="secondary"
        className="shrink-0 gap-1"
        onClick={() => void onSave(row, val)}
      >
        <Save className="size-3.5" />
        Хадгалах
      </Button>
    </div>
  );
}
