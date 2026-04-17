"use client";

import { useCallback, useEffect, useState } from "react";
import {
  LuBookMarked as BookMarked,
  LuRefreshCw as RefreshCw,
  LuPencil as Pencil,
} from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAdminAuth } from "@/components/admin/AdminAuthContext";
import {
  adminListHeroes,
  adminUpdateHero,
  adminUploadHeroImage,
  type HeroRow,
} from "@/lib/api";
import { getApiBaseUrl } from "@/lib/api";

export default function AdminHeroesPage() {
  const { token } = useAdminAuth();
  const [heroes, setHeroes] = useState<HeroRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [editing, setEditing] = useState<HeroRow | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pickedFile, setPickedFile] = useState<File | null>(null);
  const apiBase = getApiBaseUrl();

  const load = useCallback(async () => {
    const t = token?.trim();
    if (!t) return;
    setLoading(true);
    setMsg(null);
    try {
      const { heroes: h } = await adminListHeroes(t);
      setHeroes(h);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Ачаалахад алдаа");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleUpdate = async () => {
    const t = token?.trim();
    if (!t || !editing) return;
    setMsg(null);
    try {
      await adminUpdateHero(t, editing.slug, {
        name_mn: editing.name_mn,
        name_en: editing.name_en,
        title_mn: editing.title_mn,
        title_en: editing.title_en,
        bio_mn: editing.bio_mn ?? "",
        bio_en: editing.bio_en ?? "",
        image_url: editing.image_url,
        model_path: editing.model_path,
        emissive: editing.emissive,
        color: editing.color,
        sort_order: editing.sort_order,
        is_available: editing.is_available,
      });
      setEditing(null);
      await load();
      setMsg("Хадгалагдлаа.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Алдаа");
    }
  };

  const handleUpload = async () => {
    const t = token?.trim();
    if (!t || !editing || !pickedFile) return;
    setUploading(true);
    setMsg(null);
    try {
      const { hero } = await adminUploadHeroImage(t, editing.slug, pickedFile);
      setEditing((p) => (p ? { ...p, image_url: hero.image_url } : p));
      setPickedFile(null);
      setMsg("Зураг амжилттай солигдлоо.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Upload алдаа");
    } finally {
      setUploading(false);
    }
  };

  const previewUrl = (raw: string | null | undefined): string => {
    const s = typeof raw === "string" ? raw.trim() : "";
    if (!s) return "";
    if (s.startsWith("/")) return `${apiBase}${s}`;
    return s;
  };

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8 pb-24 text-[var(--admin-text,#fafafa)]">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          {/* <p className="text-[10px] uppercase tracking-[0.35em] text-[var(--admin-subtle)]">
            Баатар
          </p> */}
          <h1 className="font-display text-2xl md:text-3xl tracking-wide flex items-center gap-2">
            {/* <BookMarked className="size-7 text-[var(--admin-muted)] stroke-[1.5]" /> */}
            Баатрууд
          </h1>
          {/* <p className="text-sm text-[var(--admin-muted)] max-w-2xl leading-relaxed">
            Баатарын тухай дэлгэрэнгүй мэдээллийг эндээс засна.
          </p> */}
        </div>
        <Button
          type="button"
          variant="default"
          size="sm"
          className="gap-2 shrink-0 border-[var(--admin-border)] text-white hover:border-[var(--admin-text)]"
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

      <div className="admin-panel overflow-x-auto">
        <table className="w-full text-sm text-left min-w-auto">
          <thead>
            <tr className="border-b border-[var(--admin-border)] text-[10px] uppercase tracking-wider text-[var(--admin-subtle)]">
              <th className="p-3 w-auto">Түлхүүр</th>
              <th className="p-3 w-auto">Нэр (MN/EN)</th>
              <th className="p-3 w-auto">Цол (MN/EN)</th>
              {/* <th className="p-3 w-24">Эрэмбэ</th> */}
              <th className="p-3 w-28">Төлөв</th>
              <th className="p-3 font-medium w-10 text-right">Засах</th>
            </tr>
          </thead>
          <tbody>
            {heroes.map((h) => (
              <tr
                key={h.id}
                className="border-b border-[var(--admin-border)] hover:bg-white/[0.04]"
              >
                <td className="p-3 font-mono text-xs text-[var(--admin-muted)]">
                  {h.slug}
                </td>
                <td className="p-3">
                  <div className="font-medium text-[var(--admin-text)]">
                    {h.name_mn}
                  </div>
                  <div className="text-[var(--admin-muted)] text-xs">
                    {h.name_en}
                  </div>
                </td>
                <td className="p-3">
                  <div className="text-[var(--admin-text)]">{h.title_mn}</div>
                  <div className="text-[var(--admin-muted)] text-xs">
                    {h.title_en}
                  </div>
                </td>
                {/* <td className="p-3 tabular-nums text-[var(--admin-muted)]">
                  {h.sort_order}
                </td> */}
                <td className="p-3">
                  <span
                    className={
                      h.is_available
                        ? "text-[var(--admin-text)] text-xs"
                        : "text-[var(--admin-subtle)] text-xs"
                    }
                  >
                    {h.is_available ? "Нээлттэй" : "Түгжээтэй"}
                  </span>
                </td>
                <td className="p-3 text-right">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2"
                    onClick={() => setEditing({ ...h })}
                    title="Засах"
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {heroes.length === 0 && !loading && (
          <p className="p-8 text-center text-[var(--admin-muted)] text-sm">
            Баатар олдсонгүй.
          </p>
        )}
        {loading && heroes.length === 0 && (
          <p className="p-8 text-center text-[var(--admin-muted)] text-sm">
            Ачаалж байна…
          </p>
        )}
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)]">
          <DialogHeader>
            <DialogTitle className="font-display tracking-wide text-[var(--admin-text)]">
              Баатар засах
            </DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="grid gap-4 py-2">
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>slug</Label>
                  <Input
                    value={editing.slug}
                    disabled
                    className="border-[var(--admin-border)] bg-[var(--admin-elevated)] opacity-80"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>sort_order</Label>
                  <Input
                    type="number"
                    value={editing.sort_order}
                    onChange={(e) =>
                      setEditing((p) =>
                        p
                          ? { ...p, sort_order: Number(e.target.value) || 0 }
                          : p,
                      )
                    }
                    className="border-[var(--admin-border)] bg-[var(--admin-elevated)] text-[var(--admin-text)]"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Нэр</Label>
                  <Input
                    value={editing.name_mn}
                    onChange={(e) =>
                      setEditing((p) =>
                        p ? { ...p, name_mn: e.target.value } : p,
                      )
                    }
                    className="border-[var(--admin-border)] bg-[var(--admin-elevated)] text-[var(--admin-text)]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Нэр (EN)</Label>
                  <Input
                    value={editing.name_en}
                    onChange={(e) =>
                      setEditing((p) =>
                        p ? { ...p, name_en: e.target.value } : p,
                      )
                    }
                    className="border-[var(--admin-border)] bg-[var(--admin-elevated)] text-[var(--admin-text)]"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Цол</Label>
                  <Input
                    value={editing.title_mn}
                    onChange={(e) =>
                      setEditing((p) =>
                        p ? { ...p, title_mn: e.target.value } : p,
                      )
                    }
                    className="border-[var(--admin-border)] bg-[var(--admin-elevated)] text-[var(--admin-text)]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Цол (EN)</Label>
                  <Input
                    value={editing.title_en}
                    onChange={(e) =>
                      setEditing((p) =>
                        p ? { ...p, title_en: e.target.value } : p,
                      )
                    }
                    className="border-[var(--admin-border)] bg-[var(--admin-elevated)] text-[var(--admin-text)]"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Түүх</Label>
                  <Textarea
                    value={editing.bio_mn ?? ""}
                    onChange={(e) =>
                      setEditing((p) =>
                        p ? { ...p, bio_mn: e.target.value } : p,
                      )
                    }
                    className="border-[var(--admin-border)] bg-[var(--admin-elevated)] text-[var(--admin-text)] min-h-[96px]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Түүх (EN)</Label>
                  <Textarea
                    value={editing.bio_en ?? ""}
                    onChange={(e) =>
                      setEditing((p) =>
                        p ? { ...p, bio_en: e.target.value } : p,
                      )
                    }
                    className="border-[var(--admin-border)] bg-[var(--admin-elevated)] text-[var(--admin-text)] min-h-[96px]"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Зураг (image_url)</Label>
                  <Input
                    value={editing.image_url ?? ""}
                    onChange={(e) =>
                      setEditing((p) =>
                        p ? { ...p, image_url: e.target.value } : p,
                      )
                    }
                    className="border-[var(--admin-border)] bg-[var(--admin-elevated)] text-[var(--admin-text)]"
                    placeholder="/uploads/heroes/hero_....png эсвэл https://..."
                  />
                  <div className="flex flex-col gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setPickedFile(e.target.files?.[0] ?? null)
                      }
                      className="block w-full text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-[var(--admin-elevated)] file:px-4 file:py-2 file:text-[var(--admin-text)] file:shadow-xs file:hover:bg-white/[0.06] text-[var(--admin-muted)] border border-[var(--admin-border)] rounded-lg bg-[var(--admin-elevated)]"
                    />
                    {pickedFile ? (
                      <div className="text-xs text-[var(--admin-muted)]">
                        Сонгосон файл:{" "}
                        <span className="text-[var(--admin-text)]">
                          {pickedFile.name}
                        </span>{" "}
                        ({Math.round(pickedFile.size / 1024)} KB)
                      </div>
                    ) : null}
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        disabled={!pickedFile || uploading}
                        onClick={() => void handleUpload()}
                      >
                        {uploading ? "Upload..." : "Зураг upload хийх"}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={uploading}
                        onClick={() => setPickedFile(null)}
                      >
                        Цуцлах
                      </Button>
                    </div>
                    {editing.image_url?.trim() ? (
                      <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-elevated)] p-2">
                        <img
                          src={previewUrl(editing.image_url)}
                          alt=""
                          className="w-full h-40 object-contain rounded-lg"
                        />
                      </div>
                    ) : null}
                  </div>
                </div>
                {/* <div className="space-y-1.5">
                  <Label>model_path</Label>
                  <Input
                    value={editing.model_path ?? ""}
                    onChange={(e) =>
                      setEditing((p) =>
                        p ? { ...p, model_path: e.target.value } : p,
                      )
                    }
                    className="border-[var(--admin-border)] bg-[var(--admin-elevated)] text-[var(--admin-text)]"
                  />
                </div> */}
                {/* <div className="space-y-1.5">
                  <Label>color</Label>
                  <Input
                    value={editing.color}
                    onChange={(e) =>
                      setEditing((p) =>
                        p ? { ...p, color: e.target.value } : p,
                      )
                    }
                    className="border-[var(--admin-border)] bg-[var(--admin-elevated)] text-[var(--admin-text)]"
                    placeholder="#ffd559"
                  />
                </div> */}
                {/* <div className="space-y-1.5">
                  <Label>emissive</Label>
                  <Input
                    value={editing.emissive ?? ""}
                    onChange={(e) =>
                      setEditing((p) =>
                        p ? { ...p, emissive: e.target.value } : p,
                      )
                    }
                    className="border-[var(--admin-border)] bg-[var(--admin-elevated)] text-[var(--admin-text)]"
                    placeholder="#D4AF37"
                  />
                </div> */}
              </div>

              {/* <div className="flex items-center gap-2">
                <Checkbox
                  id="e_avail"
                  checked={editing.is_available}
                  onCheckedChange={(v) =>
                    setEditing((p) =>
                      p ? { ...p, is_available: v === true } : p,
                    )
                  }
                />
                <Label htmlFor="e_avail">Нээлттэй (is_available)</Label>
              </div> */}
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditing(null)}
            >
              Болих
            </Button>
            <Button type="button" onClick={() => void handleUpdate()}>
              Хадгалах
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
