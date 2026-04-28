"use client";

import { MAX_ENERGY, ROUND_REGEN, WIN_SCORE } from "./fourPowersType";
import {
  GAME_RULES_OL_CLASS,
  GAME_TEXT_BODY,
  GAME_TEXT_LEAD,
  GAME_TEXT_META,
  GAME_TEXT_SECTION_LABEL,
} from "./gameUiTheme";

const ACCENT = ["#38bdf8", "#a3e635", "#fbbf24", "#f472b6"] as const;

type Lang = "mn" | "en";

type Props = {
  lang: Lang;
  variant: "solo" | "online";
};

export function FourPowersHowItWorks({ lang, variant }: Props) {
  const isMn = lang === "mn";
  const names = isMn
    ? (["Морь", "Тэмээ", "Үхэр", "Хонь"] as const)
    : (["Horse", "Camel", "Ox", "Sheep"] as const);

  const modeLine =
    variant === "solo"
      ? isMn
        ? "Ганцаараа: та + 3 робот — бүгд нэгэн зэрэг сонголт хийнэ."
        : "Solo: you and three bots all lock in a pick at the same time."
      : isMn
        ? "Өрөөнд 2–4 тоглогч нэгдэнэ; өрөө дүүрээгүй бол робот нэмэгдэнэ."
        : "Room: 2–4 humans; empty seats are filled by bots.";

  const goalLine = isMn
    ? `Зорилго — ${WIN_SCORE} оноо: түрүүлж хүрсэн хүн нь ялна (тэнцвэл үргэлжилнэ).`
    : `Goal — ${WIN_SCORE} pts: first sole leader wins (ties at the top keep play going).`;

  const pickLine = isMn
    ? "Үе бүрт 1 хүч сонгоно. Энерги хүрэхгүй хүчийг сонговол автоматаар хямд хүч рүү шилжилт хийнэ."
    : "Pick one power per round. If energy is not enough, the move auto-falls back to an affordable power.";

  return (
    <div className="mx-auto w-full max-w-2xl space-y-2 text-left">
      <p className={`text-center ${GAME_TEXT_LEAD}`}>{pickLine}</p>

      <div
        className="rounded-xl border border-amber-500/20 bg-black/35 px-2 py-2 sm:px-3"
        role="img"
        aria-label={
          isMn
            ? "Морь тэмээг, тэмээ үхрийг, үхэр хонийг, хонь морийг дийлнэ"
            : "Horse beats camel, camel ox, ox sheep, sheep horse"
        }
      >
        <p
          className={`${GAME_TEXT_SECTION_LABEL} text-center tracking-[0.12em] text-amber-200/80`}
        >
          {isMn ? "Цикл — хэн хэнийгээ дардаг" : "The cycle — who beats whom"}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center justify-center gap-y-1 text-xs font-semibold text-zinc-100 sm:text-[0.8125rem]">
          {names.map((label, i) => (
            <span key={label} className="inline-flex items-center">
              <span
                className="rounded-md border px-1.5 py-0.5 sm:px-2 sm:py-1"
                style={{
                  borderColor: `${ACCENT[i]}66`,
                  background: `linear-gradient(160deg, ${ACCENT[i]}22, rgba(8,6,4,0.9))`,
                  color: "rgba(255,255,255,0.95)",
                  boxShadow: `inset 0 0 12px ${ACCENT[i]}14`,
                }}
              >
                {label}
              </span>
              <span className="mx-0.5 text-amber-400/85 sm:mx-1" aria-hidden>
                →
              </span>
            </span>
          ))}
          <span
            className="inline-flex items-center rounded-md border border-amber-500/35 bg-amber-950/40 px-1.5 py-0.5 font-[family-name:var(--font-inter)] text-xs font-bold text-amber-200/90 sm:text-[0.8125rem]"
            title={isMn ? "Дахин мориноос эхэлнэ" : "Loops back to Horse"}
          >
            ↺ {names[0]}
          </span>
        </div>
      </div>

      <p className={`${GAME_TEXT_META} text-center text-slate-400`}>
        {modeLine}
      </p>
      <p
        className={`${GAME_TEXT_BODY} text-center font-medium text-sky-200/85`}
      >
        {goalLine}
      </p>

      <details
        className="rounded-lg border border-white/10 bg-black/25 px-2 py-1.5 sm:px-2.5"
        open
      >
        <summary
          className={`${GAME_TEXT_BODY} cursor-pointer text-center font-semibold text-amber-200/90 [&::-webkit-details-marker]:hidden [&::marker]:hidden`}
        >
          {isMn ? "Energy + Effect дүрэм" : "Energy + Effect rules"}
        </summary>
        <ol className={`mt-2 ${GAME_RULES_OL_CLASS} text-slate-300`}>
          <li className="list-decimal">
            {isMn
              ? `Үе бүрт хүн бүхэн хүч зарцуулна. Үеийн төгсгөлд +${ROUND_REGEN} энерги сэргэнэ (max ${MAX_ENERGY}).`
              : `Each seat spends energy to cast. At round end, +${ROUND_REGEN} energy is restored (max ${MAX_ENERGY}).`}
          </li>
          <li className="list-decimal">
            {isMn
              ? "Суурь оноо: нэг өрсөлдөгчөө дийлсэн бүрт +1."
              : "Base score: +1 for each opponent your power beats in the cycle."}
          </li>
          <li className="list-decimal">
            {isMn
              ? "Horse: ялалт авбал +1 нэмэлт оноо."
              : "Horse: gains +1 tempo bonus on winning rounds."}
          </li>
          <li className="list-decimal">
            {isMn
              ? "Camel: ялалт авбал дараагийн хүний хүчийг -1 сорно."
              : "Camel: on win, drains -1 energy from next seat (unless shielded)."}
          </li>
          <li className="list-decimal">
            {isMn
              ? "Ox: өөрөө оноо авсан үед shield идэвхжиж drain-ийг хаана."
              : "Ox: activates shield when it scores, blocking drain effects."}
          </li>
          <li className="list-decimal">
            {isMn
              ? "Sheep: энэ раундад +1 нэмэлт энерги сэргээнэ."
              : "Sheep: recovers +1 extra energy this round."}
          </li>
        </ol>
      </details>
    </div>
  );
}
