"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  LuPlus as Plus,
  LuRefreshCw as RefreshCw,
  LuSave as Save,
  LuTrash2 as Trash,
} from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAdminAuth } from "@/components/admin/AdminAuthContext";
import {
  adminCreateOnisogo,
  adminDeleteOnisogo,
  adminListOnisogo,
  adminUpdateOnisogo,
  type MapOnisogoAdminRow,
} from "@/lib/api";

const emptyForm: Omit<MapOnisogoAdminRow, "id" | "created_at" | "updated_at"> =
  {
    slug: "",
    wx: 0,
    wz: 0,
    icon: "❓",
    title_mn: "",
    title_en: "",
    question_mn: "",
    question_en: "",
    answer_correct_mn: "",
    answer_correct_en: "",
    wrong_1_mn: "",
    wrong_1_en: "",
    wrong_2_mn: "",
    wrong_2_en: "",
    wrong_3_mn: "",
    wrong_3_en: "",
    coin_reward: 18,
    sort_order: 0,
    is_active: true,
  };

export default function AdminOnisogoPage() {
  const { token } = useAdminAuth();
  const [rows, setRows] = useState<MapOnisogoAdminRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [selectedSlug, setSelectedSlug] = useState<string>("");
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const t = token?.trim();
    if (!t) return;
    setLoading(true);
    setMsg(null);
    try {
      const { rows: r } = await adminListOnisogo(t);
      setRows(r);
      setSelectedSlug((prev) => prev || r[0]?.slug || "");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Ачаалахад алдаа");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const selected = useMemo(
    () => rows.find((x) => x.slug === selectedSlug) ?? null,
    [rows, selectedSlug],
  );

  useEffect(() => {
    if (!selected) {
      setForm(emptyForm);
      return;
    }
    setForm({
      slug: selected.slug,
      wx: selected.wx,
      wz: selected.wz,
      icon: selected.icon,
      title_mn: selected.title_mn,
      title_en: selected.title_en,
      question_mn: selected.question_mn,
      question_en: selected.question_en,
      answer_correct_mn: selected.answer_correct_mn,
      answer_correct_en: selected.answer_correct_en,
      wrong_1_mn: selected.wrong_1_mn,
      wrong_1_en: selected.wrong_1_en,
      wrong_2_mn: selected.wrong_2_mn,
      wrong_2_en: selected.wrong_2_en,
      wrong_3_mn: selected.wrong_3_mn,
      wrong_3_en: selected.wrong_3_en,
      coin_reward: selected.coin_reward,
      sort_order: selected.sort_order,
      is_active: selected.is_active,
    });
  }, [selected]);

  const patchForm = <K extends keyof typeof form>(
    key: K,
    v: (typeof form)[K],
  ) => setForm((f) => ({ ...f, [key]: v }));

  const onSave = async () => {
    const t = token?.trim();
    if (!t) return;
    setBusy(true);
    setMsg(null);
    try {
      if (selectedSlug && rows.some((r) => r.slug === selectedSlug)) {
        const { slug, ...rest } = form;
        await adminUpdateOnisogo(t, selectedSlug, rest);
        setMsg("Хадгалагдлаа.");
      } else {
        await adminCreateOnisogo(t, form);
        setMsg("Үүсгэгдлээ.");
        setSelectedSlug(form.slug.trim());
      }
      await load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Алдаа");
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async () => {
    const t = token?.trim();
    if (!t || !selectedSlug) return;
    if (!window.confirm(`${selectedSlug} устгах уу?`)) return;
    setBusy(true);
    setMsg(null);
    try {
      await adminDeleteOnisogo(t, selectedSlug);
      setSelectedSlug("");
      setMsg("Устгагдлаа.");
      await load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Алдаа");
    } finally {
      setBusy(false);
    }
  };

  const startNew = () => {
    setSelectedSlug("");
    setForm({ ...emptyForm, slug: `oni_${Date.now()}` });
  };

  return (
    <div className="admin-page max-w-4xl space-y-4 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">Оньсого</h1>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void load()}
            disabled={loading}
          >
            <RefreshCw className="mr-1.5 size-4" />
            Шинэчлэх
          </Button>
          <Button type="button" size="sm" onClick={startNew}>
            <Plus className="mr-1.5 size-4" />
            Шинэ
          </Button>
        </div>
      </div>
      {msg ? <p className="text-sm text-[var(--admin-muted)]">{msg}</p> : null}

      <div className="grid gap-4 md:grid-cols-[minmax(0,11rem)_1fr]">
        <div className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-elevated)] p-2">
          <p className="px-2 py-1 text-xs font-medium text-[var(--admin-muted)]">
            Жагсаалт ({rows.length})
          </p>
          <ul className="max-h-[50vh] overflow-y-auto text-sm">
            {rows.map((r) => (
              <li key={r.slug}>
                <button
                  type="button"
                  className={
                    r.slug === selectedSlug
                      ? "w-full rounded-md bg-[var(--admin-nav-hover)] px-2 py-1.5 text-left"
                      : "w-full rounded-md px-2 py-1.5 text-left hover:bg-[var(--admin-nav-hover)]"
                  }
                  onClick={() => setSelectedSlug(r.slug)}
                >
                  <span className="mr-1">{r.icon}</span>
                  {r.slug}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-elevated)] p-4">
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="text-xs font-medium">
              Slug (латин, жишээ oni_shagai)
              <Input
                className="mt-1"
                value={form.slug}
                onChange={(e) => patchForm("slug", e.target.value)}
                disabled={
                  !!selectedSlug && rows.some((x) => x.slug === selectedSlug)
                }
              />
            </label>
            <label className="text-xs font-medium">
              Icon (emoji)
              <Input
                className="mt-1"
                value={form.icon}
                onChange={(e) => patchForm("icon", e.target.value)}
              />
            </label>
            <label className="text-xs font-medium">
              wx
              <Input
                type="number"
                className="mt-1"
                value={form.wx}
                onChange={(e) => patchForm("wx", Number(e.target.value))}
              />
            </label>
            <label className="text-xs font-medium">
              wz
              <Input
                type="number"
                className="mt-1"
                value={form.wz}
                onChange={(e) => patchForm("wz", Number(e.target.value))}
              />
            </label>
            <label className="text-xs font-medium">
              sort_order
              <Input
                type="number"
                className="mt-1"
                value={form.sort_order}
                onChange={(e) =>
                  patchForm("sort_order", Number(e.target.value))
                }
              />
            </label>
            <label className="text-xs font-medium">
              coin_reward
              <Input
                type="number"
                className="mt-1"
                value={form.coin_reward}
                onChange={(e) =>
                  patchForm("coin_reward", Number(e.target.value))
                }
              />
            </label>
          </div>
          <label className="flex items-center gap-2 text-xs font-medium">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => patchForm("is_active", e.target.checked)}
            />
            Идэвхтэй (газрын зурагт харагдана)
          </label>

          {(
            [
              ["title_mn", "Гарчиг MN"],
              ["title_en", "Гарчиг EN"],
            ] as const
          ).map(([k, lab]) => (
            <label key={k} className="block text-xs font-medium">
              {lab}
              <Input
                className="mt-1"
                value={form[k]}
                onChange={(e) => patchForm(k, e.target.value)}
              />
            </label>
          ))}

          {(
            [
              ["question_mn", "Асуулт / тогтоол MN"],
              ["question_en", "Асуулт / тогтоол EN"],
            ] as const
          ).map(([k, lab]) => (
            <label key={k} className="block text-xs font-medium">
              {lab}
              <textarea
                className="mt-1 min-h-[100px] w-full rounded-md border border-[var(--admin-border)] bg-[var(--admin-bg)] px-2 py-1.5 text-sm"
                value={form[k]}
                onChange={(e) => patchForm(k, e.target.value)}
              />
            </label>
          ))}

          <p className="text-xs font-semibold text-[var(--admin-muted)]">
            Зөв ба 3 буруу хариулт
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {(
              [
                ["answer_correct_mn", "Зөв MN"],
                ["answer_correct_en", "Зөв EN"],
                ["wrong_1_mn", "Буруу 1 MN"],
                ["wrong_1_en", "Буруу 1 EN"],
                ["wrong_2_mn", "Буруу 2 MN"],
                ["wrong_2_en", "Буруу 2 EN"],
                ["wrong_3_mn", "Буруу 3 MN"],
                ["wrong_3_en", "Буруу 3 EN"],
              ] as const
            ).map(([k, lab]) => (
              <label key={k} className="block text-xs font-medium">
                {lab}
                <Input
                  className="mt-1"
                  value={form[k]}
                  onChange={(e) => patchForm(k, e.target.value)}
                />
              </label>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              type="button"
              size="sm"
              onClick={() => void onSave()}
              disabled={busy || !form.slug.trim()}
            >
              Хадгалах
            </Button>
            {selectedSlug && rows.some((r) => r.slug === selectedSlug) ? (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => void onDelete()}
                disabled={busy}
              >
                <Trash className="mr-1.5 size-4" />
                Устгах
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
