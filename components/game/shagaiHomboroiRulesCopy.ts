/**
 * Хомборой (gameType `shagai`) — дүрмийн текст нэг эх сурвалж:
 * модалын «?», газрын заавар.
 */
import { TARGET_SCORE } from "./shagaiTargetType";

export type HomboroiRuleItem = { n: string; t: string; d: string };
export type HomboroiScoreRow = { label: string; pts: string };

const T = TARGET_SCORE;

export function homboroiHowToPlay(lang: "mn" | "en"): string {
  return lang === "mn"
    ? `4 шагай орхиод тохирсон талаар оноо хуримтлуулна. Яг ${T} оноонд хүрвэл ялна. ${T}-оос давбал оноо 0-с дахин эхэлнэ.`
    : `Throw 4 shagai each turn and add points from the scoring table. Land exactly on ${T} to win. If you pass ${T}, your score resets to 0 and play continues.`;
}

export function homboroiRuleItems(lang: "mn" | "en"): HomboroiRuleItem[] {
  if (lang === "mn") {
    return [
      { n: "①", t: "4 шагай орхих", d: "Ээлж бүрд" },
      { n: "②", t: "Онооны тохирол", d: "Онооны хүснэгтийг харна уу" },
      { n: "③", t: "Роботын ээлж", d: "Автоматаар шидэнэ" },
      { n: "④", t: "Ялалт", d: `Түрүүлж яг ${T} оноонд хүр` },
      { n: "⑤", t: "Хэтэрвэл", d: "Оноо 0-с эхэлнэ, тоглоом үргэлжилнэ" },
    ];
  }
  return [
    { n: "①", t: "Throw 4 shagai", d: "Every turn" },
    { n: "②", t: "Score combos", d: "See scoring table" },
    { n: "③", t: "Robot's turn", d: "Throws automatically" },
    { n: "④", t: "Win", d: `Be the first to land exactly on ${T}` },
    { n: "⑤", t: "Overshoot", d: "Score resets to 0 — game continues" },
  ];
}

export function homboroiScoring(lang: "mn" | "en"): HomboroiScoreRow[] {
  if (lang === "mn") {
    return [
      { label: "4 морь (бүгд морины тал)", pts: "Ялна" },
      { label: "4 өөр тал (Дөрвөн бэрх)", pts: "+8" },
      { label: "4 ижил (4 морь биш)", pts: "+4" },
      { label: "Ямар ч 2+2 хос (хоёр төрөл тус бүр 2)", pts: "+2" },
      { label: "Бусад тохиолдол", pts: "0" },
    ];
  }
  return [
    { label: "4 horse (all sides horse)", pts: "Win" },
    { label: "4 different sides (Dörvön berkh)", pts: "+8" },
    { label: "4 identical (not 4 horse)", pts: "+4" },
    { label: "Any two pairs (2+2 of two kinds)", pts: "+2" },
    { label: "Everything else", pts: "0" },
  ];
}

export function homboroiHowToStepsForContent(lang: "mn" | "en"): string[] {
  const intro = homboroiHowToPlay(lang);
  const steps = homboroiRuleItems(lang).map((r) => `${r.n} ${r.t}: ${r.d}`);
  return [intro, ...steps];
}
