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
          {/* {isEn ? "Throw pattern" : "Шат"} */}
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

export function Berkh12RulesStrip({
  isEn,
  className = "",
}: {
  isEn: boolean;
  /** Жиш. модалын эхэнд `mt-0` */
  className?: string;
}) {
  return (
    <div
      className={`mt-2 space-y-1.5 rounded-xl border border-emerald-500/25 bg-emerald-950/15 px-2 py-2 sm:px-2.5 ${className}`}
    >
      <p
        className={`${GAME_TEXT_SECTION_LABEL} text-center tracking-[0.14em] text-emerald-200/80`}
      >
        {isEn ? "Table · flow" : "Тоглолт · урсгал"}
      </p>
      <div
        className={`flex flex-wrap items-center justify-center gap-2 ${GAME_TEXT_BODY} text-emerald-100/90`}
      >
        <span className={pill}>
          {isEn
            ? `${BERKH12_PIECE_COUNT} bones / throw`
            : `${BERKH12_PIECE_COUNT} шагай/шидэлт`}
        </span>
        <span className="text-emerald-400/75" aria-hidden>
          ·
        </span>
        <span className={pill}>
          {isEn
            ? `${BERKH12_START_STACK} each`
            : `эхлэл ${BERKH12_START_STACK}`}
        </span>
        <span className="text-emerald-400/75" aria-hidden>
          ·
        </span>
        <span className={pill}>
          {isEn
            ? `≤${BERKH12_MAX_TURNS} turns`
            : `≤${BERKH12_MAX_TURNS} ээлж`}
        </span>
      </div>
      <p className={`${GAME_TEXT_META} text-center text-balance text-slate-300/95`}>
        {isEn
          ? "Horse → take from previous seat; camel → pay next. 0 mories = out. Win: all bones, last standing, or tie-break at turn cap."
          : "Морь → өмнөхөөс авна; тэмээ → дараагийнд төлнө. 0 бол хасагдана. Ялалт: бүх шагай, сүүлийн үлдсэн, ээлжийн төгсгөл."}
      </p>
    </div>
  );
}

/** «?» модал — панел дээрх «Дүрэм»-тэй давхардахгүй нэгдсэн богино дүрэм */
export function Berkh12RulesForModal({ isMn }: { isMn: boolean }) {
  const isEn = !isMn;
  return (
    <div className="space-y-3">
      <div>
        <p className={`mb-1.5 ${GAME_TEXT_SECTION_LABEL} !text-[#c8a030]`}>
          {isMn ? "ХЭРХЭН ТОГЛОХ" : "HOW TO PLAY"}
        </p>
        <p className={`${GAME_TEXT_BODY} text-balance`}>
          {isMn
            ? "2–4 суудал ээлжээр нэг дор 4 шагай шиднэ. Зөвхөн морь, тэмээгээр овоо шилжинэ (хонь, ямаа тоолохгүй)."
            : "2–4 seats take turns throwing 4 bones at once. Only horses and camels move mories (sheep/goat ignored)."}
        </p>
      </div>
      <Berkh12RulesStrip isEn={isEn} className="!mt-0" />
      <ul className="space-y-1.5 font-[family-name:var(--font-inter)] text-[0.6875rem] leading-snug text-zinc-400 sm:text-xs">
        <li className="text-balance">
          {isMn
            ? "Онлайн өрөөнд ганцаар бол роботтой эхэлнэ (~10–15 с)."
            : "Alone in a room, the match auto-starts with bots (~10–15 s)."}
        </li>
      </ul>
    </div>
  );
}
