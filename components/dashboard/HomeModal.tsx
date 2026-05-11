"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { loadPlayer } from "@/components/hero-select/hero-data";
import {
  getDashboardBundle,
  homeBuyLivestock,
  homeUpgradeGer,
} from "@/lib/api";
import { gerUpgradeCost, LIVESTOCK_COIN_PRICES } from "@/lib/homeEconomy";
import type { DashLang, DashStrings } from "./dashboard-strings";
import { cn } from "@/lib/utils";

type HomeModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  t: DashStrings;
  lang: DashLang;
  onChanged?: (next?: {
    kp: number;
    coins: number;
    gems: number;
    gerLevel: number;
    livestock: {
      sheep: number;
      goat: number;
      cow: number;
      horse: number;
      camel: number;
    };
  }) => void;
};

function isPlainRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function num(v: unknown, fallback: number): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function HomeModal({
  open,
  onOpenChange,
  t,
  lang,
  onChanged,
}: HomeModalProps) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [kp, setKp] = useState(0);
  const [coins, setCoins] = useState(0);
  const [gems, setGems] = useState(0);
  const [gerLevel, setGerLevel] = useState(1);
  const [sheep, setSheep] = useState(0);
  const [goat, setGoat] = useState(0);
  const [cow, setCow] = useState(0);
  const [horse, setHorse] = useState(0);
  const [camel, setCamel] = useState(0);

  useEffect(() => {
    if (!open) return;
    const saved = loadPlayer();
    if (!saved?.name) return;
    setEmail(saved.name);
    setLoading(true);
    setErr(null);
    void getDashboardBundle(saved.name, lang)
      .then((b) => {
        const prof = b.user.profile as Record<string, unknown>;
        setKp(num(prof.kp, 0));
        const inv = isPlainRecord(prof.inventory) ? prof.inventory : {};
        setCoins(num(inv.coins, 0));
        setGems(num(inv.gems, 0));
        const ger = isPlainRecord(prof.ger) ? prof.ger : {};
        setGerLevel(Math.max(1, Math.floor(num(ger.level, 1))));
        const ls = isPlainRecord(prof.livestock) ? prof.livestock : {};
        setSheep(Math.max(0, Math.floor(num(ls.sheep, 0))));
        setGoat(Math.max(0, Math.floor(num(ls.goat, 0))));
        setCow(Math.max(0, Math.floor(num(ls.cow, 0))));
        setHorse(Math.max(0, Math.floor(num(ls.horse, 0))));
        setCamel(Math.max(0, Math.floor(num(ls.camel, 0))));
      })
      .catch((e: unknown) => {
        setErr(e instanceof Error ? e.message : "Алдаа");
      })
      .finally(() => setLoading(false));
  }, [open, lang]);

  const title = useMemo(
    () => (lang === "mn" ? "Миний гэр" : "My home"),
    [lang],
  );

  const upgradeCost = useMemo(() => gerUpgradeCost(gerLevel), [gerLevel]);
  const canUpgrade = coins >= upgradeCost.coins && kp >= upgradeCost.kp;
  function snapshotFromProfile(prof: Record<string, unknown>) {
    const inv = isPlainRecord(prof.inventory) ? prof.inventory : {};
    const ger = isPlainRecord(prof.ger) ? prof.ger : {};
    const ls = isPlainRecord(prof.livestock) ? prof.livestock : {};
    return {
      kp: num(prof.kp, 0),
      coins: num(inv.coins, 0),
      gems: num(inv.gems, 0),
      gerLevel: Math.max(1, Math.floor(num(ger.level, 1))),
      livestock: {
        sheep: Math.max(0, Math.floor(num(ls.sheep, 0))),
        goat: Math.max(0, Math.floor(num(ls.goat, 0))),
        cow: Math.max(0, Math.floor(num(ls.cow, 0))),
        horse: Math.max(0, Math.floor(num(ls.horse, 0))),
        camel: Math.max(0, Math.floor(num(ls.camel, 0))),
      },
    };
  }

  async function doUpgrade() {
    if (!email) return;
    setLoading(true);
    setErr(null);
    try {
      const { user } = await homeUpgradeGer({ email });
      const prof = isPlainRecord(user.profile)
        ? (user.profile as Record<string, unknown>)
        : {};
      const next = snapshotFromProfile(prof);
      applyProfileFromUser(prof);
      onChanged?.(next);
      onOpenChange(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Алдаа");
    } finally {
      setLoading(false);
    }
  }

  async function buy(kind: "sheep" | "goat" | "cow" | "horse" | "camel") {
    if (!email) return;
    setLoading(true);
    setErr(null);
    try {
      const { user } = await homeBuyLivestock({ email, kind, qty: 1 });
      const prof = isPlainRecord(user.profile)
        ? (user.profile as Record<string, unknown>)
        : {};
      const next = snapshotFromProfile(prof);
      applyProfileFromUser(prof);
      onChanged?.(next);
      onOpenChange(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Алдаа");
    } finally {
      setLoading(false);
    }
  }

  function applyProfileFromUser(prof: Record<string, unknown>) {
    setKp(num(prof.kp, 0));
    const inv = isPlainRecord(prof.inventory) ? prof.inventory : {};
    setCoins(num(inv.coins, 0));
    setGems(num(inv.gems, 0));
    const ger = isPlainRecord(prof.ger) ? prof.ger : {};
    setGerLevel(Math.max(1, Math.floor(num(ger.level, 1))));
    const ls = isPlainRecord(prof.livestock) ? prof.livestock : {};
    setSheep(Math.max(0, Math.floor(num(ls.sheep, 0))));
    setGoat(Math.max(0, Math.floor(num(ls.goat, 0))));
    setCow(Math.max(0, Math.floor(num(ls.cow, 0))));
    setHorse(Math.max(0, Math.floor(num(ls.horse, 0))));
    setCamel(Math.max(0, Math.floor(num(ls.camel, 0))));
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[min(100vw-1.25rem,56rem)] max-h-[min(92vh,760px)] overflow-hidden flex flex-col p-0 gap-0 border border-[color:var(--map-ui-border)] bg-[color:var(--map-ui-surface-2)] backdrop-blur-xl shadow-[0_24px_70px_-30px_rgba(0,0,0,0.55)]">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-[color:var(--map-ui-border)] bg-[color-mix(in_srgb,var(--map-ui-base)_58%,transparent)]">
          <DialogTitle className="font-display tracking-wide flex items-center justify-center gap-2 text-center text-[color:var(--map-ui-text)]">
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="px-4 py-4 sm:px-5 sm:py-5 overflow-y-auto space-y-3">
          {err ? <p className="text-sm text-destructive">{err}</p> : null}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1">
            <Stat
              label={lang === "mn" ? "Г/түвшин" : "H/level"}
              value={`Lv ${gerLevel}`}
            />
            <Stat
              label={lang === "mn" ? "Эрдэнэс" : "KP"}
              value={kp.toLocaleString()}
            />
            <Stat
              label={lang === "mn" ? "Зоос" : "Coins"}
              value={coins.toLocaleString()}
            />
            <Stat
              label={lang === "mn" ? "Э/чулуу" : "Gems"}
              value={gems.toLocaleString()}
            />
          </div>

          <div className="rounded-xl border border-[color:var(--map-ui-border-subtle)] bg-[color-mix(in_srgb,var(--map-ui-base)_44%,transparent)] p-2.5 space-y-2">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {lang === "mn" ? "Мал сүрэг" : "Livestock"}
            </p>
            <p className="text-[11px] text-muted-foreground leading-snug">
              {lang === "mn" ? (
                <>
                  Малыг зөвхөн <strong>зоосоор</strong> авна.{" "}
                  {t.homeGemExchangePointer}
                </>
              ) : (
                <>
                  Livestock costs <strong>coins only</strong>.{" "}
                  {t.homeGemExchangePointer}
                </>
              )}
            </p>
            <div className="flex flex-wrap gap-2 text-sm text-foreground/95">
              <Chip>🐑 {sheep}</Chip>
              <Chip>🐐 {goat}</Chip>
              <Chip>🐄 {cow}</Chip>
              <Chip>🐎 {horse}</Chip>
              <Chip>🐫 {camel}</Chip>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mt-2">
              <LivestockBuyBtn
                loading={loading}
                onClick={() => void buy("sheep")}
                labelMn="Хонь авах"
                labelEn="Buy sheep"
                icon="🐑"
                price={LIVESTOCK_COIN_PRICES.sheep}
                coins={coins}
                lang={lang}
              />
              <LivestockBuyBtn
                loading={loading}
                onClick={() => void buy("goat")}
                labelMn="Ямаа авах"
                labelEn="Buy goat"
                icon="🐐"
                price={LIVESTOCK_COIN_PRICES.goat}
                coins={coins}
                lang={lang}
              />
              <LivestockBuyBtn
                loading={loading}
                onClick={() => void buy("cow")}
                labelMn="Үхэр авах"
                labelEn="Buy cow"
                icon="🐄"
                price={LIVESTOCK_COIN_PRICES.cow}
                coins={coins}
                lang={lang}
              />
              <LivestockBuyBtn
                loading={loading}
                onClick={() => void buy("horse")}
                labelMn="Морь авах"
                labelEn="Buy horse"
                icon="🐎"
                price={LIVESTOCK_COIN_PRICES.horse}
                coins={coins}
                lang={lang}
              />
              <LivestockBuyBtn
                loading={loading}
                onClick={() => void buy("camel")}
                labelMn="Тэмээ авах"
                labelEn="Buy camel"
                icon="🐫"
                price={LIVESTOCK_COIN_PRICES.camel}
                coins={coins}
                lang={lang}
              />
            </div>
          </div>

          <div className="rounded-xl border border-[color:var(--map-ui-border-subtle)] bg-[color-mix(in_srgb,var(--map-ui-base)_44%,transparent)] p-2.5 space-y-2">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {lang === "mn" ? "Гэр сайжруулах" : "Upgrade ger"}
            </p>
            <div className="rounded-lg border border-[color:var(--map-ui-border-subtle)] bg-[color-mix(in_srgb,var(--map-ui-base)_56%,transparent)] px-2 py-1.5">
              <p className="text-xs text-muted-foreground">
                {lang === "mn"
                  ? `Үнэ: ${upgradeCost.coins} зоос + ${upgradeCost.kp} МО`
                  : `Cost: ${upgradeCost.coins} coins + ${upgradeCost.kp} KP`}
              </p>
              {!canUpgrade ? (
                <p className="mt-1 text-[11px] text-rose-300">
                  {lang === "mn"
                    ? "Зоос эсвэл МО хүрэхгүй байна."
                    : "Not enough coins or KP."}
                </p>
              ) : null}
            </div>
            <Button
              type="button"
              className={cn(
                "w-full",
                canUpgrade
                  ? "border-emerald-400/20 bg-emerald-500/15 hover:bg-emerald-500/20"
                  : "",
              )}
              disabled={loading || !canUpgrade}
              onClick={() => void doUpgrade()}
            >
              {loading ? "…" : lang === "mn" ? "Сайжруулах" : "Upgrade"}
            </Button>
          </div>
        </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[color:var(--map-ui-border-subtle)] bg-[color-mix(in_srgb,var(--map-ui-base)_52%,transparent)] p-2 text-center">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="text-sm font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex min-h-[1.5rem] items-center gap-1 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-0.5 text-sm tabular-nums",
      )}
    >
      {children}
    </span>
  );
}

