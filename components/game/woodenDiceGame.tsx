"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useApp } from "@/components/AppContext";
import { useInventoryGrant } from "./useInventoryGrant";
import { STONE_ROUND_COINS } from "./gameRewardConstants";
import { makeRng, rollTriple, ROUNDS_TO_WIN, sum3 } from "./woodenDiceType";
import { WoodenDiceSceneCanvas } from "./woodenDiceScene";

type T = [number, number, number];

export type WoodenDiceGameProps = {
  onComplete?: (result: "win" | "lose", progressPct?: number) => void;
};

export default function WoodenDiceGame({ onComplete }: WoodenDiceGameProps) {
  const { language } = useApp();
  const loc = language === "en" ? "en" : "mn";
  const { grant } = useInventoryGrant();
  const [round, setRound] = useState(1);
  const [sP, setSP] = useState(0);
  const [sB, setSB] = useState(0);
  const [la, setLa] = useState<T | null>(null);
  const [lb, setLb] = useState<T | null>(null);
  const [spin, setSpin] = useState(false);
  const [done, setDone] = useState(false);
  const seed = useRef(Math.floor(Math.random() * 0x7fffffff) | 0);
  const completeOnce = useRef(false);

  useEffect(() => {
    if (done) return;
    if (sP >= ROUNDS_TO_WIN) {
      setDone(true);
      if (!completeOnce.current) {
        completeOnce.current = true;
        grant({ coins: STONE_ROUND_COINS });
        onComplete?.("win", 100);
      }
      return;
    }
    if (sB >= ROUNDS_TO_WIN) {
      setDone(true);
      if (!completeOnce.current) {
        completeOnce.current = true;
        onComplete?.(
          "lose",
          Math.min(100, Math.round((sP / ROUNDS_TO_WIN) * 100)),
        );
      }
    }
  }, [sP, sB, done, grant, onComplete]);

  const runRound = useCallback(() => {
    if (done || spin) return;
    setSpin(true);
    setLa(null);
    setLb(null);
    const r0 = round;
    window.setTimeout(() => {
      const ra = makeRng(seed.current, r0, 1);
      const rb = makeRng(seed.current, r0, 2);
      const a = rollTriple(ra);
      const b = rollTriple(rb);
      const t = sum3(a);
      const u = sum3(b);
      setLa(a);
      setLb(b);
      setSpin(false);
      setRound((k) => k + 1);
      if (t > u) setSP((p) => p + 1);
      else if (u > t) setSB((c) => c + 1);
    }, 1500);
  }, [done, round, spin]);

  return (
    <div
      className="flex h-full min-h-0 w-full flex-col"
      style={{ background: "#080604" }}
    >
      <div className="shrink-0 px-3 py-1 text-center">
        <h2
          className="font-display text-sm font-bold text-amber-100 sm:text-base"
          style={{ textShadow: "0 0 18px rgba(200,160,48,0.2)" }}
        >
          {loc === "mn" ? "Модон шоо" : "Wooden dice duel"}
        </h2>
        <p className="text-[10px] text-slate-500">
          {loc === "mn"
            ? "Мод, ноосон дэвсгэр. Гурван шоо — нийлбэрээр уралдана. 5 оноо."
            : "Felt, carved wood. Three dice; higher total wins the round. First to 5."}
        </p>
        <div className="mt-1 flex justify-center gap-4 font-mono text-xs text-amber-200/90">
          <span>
            {loc === "mn" ? "Та" : "You"}: {sP}
          </span>
          <span>
            {loc === "mn" ? "Өрсөлдөгч" : "Foe"}: {sB}
          </span>
        </div>
      </div>
      <div className="relative min-h-0 w-full flex-1">
        <WoodenDiceSceneCanvas spin={spin} />
        <div className="pointer-events-none absolute inset-0 flex items-end justify-center gap-8 pb-2 sm:pb-3">
          <div className="w-20 text-center">
            <p className="text-[9px] uppercase text-slate-500">
              {loc === "mn" ? "Та" : "You"}
            </p>
            <p className="text-2xl font-bold text-sky-200 tabular-nums">
              {la ? sum3(la) : "—"}
            </p>
            <p className="text-[9px] text-slate-600">{la ? la.join(" · ") : ""}</p>
          </div>
          <div className="w-20 text-center">
            <p className="text-[9px] uppercase text-slate-500">
              {loc === "mn" ? "Өрсөлдөгч" : "Foe"}
            </p>
            <p className="text-2xl font-bold text-rose-200/95 tabular-nums">
              {lb ? sum3(lb) : "—"}
            </p>
            <p className="text-[9px] text-slate-600">{lb ? lb.join(" · ") : ""}</p>
          </div>
        </div>
      </div>
      {!done && (
        <div className="shrink-0 p-2 text-center">
          <button
            type="button"
            onClick={() => void runRound()}
            disabled={spin}
            className="rounded-lg border border-amber-500/50 bg-amber-950/40 px-5 py-2.5 text-sm font-semibold text-amber-100 disabled:opacity-50"
          >
            {loc === "mn" ? "Шидэх" : "Roll"}
          </button>
        </div>
      )}
    </div>
  );
}
