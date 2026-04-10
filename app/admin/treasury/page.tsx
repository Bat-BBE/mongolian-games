"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { LuRefreshCw as RefreshCw } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAdminAuth } from "@/components/admin/AdminAuthContext";
import { adminGetTreasury } from "@/lib/api";

export default function AdminTreasuryPage() {
  const { token } = useAdminAuth();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [data, setData] = useState<Awaited<
    ReturnType<typeof adminGetTreasury>
  > | null>(null);

  const load = useCallback(async () => {
    const t = token?.trim();
    if (!t) return;
    setLoading(true);
    setMsg(null);
    try {
      const next = await adminGetTreasury(t);
      setData(next);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Алдаа");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const s = data?.summary;
  const [q, setQ] = useState("");

  const filteredUsers = useMemo(() => {
    const rows = data?.users ?? [];
    const query = q.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((u) => {
      const dn = (u.display_name ?? "").toLowerCase();
      const em = (u.email ?? "").toLowerCase();
      return dn.includes(query) || em.includes(query);
    });
  }, [data?.users, q]);

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8 pb-24 text-[var(--admin-text,#fafafa)]">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h1 className="font-display text-2xl md:text-3xl tracking-wide flex items-center gap-2 text-[var(--admin-text)]">
            Эрдэнэс
          </h1>
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

      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card label="Хэрэглэгч" value={s ? String(s.users) : "—"} />
        <Card
          label="МО (kp) нийт"
          value={s ? Number(s.kp_total).toLocaleString() : "—"}
        />
        <Card
          label="Зоос нийт"
          value={s ? Number(s.coins_total).toLocaleString() : "—"}
        />
        <Card
          label="Gems нийт"
          value={s ? Number(s.gems_total).toLocaleString() : "—"}
        />
        <Card
          label="🐑 нийт"
          value={s ? Number(s.sheep_total).toLocaleString() : "—"}
        />
        <Card
          label="🐎 нийт"
          value={s ? Number(s.horse_total).toLocaleString() : "—"}
        />
        <Card
          label="🐫 нийт"
          value={s ? Number(s.camel_total).toLocaleString() : "—"}
        />
        <Card
          label="Гэрийн түвшин (avg)"
          value={s ? Number(s.ger_level_avg).toFixed(1) : "—"}
        />
      </section>

      <section className="admin-panel p-4 space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-display text-sm tracking-[0.15em] text-[var(--admin-subtle)] uppercase">
            Хэрэглэгчдийн жагсаалт
          </h2>
          <div className="w-full sm:w-[320px]">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Хэрэглэгчийн имэйлээр хайх..."
              className="border-[var(--admin-border)] bg-[var(--admin-elevated)] text-[var(--admin-text)]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left min-w-[1060px]">
            <thead>
              <tr className="border-b border-[var(--admin-border)] text-[10px] uppercase tracking-wider text-[var(--admin-subtle,#737373)]">
                <th className="p-3">#</th>
                <th className="p-3">Хэрэглэгч</th>
                <th className="p-3">Имэйл</th>
                <th className="p-3">Үнэлгээ</th>
                <th className="p-3">Гэр</th>
                <th className="p-3">МО</th>
                <th className="p-3">Зоос</th>
                <th className="p-3">Gems</th>
                <th className="p-3">🐑</th>
                <th className="p-3">🐎</th>
                <th className="p-3">🐫</th>
                <th className="p-3">Очсон өртөө</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u, idx) => (
                <tr
                  key={u.id}
                  className="border-b border-[var(--admin-border)]"
                >
                  <td className="p-3 text-xs text-[var(--admin-subtle)] tabular-nums">
                    {idx + 1}
                  </td>
                  <td className="p-3 text-[var(--admin-text)]">
                    {u.display_name ?? "—"}
                  </td>
                  <td className="p-3 font-mono text-xs text-[var(--admin-muted)]">
                    {u.email}
                  </td>
                  <td className="p-3 tabular-nums font-semibold text-primary">
                    {Number(u.score).toLocaleString()}
                  </td>
                  <td className="p-3 tabular-nums">{Number(u.ger_level)}</td>
                  <td className="p-3 tabular-nums">
                    {Number(u.kp).toLocaleString()}
                  </td>
                  <td className="p-3 tabular-nums">
                    {Number(u.coins).toLocaleString()}
                  </td>
                  <td className="p-3 tabular-nums">
                    {Number(u.gems).toLocaleString()}
                  </td>
                  <td className="p-3 tabular-nums">{Number(u.sheep)}</td>
                  <td className="p-3 tabular-nums">{Number(u.horse)}</td>
                  <td className="p-3 tabular-nums">{Number(u.camel)}</td>
                  <td className="p-3 tabular-nums">
                    {Number(u.visited_stations)}
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td
                    className="p-8 text-center text-[var(--admin-muted)]"
                    colSpan={12}
                  >
                    Мэдээлэл байхгүй.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="admin-panel p-4 space-y-1">
      <p className="text-[10px] uppercase tracking-[0.25em] text-[var(--admin-subtle)]">
        {label}
      </p>
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}
