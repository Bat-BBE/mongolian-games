"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Activity, BookMarked, Gamepad2, ArrowRight, Server, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getApiHealth, getGames, adminListUsers } from "@/lib/api";
import { useAdminAuth } from "@/components/admin/AdminAuthContext";

export default function AdminDashboardPage() {
  const { token } = useAdminAuth();
  const [health, setHealth] = useState<Awaited<ReturnType<typeof getApiHealth>> | null>(null);
  const [gameCount, setGameCount] = useState<number | null>(null);
  const [userCount, setUserCount] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [h, { games }] = await Promise.all([getApiHealth(), getGames()]);
        if (!cancelled) {
          setHealth(h);
          setGameCount(games.length);
          setErr(null);
        }
        const t = token?.trim();
        if (t && !cancelled) {
          try {
            const { users } = await adminListUsers(t);
            if (!cancelled) setUserCount(users.length);
          } catch {
            if (!cancelled) setUserCount(null);
          }
        }
      } catch (e) {
        if (!cancelled) {
          setErr(e instanceof Error ? e.message : "Алдаа");
          setHealth(null);
          setGameCount(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-10">
      <header className="space-y-2">
        <p className="text-[10px] uppercase tracking-[0.35em] text-[var(--gold-bright)] opacity-80">
          Самбар
        </p>
        <h1 className="font-display text-2xl md:text-3xl text-slate-100 tracking-wide">
          Удирдлагын товчоо
        </h1>
        <p className="text-sm text-slate-500 max-w-xl leading-relaxed">
          Тоглоомын каталог болон бүртгэлтэй хэрэглэгчдийг харна. Эндээс цааш шинэ модуль (статистик, контент гэх мэт) нэмж болно.
        </p>
      </header>

      {err && (
        <div className="rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-200">
          Холболтын алдаа: {err}. <code className="text-xs">NEXT_PUBLIC_API_URL</code> болон Express сервер асаасан эсэхийг шалгана уу.
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          className="rounded-2xl border p-5 space-y-3"
          style={{
            borderColor: "color-mix(in oklch, var(--primary) 22%, var(--border))",
            background:
              "linear-gradient(145deg, rgba(20,16,4,0.5) 0%, rgba(6,4,1,0.65) 100%)",
          }}
        >
          <div className="flex items-center gap-2 text-[var(--gold-bright)]">
            <Gamepad2 className="size-5" strokeWidth={1.5} />
            <span className="font-display text-xs tracking-[0.2em] uppercase">Тоглоомууд</span>
          </div>
          <p className="text-3xl font-semibold text-slate-100 tabular-nums">
            {gameCount === null ? "—" : gameCount}
          </p>
          <p className="text-xs text-slate-500">Каталог (public API)</p>
          <Button asChild variant="secondary" size="sm" className="gap-1.5 mt-2">
            <Link href="/admin/games">
              Засварлах
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>

        <div
          className="rounded-2xl border p-5 space-y-3"
          style={{
            borderColor: "color-mix(in oklch, var(--primary) 22%, var(--border))",
            background:
              "linear-gradient(145deg, rgba(20,16,4,0.5) 0%, rgba(6,4,1,0.65) 100%)",
          }}
        >
          <div className="flex items-center gap-2 text-[var(--gold-bright)]">
            <Users className="size-5" strokeWidth={1.5} />
            <span className="font-display text-xs tracking-[0.2em] uppercase">Хэрэглэгчид</span>
          </div>
          <p className="text-3xl font-semibold text-slate-100 tabular-nums">
            {userCount === null ? "—" : userCount}
          </p>
          <p className="text-xs text-slate-500">PostgreSQL app_users</p>
          <Button asChild variant="secondary" size="sm" className="gap-1.5 mt-2">
            <Link href="/admin/users">
              Жагсаалт
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>

        <div
          className="rounded-2xl border p-5 space-y-3"
          style={{
            borderColor: "color-mix(in oklch, var(--primary) 22%, var(--border))",
            background:
              "linear-gradient(145deg, rgba(20,16,4,0.5) 0%, rgba(6,4,1,0.65) 100%)",
          }}
        >
          <div className="flex items-center gap-2 text-[var(--gold-bright)]">
            <BookMarked className="size-5" strokeWidth={1.5} />
            <span className="font-display text-xs tracking-[0.2em] uppercase">Контент</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Баатар, уртуу, sidebar текст — PostgreSQL.
          </p>
          <Button asChild variant="secondary" size="sm" className="gap-1.5 mt-2">
            <Link href="/admin/content">
              Засварлах
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>

        <div
          className="rounded-2xl border p-5 space-y-3 sm:col-span-2 lg:col-span-1"
          style={{
            borderColor: "color-mix(in oklch, var(--primary) 22%, var(--border))",
            background:
              "linear-gradient(145deg, rgba(20,16,4,0.5) 0%, rgba(6,4,1,0.65) 100%)",
          }}
        >
          <div className="flex items-center gap-2 text-[var(--gold-bright)]">
            <Server className="size-5" strokeWidth={1.5} />
            <span className="font-display text-xs tracking-[0.2em] uppercase">API</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Activity className="size-4 text-emerald-400/90" />
            <span className="text-slate-300">
              {health ? (health.ok ? "PostgreSQL OK" : "DB алдаа") : "Шалгаж байна…"}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            {health
              ? `Firebase Admin: ${health.firebaseAdmin ? "тохируулсан" : "үйлдэлгүй"}`
              : ""}
          </p>
        </div>
      </div>

      <section
        className="rounded-2xl border p-6 space-y-3"
        style={{ borderColor: "color-mix(in oklch, var(--primary) 16%, var(--border))" }}
      >
        <h2 className="font-display text-sm tracking-[0.15em] text-slate-400 uppercase">Тохиргоо</h2>
        <ol className="list-decimal list-inside text-sm text-slate-400 space-y-2 leading-relaxed">
          <li>
            <code className="text-slate-300">server/.env</code>:{" "}
            <code className="text-slate-300">ADMIN_USERNAME</code>,{" "}
            <code className="text-slate-300">ADMIN_PASSWORD</code>,{" "}
            <code className="text-slate-300">JWT_SECRET</code> (хамгийн багадаа 32 тэмдэгт).
          </li>
          <li>
            <Link href="/admin/login" className="text-[var(--gold-bright)] hover:underline">
              /admin/login
            </Link>{" "}
            — зөвхөн эдгээр нэр / нууц үгээр нэвтэрнэ.
          </li>
          <li>Цаашид энд шинэ картууд, тайлан, контентын модуль нэмж болно.</li>
        </ol>
      </section>
    </div>
  );
}
