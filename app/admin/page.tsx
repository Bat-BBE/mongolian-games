"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  LuActivity as Activity,
  LuBookMarked as BookMarked,
  LuGamepad2 as Gamepad2,
  LuArrowRight as ArrowRight,
  LuServer as Server,
  LuMapPinned as MapPinned,
  LuUsers as Users,
} from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { getApiHealth, getGames, getContentHeroes, getContentStations } from "@/lib/api";
import { useAdminAuth } from "@/components/admin/AdminAuthContext";

export default function AdminDashboardPage() {
  const { token } = useAdminAuth();
  const [health, setHealth] = useState<Awaited<ReturnType<typeof getApiHealth>> | null>(null);
  const [gameCount, setGameCount] = useState<number | null>(null);
  const [heroCount, setHeroCount] = useState<number | null>(null);
  const [stationCount, setStationCount] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [h, { games }, { heroes }, { stations }] = await Promise.all([
          getApiHealth(),
          getGames(),
          getContentHeroes(),
          getContentStations(),
        ]);
        if (!cancelled) {
          setHealth(h);
          setGameCount(games.length);
          setHeroCount(heroes.length);
          setStationCount(stations.length);
          setErr(null);
        }
      } catch (e) {
        if (!cancelled) {
          setErr(e instanceof Error ? e.message : "Алдаа");
          setHealth(null);
          setGameCount(null);
          setHeroCount(null);
          setStationCount(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-10 text-[var(--admin-text)]">
      <header className="space-y-2">
        <p className="text-[10px] uppercase tracking-[0.35em] text-[var(--admin-subtle)]">
          Самбар
        </p>
        <h1 className="font-display text-2xl md:text-3xl tracking-wide">
          Удирдлагын товчоо
        </h1>
        <p className="text-sm text-[var(--admin-muted)] max-w-xl leading-relaxed">
          Тоглоом, өртөө, баатар, контент — PostgreSQL-оос динамик тоо. Доорх картуудаас засварлах холбоосууд руу шилжинэ.
        </p>
      </header>

      {err && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Холболтын алдаа: {err}. <code className="text-xs">NEXT_PUBLIC_API_URL</code> болон Express сервер асаасан эсэхийг шалгана уу.
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl">
        <div className="admin-panel p-5 space-y-3">
          <div className="flex items-center gap-2 text-[var(--admin-muted)]">
            <Gamepad2 className="size-5 stroke-[1.5]" />
            <span className="font-display text-xs tracking-[0.2em] uppercase">Тоглоомууд</span>
          </div>
          <p className="text-3xl font-semibold tabular-nums">
            {gameCount === null ? "—" : gameCount}
          </p>
          <p className="text-xs text-[var(--admin-muted)]">Каталог (`/api/games`)</p>
          <Button asChild variant="secondary" size="sm" className="gap-1.5 mt-2">
            <Link href="/admin/games">
              Засварлах
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>

        <div className="admin-panel p-5 space-y-3">
          <div className="flex items-center gap-2 text-[var(--admin-muted)]">
            <MapPinned className="size-5 stroke-[1.5]" />
            <span className="font-display text-xs tracking-[0.2em] uppercase">Өртөөнүүд</span>
          </div>
          <p className="text-3xl font-semibold tabular-nums">
            {stationCount === null ? "—" : stationCount}
          </p>
          <p className="text-xs text-[var(--admin-muted)]">Газрын зураг (`/api/content/stations`)</p>
          <Button asChild variant="secondary" size="sm" className="gap-1.5 mt-2">
            <Link href="/admin/stations">
              Засварлах
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>

        <div className="admin-panel p-5 space-y-3">
          <div className="flex items-center gap-2 text-[var(--admin-muted)]">
            <Users className="size-5 stroke-[1.5]" />
            <span className="font-display text-xs tracking-[0.2em] uppercase">Баатрууд</span>
          </div>
          <p className="text-3xl font-semibold tabular-nums">
            {heroCount === null ? "—" : heroCount}
          </p>
          <p className="text-xs text-[var(--admin-muted)]">Түүхийн дүр (`/api/content/heroes`)</p>
          <Button asChild variant="secondary" size="sm" className="gap-1.5 mt-2">
            <Link href="/admin/heroes">
              Засварлах
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>

        <div className="admin-panel p-5 space-y-3">
          <div className="flex items-center gap-2 text-[var(--admin-muted)]">
            <BookMarked className="size-5 stroke-[1.5]" />
            <span className="font-display text-xs tracking-[0.2em] uppercase">UI текст</span>
          </div>
          <p className="text-xs text-[var(--admin-muted)] leading-relaxed">
            Sidebar болон орчны текст — `ui_strings`.
          </p>
          <Button asChild variant="secondary" size="sm" className="gap-1.5 mt-2">
            <Link href="/admin/content">
              Засварлах
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>

        <div className="admin-panel p-5 space-y-3 sm:col-span-2 lg:col-span-2">
          <div className="flex items-center gap-2 text-[var(--admin-muted)]">
            <Server className="size-5 stroke-[1.5]" />
            <span className="font-display text-xs tracking-[0.2em] uppercase">API</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Activity className="size-4 text-[var(--admin-muted)]/80" />
            <span className="text-[var(--admin-text)]">
              {health ? (health.ok ? "PostgreSQL OK" : "DB алдаа") : "Шалгаж байна…"}
            </span>
          </div>
          <p className="text-xs text-[var(--admin-muted)]">
            {health
              ? `Firebase Admin: ${health.firebaseAdmin ? "тохируулсан" : "үйлдэлгүй"}`
              : ""}
          </p>
        </div>
      </div>

      <section className="admin-panel p-6 space-y-3">
        <h2 className="font-display text-sm tracking-[0.15em] text-[var(--admin-subtle)] uppercase">Тохиргоо</h2>
        <ol className="list-decimal list-inside text-sm text-[var(--admin-muted)] space-y-2 leading-relaxed">
          <li>
            <code className="text-[var(--admin-text)]">server/.env</code>:{" "}
            <code className="text-[var(--admin-text)]">ADMIN_USERNAME</code>,{" "}
            <code className="text-[var(--admin-text)]">ADMIN_PASSWORD</code>,{" "}
            <code className="text-[var(--admin-text)]">JWT_SECRET</code> (хамгийн багадаа 32 тэмдэгт).
          </li>
          <li>
            <Link href="/admin/login" className="text-[var(--admin-text)] underline underline-offset-2 hover:text-[var(--admin-muted)]">
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
