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
        <p className="text-[10px] text-amber-100/88">
          {loc === "mn"
            ? "3 шоо нэг удаа: таны 3-ын нийлбэр > эсрэгийх бол тэр раунд таны 1 оноо. 5 ийм раунд = ялалт."
            : "Three dice at once: if your sum of three is higher, you win that round. First to 5 round-wins takes the match."}
        </p>
        <details
          className="mx-auto mt-1 max-w-sm rounded border border-amber-500/20 bg-black/25 px-2 py-1 text-left"
          open
        >
          <summary className="cursor-pointer text-[10px] font-semibold text-amber-200/90">
            {loc === "mn" ? "Дүрмийн товчоо" : "How it works"}
          </summary>
          <ul className="mt-1.5 list-disc space-y-1 pl-4 text-[9px] text-slate-400">
            <li>
              {loc === "mn"
                ? "Нийлбэр тэнцвэртэй → энэ раунд хоёр талд оноо нэмэгдэхгүй."
                : "If both totals tie, neither side gets a point that round."}
            </li>
            <li>
              {loc === "mn"
                ? "3D зөвхөн хөдөлгөөн; оноо нь зөвхөн 1–6-ын гурвын нийлбэр (3–18)."
                : "3D is just visuals; the game only compares the two triples of 1–6 (sums 3–18)."}
            </li>
            <li>
              {loc === "mn"
                ? "2 тоглогч: Online — дээд товч, зүүн эзэн, баруун зочин."
                : "2p online: top bar room; host = left, guest = right as labeled."}
            </li>
          </ul>
        </details>
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
