"use client";

import { useApp } from "@/components/AppContext";
import {
  TWELVE_TARGET,
  type TwelveMode,
  type TwelvePhase,
  type TurnSlot,
  type TwelvePick,
} from "./shagaiTwelveType";
import type { ShagaiSide } from "./shagai";
import { SHAgAI_SIDES } from "./shagai";

type Props = {
  phase: TwelvePhase;
  mode: TwelveMode;
  turn: TurnSlot;
  pick: TwelvePick;
  onPick: (n: TwelvePick) => void;
  scores: [number, number];
  canThrow: boolean;
  onThrow: () => void;
  onReset: () => void;
  onModeChange: (m: TwelveMode) => void;
  lastSides: (ShagaiSide | null)[];
  lastHorses: number;
  winner: 0 | 1 | null;
  /** Multiplayer: show names for each slot */
  name0?: string;
  name1?: string;
  /** Disable mode toggle (e.g. online) */
  lockMode?: boolean;
};

export default function ShagaiTwelveUI({
  phase,
  mode,
  turn,
  pick,
  onPick,
  scores,
  canThrow,
  onThrow,
  onReset,
  onModeChange,
  lastSides,
  lastHorses,
  winner,
  name0 = "1",
  name1 = "2",
  lockMode = false,
}: Props) {
  const { language } = useApp();
  const isEn = language === "en";
  const t = {
    title: isEn ? "12 years (shagai)" : "12 жил (шагай)",
    /** Нэг мөр: зорилт, оноо, ээлж */
    lead: isEn
      ? "Turns, sunwise · pick 2–4 shagai once · each 🐴 face = 1 pt · first to 12."
      : "Ээлж, нар зөв · нэг удаад 2–4 шагай · гарсан 🐴 тал бүр 1 оноо · 12 оноо хамгийн түрүүнд хүрнэ.",
    pick: isEn ? "Shagai per throw" : "Нэг удаад шагай",
    rules: isEn ? "How it works" : "Дүрмийн товчоо",
    r1: isEn
      ? "Two people take turns (local = pass the device; or vs computer)."
      : "Хоёр тоглогч ээлжлэнэ (нэг дэлгэц = төхөөрөмжөө дамжуулан; эсвэл роботтой).",
    r2: isEn
      ? "Per turn, pick how many shagai to throw (2, 3, or 4) before pressing Throw."
      : "Ээлж бүр 2, 3 эсвэл 4 шагайг сонгож «Шидэх»-ийг дарагдана.",
    r3: isEn
      ? "After they settle, count only horse faces. That number is your points for the turn (no horses = 0)."
      : "Шидэж дуусаад зөвхөн зураасан дээрх морь (🐴) бүр 1 оноо — нэгт хэдэн гарснаар оноо нэмэгдэнэ.",
    r4: isEn
      ? `The scoreboard is horse-points, not the number of throws. First to reach ${TWELVE_TARGET} wins.`
      : "Табло дээрх нь зөвхөн уг «морины оноо» — шийднэ хэд вэ биш. Анхы ${TWELVE_TARGET} хүртэл хурдан хүрнэ нь хожно.",
    r5: isEn
      ? "Online: left name = room host, right = guest. Host must start the match in the top bar first."
      : "Онлайн: дээд «Online»-оор өрөөнд орж бэлэн болоод эзэн тоглолт эхлүүлнэ — нэр зүүн эзэн, баруун зочин.",
    throw: isEn ? "Throw" : "Шидэх",
    yourTurn: isEn ? "Your turn" : "Таны ээлж",
    p1: isEn ? "Player 1" : "Тоглогч 1",
    p2: isEn ? "Player 2" : "Тоглогч 2",
    cpu: isEn ? "vs computer" : "Роботтой",
    local2: isEn ? "2 on one screen" : "2 нэг дэлгэц дээр",
    wait: isEn ? "Opponent's turn…" : "Өрсөлдөгчийн ээлж…",
    reset: isEn ? "Again" : "Дахин",
    last: isEn ? "Horses this throw" : "Энэ удаад морь",
    over: isEn ? "Winner" : "Хожигч",
  };

  const canPick = phase === "idle" || phase === "result";
  const showSides = lastSides.some((s) => s != null);

  return (
    <div
      className="pointer-events-auto absolute inset-x-0 bottom-0 z-10 max-h-[46%] min-h-0 overflow-y-auto border-t border-amber-500/20 bg-zinc-950/92 px-3 py-2.5 text-amber-50 sm:max-h-[50%] sm:px-4"
      style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-sm font-bold text-amber-200 sm:text-base">
          {t.title}
        </h2>
        {!lockMode ? (
          <div className="flex flex-wrap items-center gap-1.5 text-[10px] sm:text-xs">
            <span className="text-zinc-500">{isEn ? "Mode" : "Режим"}:</span>
            <button
              type="button"
              className={`rounded border px-2 py-0.5 ${mode === "local2" ? "border-amber-500/50 bg-amber-950/60" : "border-zinc-600"}`}
              onClick={() => onModeChange("local2")}
            >
              {t.local2}
            </button>
            <button
              type="button"
              className={`rounded border px-2 py-0.5 ${mode === "vsCpu" ? "border-amber-500/50 bg-amber-950/60" : "border-zinc-600"}`}
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
        <ol
          className="mt-2 list-decimal space-y-1.5 pl-4 text-[10px] leading-relaxed text-zinc-300"
        >
          <li>{t.r1}</li>
          <li>{t.r2}</li>
          <li>{t.r3}</li>
          <li>{t.r4}</li>
          {lockMode ? <li className="text-amber-200/90">{t.r5}</li> : null}
        </ol>
      </details>

      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[10px] font-semibold uppercase text-zinc-500">
            {t.pick}
          </div>
          <div className="mt-1 flex gap-1">
            {([2, 3, 4] as const).map((n) => (
              <button
                key={n}
                type="button"
                disabled={!canPick}
                onClick={() => onPick(n)}
                className={`min-w-9 rounded border px-2 py-1 text-xs font-bold ${
                  pick === n
                    ? "border-amber-400/70 bg-amber-950/70 text-amber-100"
                    : "border-zinc-600 text-zinc-300"
                } ${!canPick ? "opacity-40" : ""}`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold tabular-nums text-amber-100 sm:text-3xl">
            <span
              className={turn === 0 ? "text-emerald-300" : "text-zinc-500"}
            >
              {scores[0]}
            </span>
            <span className="mx-1.5 text-zinc-500">:</span>
            <span
              className={turn === 1 ? "text-emerald-300" : "text-zinc-500"}
            >
              {scores[1]}
            </span>
          </div>
          <div className="text-[9px] text-zinc-500">
            {name0} / {name1} · {isEn ? "target" : "зорилт"}{" "}
            {TWELVE_TARGET}
          </div>
          <p className="mt-0.5 text-[8px] leading-tight text-amber-200/60">
            {isEn
              ? "🐴 face on top = +1 horse-point each. No horse = +0 this throw."
              : "Дээрх тал нь морь бол 1-ээр нэмнэ. Морьгүй энэ удаа 0."}
          </p>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-amber-100/90">
          {phase === "matchOver" && winner != null
            ? `${t.over}: ${winner === 0 ? name0 : name1}`
            : mode === "vsCpu" && turn === 1
              ? (isEn ? "Computer is throwing…" : "Робот шидаж байна…")
              : canThrow
                ? `${t.yourTurn} — ${turn === 0 ? name0 : name1}`
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
              className="rounded-lg border border-amber-400/60 bg-amber-800/50 px-4 py-1.5 text-sm font-bold text-amber-50 disabled:opacity-35"
            >
              {t.throw}
            </button>
          )}
        </div>
      </div>

      {showSides && phase !== "throwing" && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-zinc-800/80 pt-2">
          <span className="text-[10px] text-zinc-500">{t.last}:</span>
          {lastSides.map(
            (s, i) =>
              s && (
                <span
                  key={i}
                  className="inline-flex items-center gap-0.5 rounded bg-zinc-900/80 px-1.5 py-0.5 text-sm"
                  style={{ color: SHAgAI_SIDES[s].color }}
                >
                  {SHAgAI_SIDES[s].symbol}
                </span>
              ),
          )}
          <span className="ml-1 text-xs font-bold text-amber-200">
            +{lastHorses} 🐴
          </span>
        </div>
      )}
    </div>
  );
}
