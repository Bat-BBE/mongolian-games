"use client";

import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getLeaderboard, type LeaderboardEntry } from "@/lib/api";
import type { DashLang } from "./dashboard-strings";

type LeaderboardModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lang: DashLang;
};

export function LeaderboardModal({ open, onOpenChange, lang }: LeaderboardModalProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setErr(null);
    void getLeaderboard()
      .then(({ entries: e }) => {
        if (!cancelled) setEntries(e);
      })
      .catch((e: unknown) => {
        if (!cancelled) setErr(e instanceof Error ? e.message : "Алдаа");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const title = lang === "mn" ? "Мэдлэгийн онооны жагсаалт" : "Knowledge points ranking";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-primary/20 bg-background/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2 text-lg">
            <Trophy className="size-5 text-[var(--gold-bright)]" strokeWidth={1.5} />
            {title}
          </DialogTitle>
        </DialogHeader>
        {err && (
          <p className="text-sm text-destructive">{err}</p>
        )}
        {loading && !err && (
          <p className="text-sm text-muted-foreground py-6 text-center">
            {lang === "mn" ? "Ачаалж байна…" : "Loading…"}
          </p>
        )}
        {!loading && !err && (
          <ul className="max-h-[min(60vh,420px)] overflow-y-auto space-y-1 pr-1">
            {entries.length === 0 ? (
              <li className="text-sm text-muted-foreground py-4 text-center">
                {lang === "mn" ? "Одоогоор мэдээлэл байхгүй." : "No entries yet."}
              </li>
            ) : (
              entries.map((e) => (
                <li
                  key={`${e.rank}-${e.name}`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-primary/10 bg-primary/5 px-3 py-2 text-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="tabular-nums font-mono text-[var(--gold-bright)] w-6 shrink-0">
                      {e.rank}
                    </span>
                    <span className="truncate font-medium">{e.name}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {e.hero_id ? (
                      <span className="text-[10px] uppercase text-muted-foreground font-mono">
                        {e.hero_id}
                      </span>
                    ) : null}
                    <span className="tabular-nums font-semibold text-primary">{e.xp} XP</span>
                  </div>
                </li>
              ))
            )}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
