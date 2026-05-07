"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  GAME_CTA_SECONDARY,
  GAME_PANEL_CHROME,
  GAME_PANEL_OVERLINE_CLASS,
  GAME_TEXT_BODY,
  GAME_TEXT_META,
} from "@/components/game/gameUiTheme";
import { cn } from "@/lib/utils";
import { solveOnisogo, type OnisogoMapPoint } from "@/lib/api";
import type { DashLang, DashStrings } from "./dashboard-strings";
import { LuCheck, LuCoins, LuSparkles } from "react-icons/lu";

type MapOnisogoModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  point: OnisogoMapPoint | null;
  lang: DashLang;
  t: DashStrings;
  userEmail: string;
  solved: boolean;
  onSolved: (coins: number) => void;
};

export function MapOnisogoModal({
  open,
  onOpenChange,
  point,
  lang,
  t,
  userEmail,
  solved,
  onSolved,
}: MapOnisogoModalProps) {
  const [picked, setPicked] = useState<string | null>(null);
  const [wrong, setWrong] = useState(false);
  const [busy, setBusy] = useState(false);
  const [won, setWon] = useState(false);
  const [lastCoins, setLastCoins] = useState(0);

  useEffect(() => {
    if (!open) {
      setPicked(null);
      setWrong(false);
      setBusy(false);
      setWon(false);
      setLastCoins(0);
    }
  }, [open, point?.slug]);

  const submit = useCallback(
    async (answer: string) => {
      if (!point || solved || won || busy) return;
      setBusy(true);
      setWrong(false);
      try {
        const r = await solveOnisogo({
          email: userEmail,
          slug: point.slug,
          answer,
          lang,
        });
        setWon(true);
        setLastCoins(r.coinsAwarded);
        onSolved(r.coinsAwarded);
      } catch {
        setWrong(true);
      } finally {
        setBusy(false);
      }
    },
    [busy, lang, onSolved, point, solved, userEmail, won],
  );

  if (!point) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className={cn(
          "max-w-[min(calc(100%-1rem),26rem)] gap-0 overflow-hidden border-0 p-0 sm:max-w-md",
        )}
        style={GAME_PANEL_CHROME}
      >
        <div className="max-h-[min(88vh,640px)] overflow-y-auto px-4 pb-4 pt-3 sm:px-5 sm:pb-5 sm:pt-4">
          <DialogHeader className="space-y-1.5 pb-3 text-left">
            <p className={GAME_PANEL_OVERLINE_CLASS}>{t.mapOnisogoBadge}</p>
            <DialogTitle
              className="flex items-start gap-2 pr-8 text-left text-base font-semibold leading-snug text-amber-100/95 sm:text-lg"
              style={{ fontFamily: GAME_PANEL_CHROME.fontFamily }}
            >
              <span className="text-xl leading-none" aria-hidden>
                {point.icon}
              </span>
              <span className="min-w-0">{point.title}</span>
            </DialogTitle>
          </DialogHeader>

          {solved || won ? (
            <div className="space-y-3 rounded-xl border border-emerald-500/35 bg-emerald-950/35 px-3 py-3 sm:px-4">
              <div className="flex items-center gap-2 text-emerald-200/95">
                <LuCheck className="size-5 shrink-0" aria-hidden />
                <span className={cn(GAME_TEXT_BODY, "!text-emerald-100/95")}>
                  {t.mapOnisogoSolvedToast}
                </span>
              </div>
              {won ? (
                <div className="flex items-center gap-2 rounded-lg border border-amber-400/25 bg-black/25 px-3 py-2">
                  <LuCoins className="size-4 text-amber-300" aria-hidden />
                  <span className={GAME_TEXT_META}>
                    {t.mapOnisogoCoinsEarned.replace("{n}", String(lastCoins))}
                  </span>
                </div>
              ) : null}
              <button
                type="button"
                className={GAME_CTA_SECONDARY}
                onClick={() => onOpenChange(false)}
              >
                {t.mapOnisogoClose}
              </button>
            </div>
          ) : (
            <>
              <pre
                className={cn(
                  GAME_TEXT_BODY,
                  "mb-4 whitespace-pre-wrap rounded-xl border border-white/10 bg-black/28 px-3 py-3 font-sans",
                )}
                style={{ color: "rgba(228,228,231,0.94)" }}
              >
                {point.question}
              </pre>
              <p className={cn(GAME_TEXT_META, "mb-2")}>
                {t.mapOnisogoPickHint}
              </p>
              <div className="grid gap-2">
                {point.choices.map((c) => {
                  const sel = picked === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        setPicked(c);
                        void submit(c);
                      }}
                      className={cn(
                        "min-h-[2.65rem] rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition",
                        "border-amber-500/35 bg-amber-950/25 text-amber-50/95",
                        "hover:border-amber-400/55 hover:bg-amber-900/35",
                        "disabled:opacity-60",
                        sel &&
                          "ring-2 ring-amber-400/50 border-amber-400/55 bg-amber-900/40",
                      )}
                      style={{ fontFamily: GAME_PANEL_CHROME.fontFamily }}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
              {wrong ? (
                <p
                  className={cn(GAME_TEXT_META, "mt-3 text-rose-300/95")}
                  role="alert"
                >
                  {t.mapOnisogoWrong}
                </p>
              ) : null}
            </>
          )}
        </div>
        {!solved && !won ? (
          <div className="flex items-center gap-2 border-t border-white/10 px-4 py-2.5 sm:px-5">
            <LuSparkles className="size-4 text-violet-300/90" aria-hidden />
            <span className={GAME_TEXT_META}>
              {lang === "mn"
                ? `Зөв бол +${point.coinReward} зоос`
                : `Correct: +${point.coinReward} coins`}
            </span>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