function LivestockBuyBtn({
  loading,
  onClick,
  labelMn,
  labelEn,
  icon,
  price,
  coins,
  lang,
}: {
  loading: boolean;
  onClick: () => void;
  labelMn: string;
  labelEn: string;
  icon: string;
  price: number;
  coins: number;
  lang: DashLang;
}) {
  const canBuy = coins >= price;
  return (
    <Button
      type="button"
      variant="secondary"
      disabled={loading || !canBuy}
      onClick={onClick}
      className={cn(
        "h-auto min-h-11 justify-between rounded-lg border px-2 py-2 transition",
        canBuy
          ? "border-emerald-400/20 bg-emerald-500/10 hover:bg-emerald-500/15"
          : "border-white/10 bg-white/5 opacity-55",
      )}
    >
      <span className="flex items-center justify-between gap-2">
        <span className="text-sm leading-none">{icon}</span>
        <span className="text-[11px] font-medium text-left flex-1">
          {lang === "mn" ? labelMn : labelEn}
        </span>
      </span>
      <span className="flex items-center justify-between gap-2 text-[11px] tabular-nums">
        <span className={canBuy ? "text-amber-300" : "text-muted-foreground"}>
          🪙 {price.toLocaleString()}
        </span>
        {!canBuy ? (
          <span className="text-[8px] text-rose-300">
            {lang === "mn" ? "Зоос хүрэхгүй" : "Not enough coins"}
          </span>
        ) : null}
      </span>
    </Button>
  );
}
