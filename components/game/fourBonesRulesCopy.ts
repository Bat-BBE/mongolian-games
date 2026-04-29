import { TARGET_SCORE } from "./fourBonusType";

export type FourBonesRuleStep = { n: string; t: string; d: string };
export type FourBonesScoreRow = { label: string; pts: string };

export type FourBonesRulesStrings = {
  intro: string;
  steps: FourBonesRuleStep[];
  scoringTitle: string;
  scoringRows: FourBonesScoreRow[];
};

export function fourBonesRulesStrings(
  lang: "en" | "mn",
): FourBonesRulesStrings {
  if (lang === "mn") {
    return {
      intro: "4 шагайг орхиж оноо аваарай. Роботыг хож.",
      steps: [
        { n: "①", t: "Таны ээлж", d: "Шагай орхих" },
        { n: "②", t: "Оноо тооцох", d: "Давтагдаагүй талаар бодно" },
        {
          n: "③",
          t: "Дараагийн тоглогчийн ээлж",
          d: "Тоглогч ээлж дараалан шагайг орхино",
        },
        { n: "④", t: "Ялах", d: `Түрүүлж ${TARGET_SCORE} оноо авах` },
      ],
      scoringTitle: "ОНООНЫ ҮНЭЛГЭЭ",
      scoringRows: [
        { label: "4 тал өөр (Дөрвөн бэрх)", pts: "+12" },
        { label: "4 тал адил (хос)", pts: "+8" },
        { label: "3 тал өөр", pts: "+5" },
        { label: "2 тал өөр", pts: "+2" },
      ],
    };
  }
  return {
    intro:
      "Roll 4 shagai. More unique sides = more points. Beat the robot to the target.",
    steps: [
      { n: "①", t: "Your turn", d: "Throw 4 shagai" },
      { n: "②", t: "Earn points", d: "Scored by unique sides" },
      { n: "③", t: "Robot throws", d: "Robot rolls automatically" },
      { n: "④", t: "Win", d: `First to ${TARGET_SCORE} pts` },
    ],
    scoringTitle: "SCORING",
    scoringRows: [
      { label: "4 unique (Dörvön berkh)", pts: "+12" },
      { label: "3 unique sides", pts: "+5" },
      { label: "2 unique sides", pts: "+2" },
      { label: "All same (4 equal)", pts: "+8" },
    ],
  };
}
