"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  LuActivity as Activity,
  LuGem as Gem,
  LuGamepad2 as Gamepad2,
  LuArrowRight as ArrowRight,
  LuServer as Server,
  LuMapPinned as MapPinned,
  LuUsers as Users,
} from "react-icons/lu";
import { Button } from "@/components/ui/button";
import {
  getApiHealth,
  getGames,
  getContentHeroes,
  getContentStations,
} from "@/lib/api";
import { useAdminAuth } from "@/components/admin/AdminAuthContext";

export default function AdminDashboardPage() {
  const { token } = useAdminAuth();
  const [health, setHealth] = useState<Awaited<
    ReturnType<typeof getApiHealth>
  > | null>(null);
  const [gameCount, setGameCount] = useState<number | null>(null);
  const [heroCount, setHeroCount] = useState<number | null>(null);
  const [stationCount, setStationCount] = useState<number | null>(null);

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
          // setErr(null);
        }
      } catch {
        if (!cancelled) {
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
        <h1 className="font-display text-2xl md:text-3xl tracking-wide">
          Хяналтын самбар
        </h1>
      </header>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl">
        <div className="admin-panel p-5 space-y-3">
          <div className="flex items-center gap-2 text-[var(--admin-muted)]">
            <Gamepad2 className="size-5 stroke-[1.5]" />
            <span className="font-display text-xs tracking-[0.2em] uppercase">
              Тоглоомууд
            </span>
          </div>
          <p className="text-3xl font-semibold tabular-nums">
            {gameCount === null ? "—" : gameCount}
          </p>
          <Button
            asChild
            variant="secondary"
            size="sm"
            className="gap-1.5 mt-2"
          >
            <Link href="/admin/games">
              Засах
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>

        <div className="admin-panel p-5 space-y-3">
          <div className="flex items-center gap-2 text-[var(--admin-muted)]">
            <MapPinned className="size-5 stroke-[1.5]" />
            <span className="font-display text-xs tracking-[0.2em] uppercase">
              Өртөөнүүд
            </span>
          </div>
          <p className="text-3xl font-semibold tabular-nums">
            {stationCount === null ? "—" : stationCount}
          </p>
          <Button
            asChild
            variant="secondary"
            size="sm"
            className="gap-1.5 mt-2"
          >
            <Link href="/admin/stations">
              Засах
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>

        <div className="admin-panel p-5 space-y-3">
          <div className="flex items-center gap-2 text-[var(--admin-muted)]">
            <Users className="size-5 stroke-[1.5]" />
            <span className="font-display text-xs tracking-[0.2em] uppercase">
              Баатрууд
            </span>
          </div>
          <p className="text-3xl font-semibold tabular-nums">
            {heroCount === null ? "—" : heroCount}
          </p>
          <Button
            asChild
            variant="secondary"
            size="sm"
            className="gap-1.5 mt-2"
          >
            <Link href="/admin/heroes">
              Засах
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>

        <div className="admin-panel p-5 space-y-3">
          <div className="flex items-center gap-2 text-[var(--admin-muted)]">
            <Gem className="size-5 stroke-[1.5]" />
            <span className="font-display text-xs tracking-[0.2em] uppercase">
              Эрдэнэс
            </span>
          </div>
          <Button
            asChild
            variant="secondary"
            size="sm"
            className="gap-1.5 mt-2"
          >
            <Link href="/admin/treasury">
              Харах
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>

        <div className="admin-panel p-5 space-y-3 sm:col-span-2 lg:col-span-2">
          <div className="flex items-center gap-2 text-[var(--admin-muted)]">
            <Server className="size-5 stroke-[1.5]" />
            <span className="font-display text-xs tracking-[0.2em] uppercase">
              API
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Activity className="size-4 text-[var(--admin-muted)]/80" />
            <span className="text-[var(--admin-text)]">
              {health
                ? health.ok
                  ? "PostgreSQL OK"
                  : "DB алдаа"
                : "Шалгаж байна…"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
