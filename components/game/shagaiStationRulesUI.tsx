"use client";

import {
  GAME_TEXT_BODY,
  GAME_TEXT_META,
  GAME_TEXT_SECTION_LABEL,
} from "./gameUiTheme";
import { TWELVE_TARGET } from "./shagaiTwelveType";
import {
  BERKH12_MAX_TURNS,
  BERKH12_PIECE_COUNT,
  BERKH12_START_STACK,
} from "./shagaiBerkh12Type";

const pill = `rounded-lg border border-amber-500/35 bg-amber-950/40 px-2 py-1 font-[family-name:var(--font-inter)] text-xs font-bold tabular-nums leading-relaxed text-amber-100/95 sm:text-[0.8125rem]`;

type TwelveStripVariant = "full" | "panel";

/** 12 жил — шат + зорилго (`full`: модал/дүрэм; `panel`: зөвхөн шатны хайрцаг). */
export function TwelveShagaiRulesStrip({
  isEn,
  variant = "full",
}: {
  isEn: boolean;
  variant?: TwelveStripVariant;
}) {
  const compact = variant === "panel";
  return (
    <div
      className={`mt-2 space-y-1.5 rounded-xl border border-sky-500/25 bg-sky-950/20 px-2 py-2 sm:px-2.5 ${compact ? "py-1.5" : ""}`}
    >
      {!compact ? (
        <p
          className={`${GAME_TEXT_SECTION_LABEL} text-center tracking-[0.14em] text-sky-200/80`}
        >
          {isEn ? "Throw tiers → horse points" : "Шатны шидэлт → морины оноо"}
        </p>
      ) : (
        <p
          className={`${GAME_TEXT_SECTION_LABEL} text-center tracking-[0.12em] text-sky-200/75`}
        >
          {isEn ? "Throw pattern" : "Шат"}
        </p>
      )}
      <div
        className={`flex flex-wrap items-center justify-center gap-1 sm:gap-1.5 ${GAME_TEXT_BODY} text-sky-100/90`}
      >
        <span className={pill}>4×4</span>
        <span className="text-sky-400/80" aria-hidden>
          →
        </span>
        <span className={pill}>3×3</span>
        <span className="text-sky-400/80" aria-hidden>
          →
        </span>
        <span className={pill}>2×∞</span>
      </div>
      {!compact ? (
        <p className={`${GAME_TEXT_META} text-center text-slate-300/95`}>
          {isEn
            ? `Horse on top = +1 this throw; first to ${TWELVE_TARGET} horse points wins. Four throws must use four bones each, three throws must use three bones (you pick the order); 2-bone throws are allowed anytime until those quotas are used, then only 2 bones.`
            : `Дээрээ морь бол +1; анх ${TWELVE_TARGET} морь хүргэгч ялна. 4-өөр 4 удаа, 3-аар 3 удаа шидэхийг дарааллаар нь өөрөө сонгоно; квот дуусах хүртэл 2-оор ч шиднө. Хоёрыг дууссаны дараа зөвхөн 2.`}
        </p>
      ) : null}
    </div>
  );
}

/** 12 бэрх — тойрог, 8-аас эхлэх шинэ хувилбар. */
export function Berkh12RulesStrip({ isEn }: { isEn: boolean }) {
  return (
    <div className="mt-2 space-y-1.5 rounded-xl border border-emerald-500/25 bg-emerald-950/15 px-2 py-2 sm:px-2.5">
      <p className={`${GAME_TEXT_SECTION_LABEL} text-center tracking-[0.14em] text-emerald-200/80`}>
        {isEn ? "Round table · seat flow" : "Тойрог ширээ · суудлын урсгал"}
      </p>
      <div className={`flex flex-wrap items-center justify-center gap-2 ${GAME_TEXT_BODY} text-emerald-100/90`}>
        <span className={pill}>
          {isEn ? `${BERKH12_PIECE_COUNT} bones` : `${BERKH12_PIECE_COUNT} шагай`}
        </span>
        <span className="text-emerald-400/75" aria-hidden>
          ·
        </span>
        <span className={pill}>
          {isEn
            ? `${BERKH12_START_STACK} start each`
            : `тус бүр ${BERKH12_START_STACK}-аас`}
        </span>
        <span className="text-emerald-400/75" aria-hidden>
          ·
        </span>
        <span className={pill}>
          {isEn ? `≤${BERKH12_MAX_TURNS} turns cap` : `≤${BERKH12_MAX_TURNS} ээлж`}
        </span>
      </div>
      <p className={`${GAME_TEXT_META} text-center text-slate-300/95`}>
        {isEn
          ? "Horse takes from previous seat; camel gives to next seat. If your pile hits 0, you are out."
          : "Морь буувал өмнөх суудлаасаа авна, тэмээ буувал дараагийн суудалдаа өгнө. Овоо 0 бол хасагдана."}
      </p>
    </div>
  );
}
