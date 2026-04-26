"use client";

import { useApp } from "@/components/AppContext";
import { useCallback, useEffect, useRef, useState } from "react";
import { useInventoryGrant } from "./useInventoryGrant";
import { STONE_ROUND_COINS } from "./gameRewardConstants";
import { buildSeq, WIN_LEVEL } from "./stoneCairnType";
import { StoneCairnSceneCanvas } from "./stoneCairnScene";

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
  const doneOnce = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const seq = buildSeq(len, base);
  const clearT = useCallback(() => {
    for (const t of timers.current) clearTimeout(t);
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
      const s = buildSeq(len, base);
      if (s[inputPos] !== i) {
        handleFail(Math.max(0, len - 1));
        return;
      }
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
    [base, handleFail, handleWin, inputPos, len, mode, onLocalFinish, phase],
  );

  const start = useCallback(() => {
    if (mode === "solo") doneOnce.current = false;
    setLen(1);
    setPhase("show");
    setMessage("");
  }, [mode]);

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
        <p className="text-[10px] leading-relaxed text-amber-100/88">
          {loc === "mn"
            ? "5 товч (1–5): дараалал гялс гарна → та ижил дарааллаар дар. Алхам бүр нэг оноо нэмнэ. 10 зөв алхам = ялалт."
            : "Five buttons (1–5): watch the flash, then tap the same order. Each success adds a new step. A full 10-step run with no error = win."}
        </p>
        <details
          className="mx-auto mt-1.5 max-w-md rounded border border-sky-500/25 bg-black/30 px-2 py-1 text-left"
          open
        >
          <summary className="cursor-pointer text-[10px] font-semibold text-sky-200/90">
            {loc === "mn" ? "Дүрмийн дэлгэрэнгүй" : "Full rules (short)"}
          </summary>
          <ol className="mt-1.5 list-decimal space-y-1 pl-4 text-[9px] leading-relaxed text-slate-400">
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
        <p className="mt-0.5 text-[10px] text-amber-200/60">{message}</p>
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
          <div className="flex w-full max-w-sm flex-wrap justify-center gap-1.5">
            {[0, 1, 2, 3, 4].map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => onStone(i)}
                className="h-9 min-w-[2.4rem] rounded border border-white/20 bg-white/5 px-2 text-xs font-semibold text-slate-100"
              >
                {i + 1}
              </button>
            ))}
          </div>
        ) : null}
        {phase === "show" ? (
          <p className="w-full text-center text-[10px] text-amber-200/50">
            {loc === "mn" ? "… харагдаж байна" : "Watch…"}
          </p>
        ) : null}
      </div>
    </div>
  );
}
