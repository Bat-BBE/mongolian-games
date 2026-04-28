"use client";

import { useApp } from "@/components/AppContext";
import { useCallback, useEffect, useRef, useState } from "react";
import { useInventoryGrant } from "./useInventoryGrant";
import { STONE_ROUND_COINS } from "./gameRewardConstants";
import { buildSeq, WIN_LEVEL } from "./stoneCairnType";
import { StoneCairnSceneCanvas } from "./stoneCairnScene";
import {
  playCairnGameStart,
  playCairnInputMiss,
  playCairnInputTap,
  playCairnShowStoneBlink,
} from "@/lib/uiSounds";
import {
  GAME_RULES_OL_CLASS,
  GAME_TEXT_BODY,
  GAME_TEXT_LEAD,
  GAME_TEXT_META,
} from "./gameUiTheme";

export type StoneCairnMemoryGameProps = {
  onComplete?: (result: "win" | "lose", progressPct?: number) => void;
  /** Omitted in solo: random. MP: match seed. */
  baseSeed?: number;
  /** PvP: do not call onComplete here — parent decides after both finish */
  mode?: "solo" | "mp";
  onLocalFinish?: (payload: { best: number; won: boolean }) => void;
};

export default function StoneCairnMemoryGame({
  onComplete,
  baseSeed: baseSeedProp,
  mode = "solo",
  onLocalFinish,
}: StoneCairnMemoryGameProps) {
  const { language } = useApp();
  const loc = language === "en" ? "en" : "mn";
  const { grant } = useInventoryGrant();
  const [localSeed] = useState(() => Math.floor(Math.random() * 1e9) | 0);
  const base = baseSeedProp ?? localSeed;
  const [len, setLen] = useState(1);
  const [phase, setPhase] = useState<"off" | "show" | "input" | "end">("off");
  const [inputPos, setInputPos] = useState(0);
  const [active, setActive] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [pressFlash, setPressFlash] = useState<number | null>(null);
  const [errorFlash, setErrorFlash] = useState<number | null>(null);
  const doneOnce = useRef(false);
  type TTimer = ReturnType<typeof setTimeout>;
  const timers = useRef<TTimer[]>([]);
  const seq = buildSeq(len, base);
  const clearT = useCallback(() => {
    for (const t of timers.current) {
      clearTimeout(t);
    }
    timers.current = [];
  }, []);

  const finishSolo = useCallback(
    (best: number, won: boolean) => {
      if (doneOnce.current) return;
      doneOnce.current = true;
      if (won) {
        grant({ coins: STONE_ROUND_COINS });
        onComplete?.("win", 100);
        return;
      }
      onComplete?.(
        "lose",
        Math.min(100, Math.round((best / WIN_LEVEL) * 100)),
      );
    },
    [grant, onComplete],
  );

  const handleFail = useCallback(
    (best: number) => {
      setPhase("end");
      setMessage(loc === "mn" ? "Дууссан" : "Over");
      if (mode === "mp") {
        onLocalFinish?.({ best, won: false });
        return;
      }
      finishSolo(best, false);
    },
    [finishSolo, loc, mode, onLocalFinish],
  );

  const handleWin = useCallback(() => {
    setPhase("end");
    setMessage(loc === "mn" ? "Ялалт — овоо" : "Victory at the cairn");
    if (mode === "mp") {
      onLocalFinish?.({ best: WIN_LEVEL, won: true });
      return;
    }
    finishSolo(WIN_LEVEL, true);
  }, [finishSolo, loc, mode, onLocalFinish]);

  useEffect(() => {
    if (phase !== "show") return;
    clearT();
    const s = buildSeq(len, base);
    let step = 0;
    const run = () => {
      if (step >= s.length) {
        setActive(null);
        setPhase("input");
        setInputPos(0);
        return;
      }
      setActive(s[step]!);
      playCairnShowStoneBlink();
      const t0 = setTimeout(() => {
        setActive(null);
        const t1 = setTimeout(() => {
          step += 1;
          run();
        }, 180);
        timers.current.push(t1);
      }, 480);
      timers.current.push(t0);
    };
    run();
    return () => {
      clearT();
    };
  }, [base, clearT, len, phase]);

  const onStone = useCallback(
    (i: number) => {
      if (phase !== "input" || inputPos < 0) return;
      if (errorFlash !== null) return;
      const s = buildSeq(len, base);
      if (s[inputPos] !== i) {
        playCairnInputMiss();
        setErrorFlash(i);
        const t = setTimeout(() => {
          setErrorFlash(null);
          handleFail(Math.max(0, len - 1));
        }, 300);
        timers.current.push(t);
        return;
      }
      playCairnInputTap();
      setPressFlash(i);
      // Not in timers: clearT() on next "show" would cancel this and leave pressFlash stuck
      window.setTimeout(() => setPressFlash(null), 220);
      if (inputPos + 1 >= s.length) {
        if (len === WIN_LEVEL) {
          handleWin();
          return;
        }
        setLen((l) => l + 1);
        setPhase("show");
        return;
      }
      setInputPos((p) => p + 1);
    },
    [base, errorFlash, handleFail, handleWin, inputPos, len, phase],
  );

  const start = useCallback(() => {
    if (mode === "solo") doneOnce.current = false;
    clearT();
    setLen(1);
    setPhase("show");
    setMessage("");
    setPressFlash(null);
    setErrorFlash(null);
    playCairnGameStart();
  }, [clearT, mode]);

  return (
    <div
      className="flex h-full min-h-0 w-full flex-col"
      style={{ background: "#040608" }}
    >
      <div className="shrink-0 px-3 py-1 text-center">
        <h2
          className="font-display text-sm font-bold text-amber-100 sm:text-base"
          style={{ textShadow: "0 0 18px rgba(200,160,48,0.2)" }}
        >
          {loc === "mn" ? "Чулуун овоо" : "Stone cairn memory"}
        </h2>
        <p className={`${GAME_TEXT_LEAD} text-center`}>
          {loc === "mn"
            ? "5 товч (1–5): дараалал гялс гарна → та ижил дарааллаар дар. Алхам бүр нэг оноо нэмнэ. 10 зөв алхам = ялалт."
            : "Five buttons (1–5): watch the flash, then tap the same order. Each success adds a new step. A full 10-step run with no error = win."}
        </p>
        <details
          className="mx-auto mt-1.5 max-w-md rounded border border-sky-500/25 bg-black/30 px-2 py-1 text-left"
          open
        >
          <summary
            className={`${GAME_TEXT_BODY} cursor-pointer font-semibold text-sky-200/90`}
          >
            {loc === "mn" ? "Дүрмийн дэлгэрэнгүй" : "Full rules (short)"}
          </summary>
          <ol className={`mt-1.5 !space-y-1 ${GAME_RULES_OL_CLASS} text-slate-400`}>
            <li>
              {loc === "mn"
                ? "«Харагдах» үед зөвхөн ажиглана; «Оруулах» үед 1–5-ыг дараалалд дарна."
                : "During “show”, only watch. During “input”, tap 1–5 in order."}
            </li>
            <li>
              {loc === "mn"
                ? "Нэг буруу даралт = тоглолт дуусна. Оноо: хамгийн сайн дарааллын урт (тоглолт дууссаны дараа)."
                : "One wrong tap = run ends. Your “best” length is how far you got before a mistake (see end message)."}
            </li>
            <li>
              {loc === "mn"
                ? "2 тоглогч онлайн: өрөө, эзэн — зүүн; нэгдсэн дүрмээр оноо тэмдэглэнэ."
                : "2p online: room, host = left; scores follow the match panel there."}
            </li>
          </ol>
        </details>
        <p className={`mt-0.5 ${GAME_TEXT_META} text-amber-200/60`}>{message}</p>
      </div>
      <div className="relative min-h-0 w-full flex-1">
        <StoneCairnSceneCanvas
          activeIndex={active}
          playing={phase === "show" || phase === "input"}
          dim={phase === "end" || phase === "off"}
        />
      </div>
      <div className="shrink-0 flex flex-wrap justify-center gap-1.5 p-2">
        {phase === "off" || phase === "end" ? (
          <button
            type="button"
            onClick={start}
            className="rounded-lg border border-sky-500/40 bg-sky-950/40 px-4 py-2 text-xs font-semibold text-sky-100"
          >
            {loc === "mn" ? "Эхлэх" : "Start"}
          </button>
        ) : null}
        {phase === "input" ? (
          <div className="flex w-full max-w-sm flex-wrap justify-center gap-2 sm:gap-2.5">
            {[0, 1, 2, 3, 4].map((i) => {
              const isErr = errorFlash === i;
              const isHit = pressFlash === i;
              return (
                <button
                  key={i}
                  type="button"
                  style={{ WebkitTapHighlightColor: "transparent" }}
                  onClick={() => onStone(i)}
                  className={[
                    "h-10 min-w-[2.6rem] touch-manipulation select-none rounded-lg border-2 px-2.5",
                    "text-sm font-bold transition-all duration-100 ease-out will-change-transform",
                    "border-white/32 bg-gradient-to-b from-white/[0.12] to-white/[0.04] text-amber-50/95",
                    "shadow-[0_4px_0_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.12)]",
                    "hover:-translate-y-px hover:border-sky-300/60 hover:from-sky-500/20 hover:shadow-[0_5px_0_rgba(0,0,0,0.4)]",
                    "active:translate-y-0.5 active:scale-[0.94] active:shadow-[0_1px_0_rgba(0,0,0,0.55),inset_0_2px_8px_rgba(0,0,0,0.3)]",
                    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-sky-400/80",
                    isErr
                      ? "z-10 !border-rose-400/95 !from-rose-500/30 !to-rose-900/30 !text-rose-100 ring-2 !ring-rose-300/55"
                      : isHit
                        ? "z-10 !border-amber-200/85 !from-amber-400/25 !to-amber-950/20 !text-amber-50 ring-2 !ring-amber-200/65"
                        : "",
                  ].join(" ")}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        ) : null}
        {phase === "show" ? (
          <p className={`w-full text-center ${GAME_TEXT_META} text-amber-200/50`}>
            {loc === "mn" ? "… харагдаж байна" : "Watch…"}
          </p>
        ) : null}
      </div>
    </div>
  );
}
