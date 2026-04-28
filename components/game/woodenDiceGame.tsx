"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useApp } from "@/components/AppContext";
import { useInventoryGrant } from "./useInventoryGrant";
import { STONE_ROUND_COINS } from "./gameRewardConstants";
import { makeRng, rollTriple, ROUNDS_TO_WIN, sum3 } from "./woodenDiceType";
import { TripleDiceReadout } from "./woodenDiceReadout";
import { WoodenDiceSceneCanvas } from "./woodenDiceScene";
import { playWoodenDiceRoll } from "@/lib/uiSounds";
import { GameResultEndOverlay } from "./GameResultEndOverlay";
import {
  GAME_CTA_PRIMARY,
  GAME_TEXT_LEAD,
} from "./gameUiTheme";

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
  const [outcome, setOutcome] = useState<"win" | "lose" | null>(null);
  const seed = useRef(Math.floor(Math.random() * 0x7fffffff) | 0);
  const completeOnce = useRef(false);

  useEffect(() => {
    if (done) return;
    if (sP >= ROUNDS_TO_WIN) {
      setDone(true);
      setOutcome("win");
      if (!completeOnce.current) {
        completeOnce.current = true;
        grant({ coins: STONE_ROUND_COINS });
        onComplete?.("win", 100);
      }
      return;
    }
    if (sB >= ROUNDS_TO_WIN) {
      setDone(true);
      setOutcome("lose");
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
    playWoodenDiceRoll();
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

  const n = ROUNDS_TO_WIN;
  const winTitle =
    loc === "mn" ? `🎉 Яллаа — эхний ${n} оноо` : `🎉 You won — first to ${n}`;
  const loseTitle = loc === "mn" ? "⏱ Хожигдлоо" : "⏱ You lost";
  const subWin =
    loc === "mn"
      ? "Тоглолт дууслаа. Модал удахгүй хаагдана."
      : "Match finished. The window will close in a moment.";
  const subLose =
    loc === "mn"
      ? "Өрсөлдөгч түрүүллээ. Модал удахгүй хаагдана."
      : "Your opponent won. The window will close in a moment.";

  return (
    <div
      className="relative flex h-full min-h-0 w-full flex-col"
      style={{ background: "#080604" }}
    >
      <div className="shrink-0 px-3 py-1 text-center">
        <h2
          className="font-display text-sm font-bold text-amber-100 sm:text-base"
          style={{ textShadow: "0 0 18px rgba(200,160,48,0.2)" }}
        >
          {loc === "mn" ? "Модон шоо" : "Wooden dice duel"}
        </h2>
        <p className={`${GAME_TEXT_LEAD} text-center`}>
          {loc === "mn"
            ? "3 шоо шидэж нийлбэрээр өрсөлдөнө. Түрүүлж 5 оноо авбал ялна."
            : "Roll 3 dice and compare sums. First to 5 points wins."}
        </p>
        <div className="mt-1.5 flex justify-center gap-4 font-mono text-xs text-amber-200/90">
          <span>
            {loc === "mn" ? "Та" : "You"}: {sP}
          </span>
          <span>
            {loc === "mn" ? "Өрсөлдөгч" : "Foe"}: {sB}
          </span>
        </div>
      </div>
      <div className="flex min-h-0 w-full flex-1 flex-col">
        <div
          className="flex min-h-0 flex-1 flex-row items-stretch gap-0.5 px-0.5 sm:gap-1.5 sm:px-1"
          style={{ minHeight: "clamp(11rem, 28vh, 100%)" }}
        >
          <div className="flex w-[28%] max-w-[6.5rem] min-w-0 shrink-0 sm:max-w-[7.5rem]">
            <TripleDiceReadout
              triple={la}
              label={loc === "mn" ? "Та" : "You"}
              sumLabel={loc === "mn" ? "Нийлбэр" : "Total"}
              sum={spin || !la ? null : sum3(la)}
              dieLabels={["1", "2", "3"]}
              tone="sky"
              spinning={spin}
              compact
            />
          </div>
          <div className="min-h-0 min-w-0 flex-1">
            <WoodenDiceSceneCanvas
              spin={spin}
              leftTriple={la ?? [1, 1, 1]}
              rightTriple={lb ?? [1, 1, 1]}
            />
          </div>
          <div className="flex w-[28%] max-w-[6.5rem] min-w-0 shrink-0 sm:max-w-[7.5rem]">
            <TripleDiceReadout
              triple={lb}
              label={loc === "mn" ? "Өрсөлдөгч" : "Foe"}
              sumLabel={loc === "mn" ? "Нийлбэр" : "Total"}
              sum={spin || !lb ? null : sum3(lb)}
              dieLabels={["1", "2", "3"]}
              tone="rose"
              spinning={spin}
              compact
            />
          </div>
        </div>
      </div>
      {!done && (
        <div className="shrink-0 p-2 text-center">
          <button
            type="button"
            onClick={() => void runRound()}
            disabled={spin}
            className={GAME_CTA_PRIMARY}
          >
            {loc === "mn" ? "Шоо шидэх" : "Roll dice"}
          </button>
        </div>
      )}

      <GameResultEndOverlay
        outcome={outcome}
        winTitle={winTitle}
        loseTitle={loseTitle}
        subWin={subWin}
        subLose={subLose}
      />
    </div>
  );
}
