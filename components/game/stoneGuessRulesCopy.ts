import { MAX_STONES, WIN_SCORE } from "./stoneType";

export type StoneGuessRuleStep = { n: string; t: string; d: string };
export type StoneGuessScoreRow = { label: string; pts: string };

export type StoneGuessRulesStrings = {
  // howToSectionTitle: string;
  intro: string;
  steps: StoneGuessRuleStep[];
  scoringTitle: string;
  scoringRows: StoneGuessScoreRow[];
  hideNote: string;
};

export function stoneGuessRulesStrings(
  lang: "en" | "mn",
): StoneGuessRulesStrings {
  if (lang === "mn") {
    return {
      // howToSectionTitle: "ТОГЛООМЫН ДҮРЭМ",
      intro:
        "Та 0–5 чулуу атгаж, хоёр талын атгасан чулууны нийлбэрийг таана. Зөв таасан тал раундыг авна.",
      steps: [
        { n: "①", t: "Чулуу атгах", d: `0–${MAX_STONES} чулуу сонгоно` },
        {
          n: "②",
          t: "Нийлбэр таах",
          d: `Нийт дүнгээс 0–${MAX_STONES * 2} таана`,
        },
        { n: "③", t: "Зэрэг нээх", d: "Хоёр тал зэрэг нээгээд харьцуулна" },
        { n: "④", t: "Ялалт", d: `Түрүүлж ${WIN_SCORE} раунд авсан нь ялна` },
      ],
      scoringTitle: "РАУНДЫН ҮР ДҮН",
      scoringRows: [
        { label: "Та зөв таавал", pts: "+1 раунд" },
        { label: "Өрсөлдөгч зөв таавал", pts: "Нөгөө тал +1" },
        { label: "Хоёул буруу", pts: "+0 (тэнцүү)" },
      ],
      hideNote: "Өрсөлдөгчийн атгасан чулууг нээгтэл харахгүй.",
    };
  }
  return {
    // howToSectionTitle: "HOW TO PLAY",
    intro:
      "Grab 0-5 stones, then guess the combined total in both hands. The correct guess wins the round.",
    steps: [
      { n: "①", t: "Grab stones", d: `Pick ${MAX_STONES} or fewer stones` },
      { n: "②", t: "Guess total", d: `Guess between 0 and ${MAX_STONES * 2}` },
      { n: "③", t: "Reveal together", d: "Both hands open and compare" },
      { n: "④", t: "Win", d: `First to ${WIN_SCORE} rounds wins` },
    ],
    scoringTitle: "ROUND RESULT",
    scoringRows: [
      { label: "You guess correctly", pts: "+1 round" },
      { label: "Opponent guesses correctly", pts: "They +1" },
      { label: "Both wrong", pts: "+0 (tie)" },
    ],
    hideNote: "Opponent stones stay hidden until reveal.",
  };
}
