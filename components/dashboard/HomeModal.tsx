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
  onChanged?: () => void;
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

  async function doUpgrade() {
    if (!email) return;
    setLoading(true);
    setErr(null);
    try {
      await homeUpgradeGer({ email });
      onChanged?.();
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
      await homeBuyLivestock({ email, kind, qty: 1 });
      onChanged?.();
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(100vw-1.5rem,560px)] max-h-[min(90vh,760px)] overflow-y-auto border border-primary/25 bg-background/98 backdrop-blur-xl flex flex-col gap-2">
        <DialogHeader>
          <DialogTitle
            className="font-display tracking-wide flex items-center justify-center gap-2 text-center"
            style={{ color: "var(--primary)" }}
          >
            {title}
          </DialogTitle>
        </DialogHeader>

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

        <div className="rounded-xl border border-primary/15 bg-primary/[0.04] p-2 space-y-2">
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {lang === "mn" ? "Мал сүрэг" : "Livestock"}
          </p>
          <p className="text-[11px] text-muted-foreground leading-snug">
            {lang === "mn" ? (
              <>
                Малыг зөвхөн <strong>зоосоор</strong> авна. {t.homeGemExchangePointer}
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
              price={LIVESTOCK_COIN_PRICES.sheep}
              lang={lang}
            />
            <LivestockBuyBtn
              loading={loading}
              onClick={() => void buy("goat")}
              labelMn="Ямаа авах"
              labelEn="Buy goat"
              price={LIVESTOCK_COIN_PRICES.goat}
              lang={lang}
            />
            <LivestockBuyBtn
              loading={loading}
              onClick={() => void buy("cow")}
              labelMn="Үхэр авах"
              labelEn="Buy cow"
              price={LIVESTOCK_COIN_PRICES.cow}
              lang={lang}
            />
            <LivestockBuyBtn
              loading={loading}
              onClick={() => void buy("horse")}
              labelMn="Морь авах"
              labelEn="Buy horse"
              price={LIVESTOCK_COIN_PRICES.horse}
              lang={lang}
            />
            <LivestockBuyBtn
              loading={loading}
              onClick={() => void buy("camel")}
              labelMn="Тэмээ авах"
              labelEn="Buy camel"
              price={LIVESTOCK_COIN_PRICES.camel}
              lang={lang}
            />
          </div>
        </div>

        <div className="rounded-xl border border-primary/15 bg-primary/[0.04] p-2 space-y-2">
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {lang === "mn" ? "Гэр сайжруулах" : "Upgrade ger"}
          </p>
          <p className="text-xs text-muted-foreground">
            {lang === "mn"
              ? `Үнэ: ${upgradeCost.coins} зоос + ${upgradeCost.kp} МО`
              : `Cost: ${upgradeCost.coins} coins + ${upgradeCost.kp} KP`}
          </p>
          <Button
            type="button"
            className="w-full"
            disabled={loading}
            onClick={() => void doUpgrade()}
          >
            {loading ? "…" : lang === "mn" ? "Сайжруулах" : "Upgrade"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="admin-panel rounded-xl p-2 text-center">
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
  price,
  lang,
}: {
  loading: boolean;
  onClick: () => void;
  labelMn: string;
  labelEn: string;
  price: number;
  lang: DashLang;
}) {
  return (
    <Button
      type="button"
      variant="secondary"
      disabled={loading}
      onClick={onClick}
      className="h-auto min-h-10 flex flex-col items-stretch gap-0.5 py-2"
    >
      <span className="text-xs font-medium">
        {lang === "mn" ? labelMn : labelEn}
      </span>
      <span className="text-[11px] tabular-nums text-muted-foreground">
        🪙 {price.toLocaleString()}
      </span>
    </Button>
  );
}
