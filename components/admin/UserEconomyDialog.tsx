"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  adminPatchUser,
  type AdminTreasuryUserRow,
  type AdminUserPatchBody,
} from "@/lib/api";

export type TreasuryUserRow = AdminTreasuryUserRow;

function num(v: string): number {
  const n = Number.parseInt(v.replace(/\s/g, ""), 10);
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

export function UserEconomyDialog({
  open,
  onOpenChange,
  token,
  user,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: string | null;
  user: TreasuryUserRow | null;
  onSaved: () => void;
}) {
  const [displayName, setDisplayName] = useState("");
  const [wealthScore, setWealthScore] = useState("0");
  const [xp, setXp] = useState("0");
  const [gerLevel, setGerLevel] = useState("1");
  const [kp, setKp] = useState("0");
  const [coins, setCoins] = useState("0");
  const [gems, setGems] = useState("0");
  const [sheep, setSheep] = useState("0");
  const [goat, setGoat] = useState("0");
  const [cow, setCow] = useState("0");
  const [horse, setHorse] = useState("0");
  const [camel, setCamel] = useState("0");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !open) return;
    setDisplayName(user.display_name?.trim() ?? "");
    setWealthScore(String(user.wealth_score ?? 0));
    setXp(String(user.xp ?? 0));
    setGerLevel(String(Math.max(1, user.ger_level ?? 1)));
    setKp(String(user.kp ?? 0));
    setCoins(String(user.coins ?? 0));
    setGems(String(user.gems ?? 0));
    setSheep(String(user.sheep ?? 0));
    setGoat(String(user.goat ?? 0));
    setCow(String(user.cow ?? 0));
    setHorse(String(user.horse ?? 0));
    setCamel(String(user.camel ?? 0));
    setError(null);
  }, [user, open]);

  const handleSave = useCallback(async () => {
    const t = token?.trim();
    if (!t || !user) return;
    setSaving(true);
    setError(null);
    const body: AdminUserPatchBody = {
      displayName: displayName.trim() || undefined,
      wealthScore: num(wealthScore),
      xp: num(xp),
      gerLevel: Math.max(1, num(gerLevel)),
      kp: num(kp),
      coins: num(coins),
      gems: num(gems),
      sheep: num(sheep),
      goat: num(goat),
      cow: num(cow),
      horse: num(horse),
      camel: num(camel),
    };
    if (!body.displayName) delete body.displayName;
    try {
      await adminPatchUser(t, user.id, body);
      onOpenChange(false);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Алдаа");
    } finally {
      setSaving(false);
    }
  }, [
    token,
    user,
    displayName,
    wealthScore,
    xp,
    gerLevel,
    kp,
    coins,
    gems,
    sheep,
    goat,
    cow,
    horse,
    camel,
    onOpenChange,
    onSaved,
  ]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto border-[var(--admin-border)] bg-[var(--admin-elevated)] text-[var(--admin-text)]">
        <DialogHeader>
          <DialogTitle className="font-display text-[var(--admin-text)]">
            Хэрэглэгчийн эдийн засаг засах
          </DialogTitle>
          {user && (
            <p className="text-xs font-mono text-[var(--admin-muted)] pt-1">
              {user.email}
            </p>
          )}
        </DialogHeader>

        {error && (
          <div className="text-sm text-red-400 px-1 py-2 rounded bg-red-950/40 border border-red-900/50">
            {error}
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2 space-y-1.5">
            <Label className="text-[var(--admin-subtle)]">Нэр (хоч)</Label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="border-[var(--admin-border)] bg-[var(--admin-bg)]"
              placeholder="Display name"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[var(--admin-subtle)]">Үнэлгээ (wealthScore)</Label>
            <Input
              inputMode="numeric"
              value={wealthScore}
              onChange={(e) => setWealthScore(e.target.value)}
              className="border-[var(--admin-border)] bg-[var(--admin-bg)] tabular-nums"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[var(--admin-subtle)]">МО (kp)</Label>
            <Input
              inputMode="numeric"
              value={kp}
              onChange={(e) => setKp(e.target.value)}
              className="border-[var(--admin-border)] bg-[var(--admin-bg)] tabular-nums"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[var(--admin-subtle)]">XP</Label>
            <Input
              inputMode="numeric"
              value={xp}
              onChange={(e) => setXp(e.target.value)}
              className="border-[var(--admin-border)] bg-[var(--admin-bg)] tabular-nums"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[var(--admin-subtle)]">Гэрийн түвшин</Label>
            <Input
              inputMode="numeric"
              value={gerLevel}
              onChange={(e) => setGerLevel(e.target.value)}
              className="border-[var(--admin-border)] bg-[var(--admin-bg)] tabular-nums"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[var(--admin-subtle)]">Зоос</Label>
            <Input
              inputMode="numeric"
              value={coins}
              onChange={(e) => setCoins(e.target.value)}
              className="border-[var(--admin-border)] bg-[var(--admin-bg)] tabular-nums"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[var(--admin-subtle)]">Эрдэнэ (gems)</Label>
            <Input
              inputMode="numeric"
              value={gems}
              onChange={(e) => setGems(e.target.value)}
              className="border-[var(--admin-border)] bg-[var(--admin-bg)] tabular-nums"
            />
          </div>
          <div className="sm:col-span-2 text-[10px] uppercase tracking-wider text-[var(--admin-subtle)] pt-2">
            Мал
          </div>
          {(
            [
              ["Хонь", sheep, setSheep],
              ["Ямаа", goat, setGoat],
              ["Үхэр", cow, setCow],
              ["Морь", horse, setHorse],
              ["Тэмээ", camel, setCamel],
            ] as const
          ).map(([label, val, setVal]) => (
            <div key={label} className="space-y-1.5">
              <Label className="text-[var(--admin-subtle)]">{label}</Label>
              <Input
                inputMode="numeric"
                value={val}
                onChange={(e) => setVal(e.target.value)}
                className="border-[var(--admin-border)] bg-[var(--admin-bg)] tabular-nums"
              />
            </div>
          ))}
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            className="border-[var(--admin-border)]"
            disabled={saving}
            onClick={() => onOpenChange(false)}
          >
            Болих
          </Button>
          <Button
            type="button"
            disabled={saving || !user || !token?.trim()}
            onClick={() => void handleSave()}
          >
            {saving ? "Хадгалж байна…" : "Хадгалах"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
