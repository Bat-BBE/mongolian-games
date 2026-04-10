"use client";

import { useCallback, useEffect, useState } from "react";
import { LuRefreshCw as RefreshCw, LuPlus as Plus, LuPencil as Pencil, LuTrash2 as Trash2 } from "react-icons/lu";
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
  adminCreateGame,
  adminDeleteGame,
  adminListGames,
  adminUpdateGame,
  type GameRow,
} from "@/lib/api";

export default function AdminGamesPage() {
  const { token } = useAdminAuth();
  const [games, setGames] = useState<GameRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [editing, setEditing] = useState<GameRow | null>(null);

  const load = useCallback(async () => {
    const t = token?.trim();
    if (!t) {
      setMsg("Дахин нэвтэрнэ үү.");
      return;
    }
    setLoading(true);
    setMsg(null);
    try {
      const { games: rows } = await adminListGames(t);
      setGames(rows);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Ачаалахад алдаа");
      setGames([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token?.trim()) void load();
  }, [token, load]);

  const [createForm, setCreateForm] = useState<Omit<GameRow, "id" | "created_at" | "updated_at">>(
    () => ({
      slug: "",
      name_mn: "",
      name_en: "",
      description_mn: "",
      description_en: "",
      is_available: false,
      show_on_home: true,
      sort_order: 0,
    })
  );

  useEffect(() => {
    setCreateForm((prev) => ({ ...prev, sort_order: games.length }));
  }, [games.length]);

  const handleCreate = async () => {
    const t = token?.trim();
    if (!t) return;
    setMsg(null);
    try {
      await adminCreateGame(t, createForm);
      setCreateForm({
        slug: "",
        name_mn: "",
        name_en: "",
        description_mn: "",
        description_en: "",
        is_available: false,
        show_on_home: true,
        sort_order: 0,
      });
      await load();
      setMsg("Нэмэгдлээ.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Алдаа");
    }
  };

  const handleUpdate = async () => {
    if (!editing) return;
    const t = token?.trim();
    if (!t) return;
    setMsg(null);
    try {
      await adminUpdateGame(t, editing.id, {
        slug: editing.slug,
        name_mn: editing.name_mn,
        name_en: editing.name_en,
        description_mn: editing.description_mn,
        description_en: editing.description_en,
        is_available: editing.is_available,
        show_on_home: editing.show_on_home,
        sort_order: editing.sort_order,
      });
      setEditing(null);
      await load();
      setMsg("Хадгалагдлаа.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Алдаа");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Устгах уу?")) return;
    const t = token?.trim();
    if (!t) return;
    setMsg(null);
    try {
      await adminDeleteGame(t, id);
      await load();
      setMsg("Устгагдлаа.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Алдаа");
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-10 pb-24 text-[var(--admin-text)]">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.35em] text-[var(--admin-subtle)] mb-1">
            Каталог
          </p>
          <h1 className="font-display text-2xl md:text-3xl tracking-wide">
            Тоглоомууд
          </h1>
          <p className="text-sm text-[var(--admin-muted)] mt-2 max-w-xl leading-relaxed">
            Мэдээлэл нь PostgreSQL <code className="text-xs text-[var(--admin-subtle)]">games</code> хүснэгтэд
            хадгалагдана. Нүүр хуудсын «Тоглоомууд» хэсэг API-аас ижил өгөгдлийг уншина.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2 shrink-0 border-[var(--admin-border)] text-[var(--admin-muted)]"
          disabled={loading}
          onClick={() => void load()}
        >
          <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          Сэргээх
        </Button>
      </header>

      {msg && (
        <div className="admin-panel-elevated px-4 py-3 text-sm text-[var(--admin-text)]">
          {msg}
        </div>
      )}

      <section className="space-y-3">
        <h2 className="font-display text-xs tracking-[0.2em] text-[var(--admin-subtle)] uppercase">Бүртгэл</h2>
        {loading && games.length === 0 ? (
          <p className="text-sm text-[var(--admin-muted)]">Ачаалж байна…</p>
        ) : (
          <div className="admin-panel overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-[var(--admin-border)] text-[10px] uppercase tracking-wider text-[var(--admin-subtle)]">
                  <th className="p-3 font-medium">Slug</th>
                  <th className="p-3 font-medium">Нэр (МН / EN)</th>
                  <th className="p-3 font-medium w-24">Эрэмбэ</th>
                  <th className="p-3 font-medium w-28">Төлөв</th>
                  <th className="p-3 font-medium w-36 text-right">Үйлдэл</th>
                </tr>
              </thead>
              <tbody>
                {games.map((g) => (
                  <tr key={g.id} className="border-b border-[var(--admin-border)] hover:bg-white/[0.04]">
                    <td className="p-3 font-mono text-xs text-[var(--admin-muted)]">{g.slug}</td>
                    <td className="p-3">
                      <div className="font-medium text-[var(--admin-text)]">{g.name_mn}</div>
                      <div className="text-[var(--admin-muted)] text-xs">{g.name_en}</div>
                    </td>
                    <td className="p-3 tabular-nums text-[var(--admin-muted)]">{g.sort_order}</td>
                    <td className="p-3">
                      <span
                        className={
                          g.is_available
                            ? "text-[var(--admin-text)] text-xs"
                            : "text-[var(--admin-subtle)] text-xs"
                        }
                      >
                        {g.is_available ? "Нээлттэй" : "Түгжээтэй"}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2"
                        onClick={() => setEditing({ ...g })}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2 text-red-400 hover:text-red-300"
                        onClick={() => void handleDelete(g.id)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {games.length === 0 && !loading && (
              <p className="p-8 text-center text-[var(--admin-muted)] text-sm">Мэдээлэл байхгүй. Доорх хэсгээс нэмнэ үү.</p>
            )}
          </div>
        )}
      </section>

      <section className="admin-panel p-6 space-y-5">
        <div className="flex items-center gap-2 text-[var(--admin-muted)]">
          <Plus className="size-5 stroke-[1.5]" />
          <h2 className="font-display text-sm tracking-[0.15em] uppercase">Шинэ тоглоом</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>slug</Label>
            <Input
              value={createForm.slug}
              onChange={(e) => setCreateForm((p) => ({ ...p, slug: e.target.value }))}
              placeholder="жишээ: shagai"
              className="border-[var(--admin-border)] bg-[var(--admin-elevated)] text-[var(--admin-text)]"
            />
          </div>
          <div className="space-y-1.5">
            <Label>sort_order</Label>
            <Input
              type="number"
              value={createForm.sort_order}
              onChange={(e) =>
                setCreateForm((p) => ({ ...p, sort_order: Number(e.target.value) || 0 }))
              }
              className="border-[var(--admin-border)] bg-[var(--admin-elevated)] text-[var(--admin-text)]"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Нэр (МН)</Label>
            <Input
              value={createForm.name_mn}
              onChange={(e) => setCreateForm((p) => ({ ...p, name_mn: e.target.value }))}
              className="border-[var(--admin-border)] bg-[var(--admin-elevated)] text-[var(--admin-text)]"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Name (EN)</Label>
            <Input
              value={createForm.name_en}
              onChange={(e) => setCreateForm((p) => ({ ...p, name_en: e.target.value }))}
              className="border-[var(--admin-border)] bg-[var(--admin-elevated)] text-[var(--admin-text)]"
            />
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <Label>Тайлбар МН</Label>
            <Textarea
              value={createForm.description_mn}
              onChange={(e) => setCreateForm((p) => ({ ...p, description_mn: e.target.value }))}
              className="border-[var(--admin-border)] bg-[var(--admin-elevated)] text-[var(--admin-text)] min-h-[80px]"
            />
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <Label>Description EN</Label>
            <Textarea
              value={createForm.description_en}
              onChange={(e) => setCreateForm((p) => ({ ...p, description_en: e.target.value }))}
              className="border-[var(--admin-border)] bg-[var(--admin-elevated)] text-[var(--admin-text)] min-h-[80px]"
            />
          </div>
          <div className="flex items-center gap-2 sm:col-span-2">
            <Checkbox
              id="c_avail"
              checked={createForm.is_available}
              onCheckedChange={(v) => setCreateForm((p) => ({ ...p, is_available: v === true }))}
            />
            <Label htmlFor="c_avail">Тоглож болно (is_available)</Label>
          </div>
          <div className="flex items-center gap-2 sm:col-span-2">
            <Checkbox
              id="c_home"
              checked={createForm.show_on_home}
              onCheckedChange={(v) => setCreateForm((p) => ({ ...p, show_on_home: v === true }))}
            />
            <Label htmlFor="c_home">Нүүр хуудсанд харагдана (show_on_home)</Label>
          </div>
        </div>
        <Button type="button" onClick={() => void handleCreate()} className="gap-2">
          <Plus className="size-4" />
          Нэмэх
        </Button>
      </section>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)]">
          <DialogHeader>
            <DialogTitle className="font-display tracking-wide text-[var(--admin-text)]">
              Тоглоом засах
            </DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="grid gap-3 py-2">
              <div className="space-y-1.5">
                <Label>slug</Label>
                <Input
                  value={editing.slug}
                  onChange={(e) => setEditing((p) => (p ? { ...p, slug: e.target.value } : p))}
                  className="border-[var(--admin-border)] bg-[var(--admin-elevated)] text-[var(--admin-text)]"
                />
              </div>
              <div className="space-y-1.5">
                <Label>sort_order</Label>
                <Input
                  type="number"
                  value={editing.sort_order}
                  onChange={(e) =>
                    setEditing((p) =>
                      p ? { ...p, sort_order: Number(e.target.value) || 0 } : p
                    )
                  }
                  className="border-[var(--admin-border)] bg-[var(--admin-elevated)] text-[var(--admin-text)]"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Нэр МН</Label>
                <Input
                  value={editing.name_mn}
                  onChange={(e) => setEditing((p) => (p ? { ...p, name_mn: e.target.value } : p))}
                  className="border-[var(--admin-border)] bg-[var(--admin-elevated)] text-[var(--admin-text)]"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Name EN</Label>
                <Input
                  value={editing.name_en}
                  onChange={(e) => setEditing((p) => (p ? { ...p, name_en: e.target.value } : p))}
                  className="border-[var(--admin-border)] bg-[var(--admin-elevated)] text-[var(--admin-text)]"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Тайлбар МН</Label>
                <Textarea
                  value={editing.description_mn}
                  onChange={(e) =>
                    setEditing((p) => (p ? { ...p, description_mn: e.target.value } : p))
                  }
                  className="border-[var(--admin-border)] bg-[var(--admin-elevated)] text-[var(--admin-text)] min-h-[72px]"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Description EN</Label>
                <Textarea
                  value={editing.description_en}
                  onChange={(e) =>
                    setEditing((p) => (p ? { ...p, description_en: e.target.value } : p))
                  }
                  className="border-[var(--admin-border)] bg-[var(--admin-elevated)] text-[var(--admin-text)] min-h-[72px]"
                />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="e_avail"
                  checked={editing.is_available}
                  onCheckedChange={(v) =>
                    setEditing((p) => (p ? { ...p, is_available: v === true } : p))
                  }
                />
                <Label htmlFor="e_avail">Тоглож болно</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="e_home"
                  checked={editing.show_on_home}
                  onCheckedChange={(v) =>
                    setEditing((p) => (p ? { ...p, show_on_home: v === true } : p))
                  }
                />
                <Label htmlFor="e_home">Нүүр хуудсанд харагдана</Label>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setEditing(null)}>
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
