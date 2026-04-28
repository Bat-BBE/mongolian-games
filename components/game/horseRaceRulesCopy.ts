import { TRACK_LENGTH } from "./horseRaceType";

export type HorseRaceRuleStep = { n: string; t: string; d: string };
export type HorseRaceScoreRow = { label: string; pts: string };

export type HorseRaceRulesStrings = {
  // howToSectionTitle: string;
  intro: string;
  steps: HorseRaceRuleStep[];
  scoringTitle: string;
  scoringRows: HorseRaceScoreRow[];
};

export function horseRaceRulesStrings(
  lang: "en" | "mn",
): HorseRaceRulesStrings {
  if (lang === "mn") {
    return {
      // howToSectionTitle: "ТОГЛООМЫН ДҮРЭМ",
      intro:
        "4 шагай орхиод, буусан морь бүрээр өөрийн морийг зам дээр 1 алхам урагшлуулна.",
      steps: [
        { n: "①", t: "Ээлжээр шидэх", d: "Нэг ээлжид 4 шагай орхино" },
        { n: "②", t: "Морь тоолох", d: "Дээрээ морь бүр = +1 алхам" },
        { n: "③", t: "Дараагийн ээлж", d: "Өрсөлдөгч (эсвэл робот) шиднэ" },
        { n: "④", t: "Ялалт", d: `Түрүүлж ${TRACK_LENGTH}-д хүрвэл ялна` },
      ],
      scoringTitle: "ХӨДӨЛГӨӨНИЙ ҮНЭЛГЭЭ",
      scoringRows: [
        { label: "1 морь", pts: "+1 алхам" },
        { label: "2 морь", pts: "+2 алхам" },
        { label: "3 морь", pts: "+3 алхам" },
        { label: "4 морь", pts: "+4 алхам" },
      ],
    };
  }
  return {
    // howToSectionTitle: "HOW TO PLAY",
    intro:
      "Throw 4 shagai. Every horse face moves your racer one square on the track.",
    steps: [
      { n: "①", t: "Take your turn", d: "Throw 4 shagai each turn" },
      { n: "②", t: "Count horses", d: "Each horse face = +1 step" },
      { n: "③", t: "Next turn", d: "Robot or opponent throws next" },
      { n: "④", t: "Win", d: `First to square ${TRACK_LENGTH}` },
    ],
    scoringTitle: "MOVEMENT SCORING",
    scoringRows: [
      { label: "1 horse", pts: "+1 step" },
      { label: "2 horses", pts: "+2 steps" },
      { label: "3 horses", pts: "+3 steps" },
      { label: "4 horses", pts: "+4 steps" },
    ],
  };
}
