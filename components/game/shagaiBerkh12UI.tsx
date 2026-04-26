"use client";

import { useApp } from "@/components/AppContext";
import {
  BERKH12_MAX_TURNS,
  BERKH12_PIECE_COUNT,
  BERKH12_TOTAL_MORIES,
} from "./shagaiBerkh12Type";
import type { ShagaiSide } from "./shagai";
import { SHAgAI_SIDES } from "./shagai";
import type { Berkh12Mode, Berkh12Phase, LocalPlayerCount } from "./shagaiBerkh12Type";

type Props = {
  phase: Berkh12Phase;
  mode: Berkh12Mode;
  playerCount: LocalPlayerCount;
  turn: number;
  mories: number[];
  center: number;
  active: boolean[];
  canThrow: boolean;
  onThrow: () => void;
  onReset: () => void;
  onModeChange: (m: Berkh12Mode) => void;
  onPlayerCountChange: (c: LocalPlayerCount) => void;
  lastSides: (ShagaiSide | null)[];
  lastHorses: number;
  lastCamels: number;
  showElimToast?: string | null;
  winner: number | null;
  nameLabels: string[];
  lockMode?: boolean;
};

export default function ShagaiBerkh12UI({
  phase,
  mode,
  playerCount,
  turn,
  mories,
  center,
  active,
  canThrow,
  onThrow,
  onReset,
  onModeChange,
  onPlayerCountChange,
  lastSides,
  lastHorses,
  lastCamels,
  showElimToast,
  winner,
  nameLabels,
  lockMode = false,
}: Props) {
  const { language } = useApp();
  const isEn = language === "en";
  const t = {
    title: isEn ? "12 Berkh (shagai party)" : "12 бэрх (шагайн наадгай)",
    lead: isEn
      ? `Sunwise · ${BERKH12_PIECE_COUNT} shagai once · pot = ${BERKH12_TOTAL_MORIES} 🐴 · your pile is what you can spend on camels.`
      : `Нар зөв ээлж · нэг удаа ${BERKH12_PIECE_COUNT} шагай · төв = ${BERKH12_TOTAL_MORIES} морь · таныхыг тэмээг төлнө.`,
    rules: isEn ? "How it works" : "Дүрмийн товчоо",
    r1: isEn
      ? "Everyone starts with 0; all mories sit in the «Pot» in the middle."
      : "Эхэнд бүгд 0, бүх морь «Төвд» (хоорондын сан) бүгд нэгт байна.",
    r2: isEn
      ? "On your turn, throw all 12 bones. Count how many land as horse, and how many as camel; others (sheep/goat) are neutral here."
      : "Ээлжтэйд 12 шагайг зэрэг чулуул. Хэд морь, хэд тэмээ гарсныг нэгт — хонь/ямаа энэ дүрмэнд тоологдохгүй.",
    r3: isEn
      ? "Horses: take that many mories from the pot into your pile (cannot take more than the pot has)."
      : "Морь: тэр олоноороо төвөөс хувиндаа нэмж авна (төвд байгаа хэмжээгээр).",
    r4: isEn
      ? "Camels: you must pay 1 mory (from your pile) to opponents, one at a time, counter-sun: previous player, then the one before that, and so on."
      : "Тэмээ: өөрийнхөөс 1, 1-р сөрөгдүүдтэй «эсрэг нар» — эхлээд өмнөх, дараа нь түүнээс зүүн, гэх мэт.",
    r5: isEn
      ? "If you can’t pay all camel costs (not enough mories in your pile), you are out; your mories return to the pot for others."
      : "Төлөх морь хүрэлцэхгүй бол тоглогч хасагдна, үлдсэн нь төвд буцна.",
    r6: isEn
      ? `Win: collect all ${BERKH12_TOTAL_MORIES}, or be the last player left, or, after many rounds (cap ${BERKH12_MAX_TURNS}), whoever holds the most mories.`
      : `Хожих: ${BERKH12_TOTAL_MORIES}-ыг нэгт эсвэл сүүлд ганцаараа эсвэл олон удаа (${BERKH12_MAX_TURNS} дээш) — хамгийн олон морьтой нь (панелын нөхцөл).`,
    r7online: isEn
      ? "Online: use the top «Online» room, Ready, then the host starts; names follow host order in the list."
      : "Онлайн: дээд товчоор өрөө, бэлэн — эзэн тоглолт эхлүүлнэ; нэрс өргийн дараалалд.",
    throw: isEn ? "Throw" : "Орхих",
    yourTurn: isEn ? "Your turn" : "Таны ээлж",
    p: isEn ? "P" : "Т",
    reset: isEn ? "Again" : "Дахин",
    wait: isEn ? "Not your turn" : "Таны ээлж биш",
    over: isEn ? "Winner" : "Хожигч",
    last: isEn ? "Horses / camels" : "Морь / тэмээ",
    center: isEn ? "Pot" : "Төв (хооронд)",
    out: isEn ? "Out" : "Хасагдсан",
    local: isEn ? "2–4 local" : "2–4 нэг дэлгэц",
    cpu: isEn ? "vs computer" : "Роботтой",
  };

  return (
    <div
      className="pointer-events-auto absolute inset-x-0 bottom-0 z-10 max-h-[48%] min-h-0 overflow-y-auto border-t border-amber-500/20 bg-zinc-950/92 px-3 py-2.5 text-amber-50 sm:px-4"
      style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}
    >
      {showElimToast ? (
        <p className="mb-1 rounded border border-rose-500/40 bg-rose-950/50 px-2 py-0.5 text-center text-xs text-rose-200">
          {showElimToast}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-sm font-bold text-amber-200 sm:text-base">
          {t.title}
        </h2>
        {!lockMode ? (
          <div className="flex flex-wrap items-center gap-1.5 text-[10px] sm:text-xs">
            <button
              type="button"
              className={`rounded border px-1.5 py-0.5 ${
                mode === "local" ? "border-amber-500/50 bg-amber-950/60" : "border-zinc-600"
              }`}
              onClick={() => onModeChange("local")}
            >
              {t.local}
            </button>
            <button
              type="button"
              className={`rounded border px-1.5 py-0.5 ${
                mode === "vsCpu" ? "border-amber-500/50 bg-amber-950/60" : "border-zinc-600"
              }`}
              onClick={() => onModeChange("vsCpu")}
            >
              {t.cpu}
            </button>
          </div>
        ) : null}
      </div>
      <p className="mt-0.5 text-[10px] leading-snug text-amber-100/85">
        {t.lead}
      </p>
      <details
        className="mt-1.5 rounded-md border border-zinc-700/90 bg-zinc-900/60 px-2 py-1.5"
        open
      >
        <summary className="cursor-pointer list-none text-[10px] font-semibold text-amber-200/90 [&::-webkit-details-marker]:hidden">
          <span className="underline decoration-amber-500/50 underline-offset-2">
            {t.rules}
          </span>
        </summary>
        <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-[10px] leading-relaxed text-zinc-300">
          <li>{t.r1}</li>
          <li>{t.r2}</li>
          <li>{t.r3}</li>
          <li>{t.r4}</li>
          <li>{t.r5}</li>
          <li>{t.r6}</li>
          {lockMode ? <li className="text-amber-200/90">{t.r7online}</li> : null}
        </ol>
      </details>

      {!lockMode && mode === "local" ? (
        <div className="mt-1.5 flex flex-wrap gap-1.5 text-[10px]">
          <span className="text-zinc-500">{isEn ? "Players" : "Тоглогч"}:</span>
          {([2, 3, 4] as const).map((c) => (
            <button
              key={c}
              type="button"
              disabled={!(phase === "idle" || phase === "result")}
              onClick={() => onPlayerCountChange(c)}
              className={`rounded border px-1.5 font-bold ${
                playerCount === c
                  ? "border-amber-400/70 bg-amber-950/60"
                  : "border-zinc-600"
              } ${!(phase === "idle" || phase === "result") ? "opacity-40" : ""}`}
            >
              {c}
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-2 flex flex-wrap items-end justify-between gap-2">
        <div>
          <div className="text-[10px] text-zinc-500">{t.center}</div>
          <div className="text-2xl font-bold tabular-nums text-amber-100 sm:text-3xl">
            {center}
            <span className="ml-0.5 text-sm font-normal text-zinc-500">🐴</span>
          </div>
          <p className="mt-0.5 text-[8px] leading-tight text-zinc-500">
            {isEn
              ? "Shared bank. Your column = mories you can pay out for camels."
              : "Нийтийн сан. Таны багана = тэмээнд төлж чадах морь."}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {mories.slice(0, playerCount).map((m, i) => {
            return (
              <div
                key={i}
                className={`rounded border px-2 py-0.5 text-right text-sm ${
                  i === turn && active[i]
                    ? "border-emerald-500/50 bg-emerald-950/25"
                    : "border-zinc-700/80"
                } ${!active[i] ? "opacity-45" : ""}`}
              >
                <div className="text-[8px] uppercase text-zinc-500">
                  {nameLabels[i] ?? `${t.p}${i + 1}`}
                  {!active[i] ? ` · ${t.out}` : ""}
                </div>
                <span className="text-lg font-bold text-amber-200">{m}</span>
                <span className="ml-0.5 text-amber-300/60">🐴</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-amber-100/90">
          {phase === "matchOver" && winner != null
            ? `${t.over}: ${nameLabels[winner] ?? t.p + (winner + 1)}`
            : canThrow
              ? `${t.yourTurn}: ${nameLabels[turn] ?? t.p + (turn + 1)}`
              : t.wait}
        </p>
        <div className="flex gap-2">
          {phase === "matchOver" && !lockMode ? (
            <button
              type="button"
              onClick={onReset}
              className="rounded-lg border border-amber-500/50 bg-amber-950/50 px-3 py-1.5 text-xs font-semibold"
            >
              {t.reset}
            </button>
          ) : phase === "matchOver" && lockMode ? null : (
            <button
              type="button"
              disabled={!canThrow}
              onClick={onThrow}
              className="rounded-lg border border-amber-400/60 bg-amber-800/50 px-3 py-1.5 text-sm font-bold text-amber-50 disabled:opacity-35"
            >
              {t.throw}
            </button>
          )}
        </div>
      </div>

      {lastSides.some((s) => s) && phase !== "throwing" && (
        <div className="mt-1.5 flex flex-wrap items-center gap-1 border-t border-zinc-800/80 pt-1.5">
          <span className="text-[9px] text-zinc-500">
            {t.last}: {lastHorses} 🐴 / {lastCamels} 🐫
          </span>
          {lastSides.map(
            (s, i) =>
              s && (
                <span
                  key={i}
                  className="inline-flex rounded bg-zinc-900/80 px-1 text-xs"
                  style={{ color: SHAgAI_SIDES[s].color }}
                >
                  {SHAgAI_SIDES[s].symbol}
                </span>
              ),
          )}
        </div>
      )}
    </div>
  );
}
