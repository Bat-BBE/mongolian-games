"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Save, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAdminAuth } from "@/components/admin/AdminAuthContext";
import { adminListUsers, adminPatchUserDisplayName, type AppUserRow } from "@/lib/api";

export default function AdminUsersPage() {
  const { token } = useAdminAuth();
  const [users, setUsers] = useState<AppUserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const t = token?.trim();
    if (!t) return;
    setLoading(true);
    setMsg(null);
    try {
      const { users: rows } = await adminListUsers(t);
      setUsers(rows);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Ачаалахад алдаа");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token?.trim()) void load();
  }, [token, load]);

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8 pb-24">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.35em] text-[var(--gold-bright)] opacity-80 mb-1">
            PostgreSQL
          </p>
          <h1 className="font-display text-2xl md:text-3xl text-slate-100 tracking-wide flex items-center gap-2">
            <Users className="size-7 text-[var(--gold-bright)]" strokeWidth={1.5} />
            Хэрэглэгчид
          </h1>
          <p className="text-sm text-slate-500 mt-2 max-w-xl">
            <code className="text-xs text-slate-400">app_users</code> хүснэгт — simple-sync / ирээдүйн нэвтрэлтээр үүссэн мөрүүд.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2 border-white/15 shrink-0"
          disabled={loading}
          onClick={() => void load()}
        >
          <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          Сэргээх
        </Button>
      </header>

      {msg && (
        <div className="rounded-xl border border-amber-800/40 bg-amber-950/25 px-4 py-3 text-sm text-amber-100/95">
          {msg}
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-zinc-950/40">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-slate-500">
              <th className="p-3 font-medium">Имэйл</th>
              <th className="p-3 font-medium">Firebase UID</th>
              <th className="p-3 font-medium">Нэр</th>
              <th className="p-3 font-medium">Баатар (id)</th>
              <th className="p-3 font-medium">Бүртгэсэн</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                <td className="p-3 text-slate-200">{u.email}</td>
                <td className="p-3 font-mono text-xs text-slate-500 max-w-[200px] truncate" title={u.firebase_uid}>
                  {u.firebase_uid}
                </td>
                <td className="p-3 min-w-[200px]">
                  <UserDisplayNameCell
                    user={u}
                    token={token?.trim() ?? ""}
                    onSaved={() => void load()}
                    onError={(m) => setMsg(m)}
                  />
                </td>
                <td className="p-3 font-mono text-xs text-slate-400">
                  {u.hero_id ?? "—"}
                </td>
                <td className="p-3 text-slate-500 text-xs whitespace-nowrap">
                  {new Date(u.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && !loading && (
          <p className="p-8 text-center text-slate-500 text-sm">Одоогоор бүртгэл байхгүй.</p>
        )}
        {loading && users.length === 0 && (
          <p className="p-8 text-center text-slate-500 text-sm">Ачаалж байна…</p>
        )}
      </div>
    </div>
  );
}

function UserDisplayNameCell({
  user,
  token,
  onSaved,
  onError,
}: {
  user: AppUserRow;
  token: string;
  onSaved: () => void;
  onError: (msg: string) => void;
}) {
  const [val, setVal] = useState(user.display_name ?? "");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    setVal(user.display_name ?? "");
  }, [user.display_name]);

  const dirty = val !== (user.display_name ?? "");

  return (
    <div className="flex gap-2 items-center max-w-[280px]">
      <input
        className="flex-1 min-w-0 bg-zinc-900/80 border border-white/10 rounded px-2 py-1.5 text-xs text-slate-200"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder="Харагдах нэр"
        disabled={!token}
      />
      <Button
        type="button"
        size="sm"
        variant="secondary"
        className="h-8 shrink-0 px-2"
        disabled={!token || saving || !dirty}
        onClick={async () => {
          if (!token) return;
          setSaving(true);
          try {
            await adminPatchUserDisplayName(token, user.id, val);
            await onSaved();
          } catch (e) {
            onError(e instanceof Error ? e.message : "Хадгалахад алдаа");
          } finally {
            setSaving(false);
          }
        }}
      >
        <Save className="size-3.5" />
      </Button>
    </div>
  );
}
