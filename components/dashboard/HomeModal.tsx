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
import { getDashboardBundle, homeBuyLivestock, homeUpgradeGer } from "@/lib/api";
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
        setHorse(Math.max(0, Math.floor(num(ls.horse, 0))));
        setCamel(Math.max(0, Math.floor(num(ls.camel, 0))));
      })
      .catch((e: unknown) => {
        setErr(e instanceof Error ? e.message : "Алдаа");
      })
      .finally(() => setLoading(false));
  }, [open, lang]);

  const title = useMemo(
    () => (lang === "mn" ? "Миний гэр" : "My ger"),
    [lang],
  );

  const upgradeCost = useMemo(() => ({ coins: 200 + gerLevel * 80, kp: 60 + gerLevel * 15 }), [gerLevel]);

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

  async function buy(kind: "sheep" | "horse" | "camel") {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(100vw-1.5rem,560px)] max-h-[min(90vh,760px)] overflow-y-auto border border-primary/25 bg-background/98 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="font-display tracking-wide">{title}</DialogTitle>
        </DialogHeader>

        {err ? <p className="text-sm text-destructive">{err}</p> : null}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Stat label={lang === "mn" ? "Гэрийн түвшин" : "Ger level"} value={`Lv ${gerLevel}`} />
          <Stat label={lang === "mn" ? "Эрдэнэс (МО)" : "KP"} value={kp.toLocaleString()} />
          <Stat label={lang === "mn" ? "Зоос" : "Coins"} value={coins.toLocaleString()} />
          <Stat label={lang === "mn" ? "Эрдэнийн чулуу" : "Gems"} value={gems.toLocaleString()} />
        </div>

        <div className="rounded-xl border border-primary/15 bg-primary/[0.04] p-3">
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
            {lang === "mn" ? "Мал сүрэг" : "Livestock"}
          </p>
          <div className="flex flex-wrap gap-2 text-sm">
            <Chip>🐑 {sheep}</Chip>
            <Chip>🐎 {horse}</Chip>
            <Chip>🐫 {camel}</Chip>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-3">
            <Button type="button" variant="secondary" disabled={loading} onClick={() => void buy("sheep")}>
              {lang === "mn" ? "Хонь авах" : "Buy sheep"}
            </Button>
            <Button type="button" variant="secondary" disabled={loading} onClick={() => void buy("horse")}>
              {lang === "mn" ? "Морь авах" : "Buy horse"}
            </Button>
            <Button type="button" variant="secondary" disabled={loading} onClick={() => void buy("camel")}>
              {lang === "mn" ? "Тэмээ авах" : "Buy camel"}
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-primary/15 bg-primary/[0.04] p-3 space-y-2">
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {lang === "mn" ? "Гэр сайжруулах" : "Upgrade ger"}
          </p>
          <p className="text-xs text-muted-foreground">
            {lang === "mn"
              ? `Үнэ: ${upgradeCost.coins} зоос + ${upgradeCost.kp} МО`
              : `Cost: ${upgradeCost.coins} coins + ${upgradeCost.kp} KP`}
          </p>
          <Button type="button" className="w-full" disabled={loading} onClick={() => void doUpgrade()}>
            {loading ? "…" : lang === "mn" ? "Сайжруулах" : "Upgrade"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="admin-panel rounded-xl p-3 text-center">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className={cn("text-xs px-2 py-1 rounded-full border border-primary/20 bg-primary/5")}>
      {children}
    </span>
  );
}

