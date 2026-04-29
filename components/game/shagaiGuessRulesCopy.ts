import { TOTAL_SHAGAI } from "./shagaiGuessType";

export type ShagaiGuessRuleStep = { n: string; t: string; d: string };
export type ShagaiGuessScoreRow = { label: string; pts: string };

export type ShagaiGuessRulesStrings = {
  // howToSectionTitle: string;
  intro: string;
  steps: ShagaiGuessRuleStep[];
  scoringTitle: string;
  scoringRows: ShagaiGuessScoreRow[];
};

export function shagaiGuessRulesStrings(
  lang: "en" | "mn",
): ShagaiGuessRulesStrings {
  if (lang === "mn") {
    return {
      // howToSectionTitle: "ТОГЛООМЫН ДҮРЭМ",
      intro:
        "Хоёр тал бие биениийхээ атгасан шагайн нийт тоог таана. Зөв таасан тал нь шагайг авна.",
      steps: [
        {
          n: "①",
          t: "Нууц атгалт",
          d: "Өөрийн шагайнаас 0-с үлдсэн хүртэлээ атгана",
        },
        {
          n: "②",
          t: "Нийт тоо таах",
          d: "Хоёр талын атгасан нийлбэрийг таамаглана",
        },
        {
          n: "③",
          t: "Зэрэг нээх",
          d: "Атгасан тоонууд нээгдээд зөв таасныг шалгана",
        },
        {
          n: "④",
          t: "Ялагч",
          d: `Бүх ${TOTAL_SHAGAI} шагайг цуглуулсан нь тоглолтод ялна`,
        },
      ],
      scoringTitle: "Үеийн үр дүн",
      scoringRows: [
        { label: "Зөвхөн та зөв таавал", pts: "Танд +нийлбэр" },
        { label: "Зөвхөн нөгөө тал зөв", pts: "Тэнд +нийлбэр" },
        { label: "Хоёул зөв эсвэл хоёул буруу", pts: "+0 (шагай шилжихгүй)" },
      ],
    };
  }
  return {
    // howToSectionTitle: "HOW TO PLAY",
    intro:
      "Guess the combined number of hidden shagai in both hands. The correct side takes shagai.",
    steps: [
      {
        n: "①",
        t: "Hide shagai",
        d: "Pick any amount from 0 to your current pile",
      },
      {
        n: "②",
        t: "Guess total",
        d: "Guess the combined hidden total of both players",
      },
      {
        n: "③",
        t: "Reveal together",
        d: "Hands open and the correct guess is checked",
      },
      {
        n: "④",
        t: "Win match",
        d: `Collect all ${TOTAL_SHAGAI} shagai to win the match`,
      },
    ],
    scoringTitle: "ROUND RESULT",
    scoringRows: [
      { label: "Only you are correct", pts: "Your pile +total" },
      { label: "Only opponent is correct", pts: "Their pile +total" },
      { label: "Both correct or both wrong", pts: "+0 (no transfer)" },
    ],
  };
}
