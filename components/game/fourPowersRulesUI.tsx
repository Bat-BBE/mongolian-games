"use client";

import { WIN_SCORE } from "./fourPowersType";
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
        ? "Ганцаархаг: та + 3 робот — бүгд нэгэн зэрэг сонголт хийнэ."
        : "Solo: you and three bots all lock in a pick at the same time."
      : isMn
        ? "Өрөөнд 1–4 тоглогч нэгдэнэ; суудал дүүрээгүй бол робот нэмэгдэнэ."
        : "Room: 1–4 humans; empty seats are filled by bots.";

  const goalLine = isMn
    ? `Зорилго — ${WIN_SCORE} оноо: түрүүнд ганцаархан хүрсэн суудал ялна (тэнцвэл үргэлжилнэ).`
    : `Goal — ${WIN_SCORE} pts: first sole leader wins (ties at the top keep play going).`;

  const pickLine = isMn
    ? "Доорх дөрвөн товчоос нэгийг дарна — энэ нь таны «эрхэ» (сонголт)."
    : "Tap one of the four buttons — that is your power pick for the round.";

  return (
    <div className="mx-auto w-full max-w-2xl space-y-2 text-left">
      <p className={`text-center ${GAME_TEXT_LEAD}`}>{pickLine}</p>

      <div
        className="rounded-xl border border-amber-500/20 bg-black/35 px-2 py-2 sm:px-3"
        role="img"
        aria-label={
          isMn
            ? "Морь тэмээг, тэмээ үхрийг, үхэр хонийг, хонь морийг дарна"
            : "Horse beats camel, camel ox, ox sheep, sheep horse"
        }
      >
        <p
          className={`${GAME_TEXT_SECTION_LABEL} text-center tracking-[0.12em] text-amber-200/80`}
        >
          {isMn ? "Дугуй — хэн хэнийгээ дардаг" : "The cycle — who beats whom"}
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
          {isMn
            ? "Оноо хэрхэн нэмэгддэг вэ? (дэлгэрэнгүй)"
            : "How scoring works (details)"}
        </summary>
        <ol className={`mt-2 ${GAME_RULES_OL_CLASS} text-slate-300`}>
          <li className="list-decimal">
            {isMn
              ? "Дөрвөн суудал ижил эрхэ сонговол, эсвэл дөрвөн өөр эрхэ сонговол — энэ раунд оноо 0."
              : "If all four picks are the same power, or all four are different powers — this round scores 0."}
          </li>
          <li className="list-decimal">
            {isMn
              ? "Хоёр төрөл 2–2-оор хуваагдвал: дугуйн дагуу давсан талын 2 суудал тус бүр +2 оноо, ялагдсан 2 нь 0."
              : "If the picks split 2 vs 2: the two seats on the winning side of the cycle get +2 each; the other two get 0."}
          </li>
          <li className="list-decimal">
            {isMn
              ? "Нэг төрөл 3, нөгөө нь 1 бол: нэг ганцаархан сонголт гурвыг дугуйнд дарвал тэр суудал +3; эсрэг тохиолдолд гурван суудал тус бүр +1."
              : "If the split is 3 vs 1: if the lone power beats the triple in the cycle, that lone seat gets +3; otherwise each of the three gets +1."}
          </li>
        </ol>
      </details>
    </div>
  );
}
