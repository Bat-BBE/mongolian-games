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
  BERKH12_TOTAL_MORIES,
} from "./shagaiBerkh12Type";

const pill = `rounded-lg border border-amber-500/35 bg-amber-950/40 px-2 py-1 font-[family-name:var(--font-inter)] text-xs font-bold tabular-nums leading-relaxed text-amber-100/95 sm:text-[0.8125rem]`;

/** 12 жил — шат + зорилго (нэгдсэн «chrome»). */
export function TwelveShagaiRulesStrip({ isEn }: { isEn: boolean }) {
  return (
    <div className="mt-2 space-y-1.5 rounded-xl border border-sky-500/25 bg-sky-950/20 px-2 py-2 sm:px-2.5">
      <p className={`${GAME_TEXT_SECTION_LABEL} text-center tracking-[0.14em] text-sky-200/80`}>
        {isEn ? "Throw tiers → horse points" : "Шатны шидэлт → морины оноо"}
      </p>
      <div className={`flex flex-wrap items-center justify-center gap-1 sm:gap-1.5 ${GAME_TEXT_BODY} text-sky-100/90`}>
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
      <p className={`${GAME_TEXT_META} text-center text-slate-300/95`}>
        {isEn
          ? `Each bone that lands horse-face up = +1 horse point this throw. First to ${TWELVE_TARGET} horse points wins.`
          : `Шагай бүр дээрээ морьтой бол энэ шидэлтэд +1 морины оноо. Хамгийн түрүүнд ${TWELVE_TARGET} хүргэгч ялна.`}
      </p>
    </div>
  );
}

/** 12 бэрх — нэг шидэлт, төв, зорилго. */
export function Berkh12RulesStrip({ isEn }: { isEn: boolean }) {
  return (
    <div className="mt-2 space-y-1.5 rounded-xl border border-emerald-500/25 bg-emerald-950/15 px-2 py-2 sm:px-2.5">
      <p className={`${GAME_TEXT_SECTION_LABEL} text-center tracking-[0.14em] text-emerald-200/80`}>
        {isEn ? "One throw · pot & seats" : "Нэг шидэлт · төв ба суудал"}
      </p>
      <div className={`flex flex-wrap items-center justify-center gap-2 ${GAME_TEXT_BODY} text-emerald-100/90`}>
        <span className={pill}>
          {isEn ? `${BERKH12_PIECE_COUNT} bones` : `${BERKH12_PIECE_COUNT} шагай`}
        </span>
        <span className="text-emerald-400/75" aria-hidden>
          ·
        </span>
        <span className={pill}>
          {isEn ? `${BERKH12_TOTAL_MORIES} mories` : `${BERKH12_TOTAL_MORIES} морь (төв)`}
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
          ? "Everyone throws 12 at once, sunwise. Horses pull from the pot; camels make you pay others. Full rules in the sheet (?) button."
          : "Бүгд нэгэн зэрэг 12-аа шиднэ. Морь төвөөс авна, тэмээ бусдад төлнө. Дэлгэрэнгүйг «Дүрэм» sheet-ээс нээнэ."}
      </p>
    </div>
  );
}
