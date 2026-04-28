import { TARGET_SCORE } from "./fourBonusType";
import { WIN_SCORE } from "./fourPowersType";
import { homboroiHowToStepsForContent } from "./shagaiHomboroiRulesCopy";

type HowToLocale = {
  steps: string[];
  mapHint?: string;
  atStationHint?: string;
};
type HowToEntry = { mn: HowToLocale; en: HowToLocale };

const MAP_MN =
  "Газрын зураг дээр өртөөний (тэмдэгтэй нэр) дээр дарж тоглоомыг нээнэ.";
const MAP_EN =
  "On the map, tap this game’s station marker to open it in the modal.";

const AT_STATION_DEFAULT_MN =
  "Та өртөөнд байна. Доорх «Тоглох» товчийг дарвал тоглоомын цонх нээгдэнэ.";
const AT_STATION_DEFAULT_EN =
  "You’re at this station on the map. Tap Play below to open the game.";

const HOW: Record<string, HowToEntry> = {
  khorol: {
    mn: {
      steps: [
        "60 модоор тоглоно — гар эсвэл газар, жин, тэгш/сондгойг зүүнээс баруун уншина.",
        "Өрсөлдөгчтэй харьцуулалт хийнэ; одоогоор бүрэн ширээний горим ажиллаж байна.",
        "Дэлгэц дээрх зааврыг дагаад эхлүүлээрэй.",
      ],
      mapHint: MAP_MN,
    },
    en: {
      steps: [
        "60 pieces — compare hand vs ground, weight, even/odd, read left to right.",
        "Full table-style play is still evolving; follow on-screen prompts.",
        "Use the in-game panel for the latest controls.",
      ],
      mapHint: MAP_EN,
    },
  },
  "modon-onis": {
    mn: {
      steps: [
        "Эхлээд 1, дараа нь 2, эцэст 3 дугаартай хэсгийг зөв газарлуулна.",
        "Хэсгийг чирж тавина; Q/E дарж 90° эргүүлнэ.",
        "Бүх хэсэг зөв суухад тоглолт амжилттай дуусна.",
      ],
      mapHint: MAP_MN,
    },
    en: {
      steps: [
        "Place piece 1, then 2, then 3 in valid slots on the board.",
        "Drag to place; press Q/E to rotate 90°.",
        "Finish when every piece sits correctly.",
      ],
      mapHint: MAP_EN,
    },
  },
  puzzle: {
    mn: {
      steps: [
        "4×4 сүлжээнд карт байрлана.",
        "Нэг дор хоёр картыг эргүүлж нээнэ.",
        "Ижил дүрстэй хос олвол хос хасагдана; бүх хосыг ол.",
      ],
      mapHint: MAP_MN,
    },
    en: {
      steps: [
        "You have a 4×4 grid of face-down cards.",
        "Flip two at a time to reveal them.",
        "When two faces match, they pair off; clear every pair to win.",
      ],
      mapHint: MAP_EN,
    },
  },
  "stone-cairn": {
    mn: {
      steps: [
        "«Харагдах» үед дарааллыг ажиглана — аль чулуу гялалзахыг сана.",
        "«Оруулах» үед 1–5 товчийг яг тэр дарааллаар дар.",
        "Алхам бүр нэг шинэ нэмэгдэнэ. Нэг буруу даралт = тоглолт дуусна.",
        "10 зөв алхам дараалал дуусгавал ялалт.",
      ],
      mapHint: MAP_MN,
    },
    en: {
      steps: [
        "During “show”, watch which stones flash — remember the order.",
        "During “input”, tap buttons 1–5 in that same order.",
        "Each success adds a new step; one wrong tap ends the run.",
        "Complete a 10-step sequence with no mistakes to win.",
      ],
      mapHint: MAP_EN,
    },
  },
  "seven-shagai": {
    mn: {
      steps: [
        "Талбар дээр олон шагай байна.",
        "Ижил тал харуулсан хосын хооронд чирж няслана — нэгийг авна.",
        "Эцэст нэг шагай үлдэх хүртэл үргэлжлүүл; үлдэгч нь ялагч.",
      ],
      mapHint: MAP_MN,
    },
    en: {
      steps: [
        "Several shagai sit on the field.",
        "Flick between two pieces that show the same face — one is removed.",
        "Keep going until one shagai remains; that side wins.",
      ],
      mapHint: MAP_EN,
    },
  },
  "twelve-shagai": {
    mn: {
      steps: [
        "Эхлээд 4 удаа тус бүр 4 шагай, дараа нь 3 удаа тус бүр 3, түүнээс хойш зөвхөн 2-оор (удааны хязгааргүй).",
        "Нэг шидэлтэнд: дээрээ морьтой гарсан шагай бүр +1 «морины оноо».",
        "Таблоор хэн түрүүлж байгааг харна — хамгийн түрүүнд 12 морины оноо хүргэгч ялна.",
        "Өрөөнд зөвхөн таных бол 10–15 секундын хүлээгээний дараа автоматаар роботтой эхэлнэ.",
      ],
      mapHint: MAP_MN,
    },
    en: {
      steps: [
        "Throw tiers: four rounds of 4 bones, then three of 3, then only 2 bones (unlimited 2-bone rounds).",
        "After each throw, every bone showing horse on top adds +1 horse point to your turn total.",
        "The scoreboard tracks horse points — first to 12 wins the match.",
        "If you’re alone in the room, the match auto-starts vs bots after about 10–15 seconds.",
      ],
      mapHint: MAP_EN,
    },
  },
  "berkh-12-shagai": {
    mn: {
      steps: [
        "2–4 тоглогч (эсвэл робот) нар зэрэг 12 шагайгаа нэг удаад шиднэ.",
        "Морь төвийн «сан»-аас таны овоо руу орж ирнэ; тэмээ бусад тоглогчид төлбөр төлүүлнэ.",
        "Төлж чадахгүй бол хасагдна. Бүх морийг өөртөө цуглуулах, эсвэл сүүлийн идэвхтэй, эсвэл ээлжийн дээд хязгаар — ялалтын нөхцөл.",
        "Өрөөнд зөвхөн таных бол 10–15 секундын дараа автоматаар эхэлнэ.",
      ],
      mapHint: MAP_MN,
    },
    en: {
      steps: [
        "2–4 seats (humans or bots) each throw all 12 bones at once, sunwise.",
        "Horses pull mories from the central pot into your pile; camels force you to pay other players.",
        "Fail a camel payment and you’re out. Win by holding all pot mories, being last standing, or the turn-cap tie-break — see in-game rules.",
        "If you’re alone in the room, the match auto-starts after about 10–15 seconds (with bots as needed).",
      ],
      mapHint: MAP_EN,
    },
  },
  shagai: {
    mn: {
      steps: homboroiHowToStepsForContent("mn"),
      mapHint: MAP_MN,
    },
    en: {
      steps: homboroiHowToStepsForContent("en"),
      mapHint: MAP_EN,
    },
  },
  "shagai-guess": {
    mn: {
      steps: [
        "Өөрийн овооноос нууц атгалт сонгоно (0-с үлдсэн хүртэл).",
        "Хоёр талын атгасан шагайн нийт тоог таана.",
        "Раундын дүрэм, шилжилтийн нөхцөл: модалын «?» дээр.",
      ],
      mapHint: MAP_MN,
    },
    en: {
      steps: [
        "Pick a hidden amount from your current pile.",
        "Guess the combined hidden total in both hands.",
        "Full round rules and transfer logic are in the ? modal.",
      ],
      mapHint: MAP_EN,
    },
  },
  "stone-guess": {
    mn: {
      steps: [
        "Чулуу, цаас, хайчны аль нэгийг сонгоно (жишээ нь).",
        "Өрсөлдөгчтэй ижил үед ялагдана; ялж буй тал оноо авна.",
        "Раунд бүрт сонголтоо баталж үргэлжлүүлнэ.",
      ],
      mapHint: MAP_MN,
    },
    en: {
      steps: [
        "Choose your move from the game’s options (e.g. rock / paper / scissors style).",
        "Compare with the opponent; winning side scores the round.",
        "Commit each round and follow the score on the board.",
      ],
      mapHint: MAP_EN,
    },
  },
  "four-bones": {
    mn: {
      steps: [
        "Дөрвөн шагай орхиж — өөр өөр тал олон байх тусам илүү оноо.",
        `Робот эсвэл өрсөлдөгчтэй ээлжлэн; эхнийх нь ${TARGET_SCORE} оноонд хүрвэл ялна.`,
        "Онооны хүснэг, алхмууд: тоглоомын «?» эсвэл «Дүрэм».",
      ],
      mapHint: MAP_MN,
    },
    en: {
      steps: [
        "Throw 4 shagai — more unique top faces means more points.",
        `Take turns vs the robot (or online); first to ${TARGET_SCORE} points wins.`,
        "Full scoring table and steps: use ? in the header or Rules on the board.",
      ],
      mapHint: MAP_EN,
    },
  },
  "horse-race": {
    mn: {
      steps: [
        "Шагай шидэж морины тоог тоолно — нэг морь = тэмцээнд нэг алхам.",
        "Өөрийн морь түрүүлэхийн тулд оноогоо цуглуулна.",
        "Эхний 20 хүрсэн морь ялна.",
      ],
      mapHint: MAP_MN,
    },
    en: {
      steps: [
        "Throw shagai and count horses — each horse moves your runner one step.",
        "Push your horse forward on the track with those steps.",
        "First runner to reach 20 wins.",
      ],
      mapHint: MAP_EN,
    },
  },
  "four-powers": {
    mn: {
      steps: [
        "Морь → тэмээ → үхэр → хонь → дахин морь: өмнөх нь дараагийнхаа дугуйнд дарагдана.",
        "Раунд бүрт 4 суудал нэгэн зэрэг эрхэ сонгоно; дараа нь сонголтуудаар оноо тооцно (2–2, 3–1, эсвэл 0).",
        "Ганцаархагт та + 3 робот; сүлжээнд 1–4 тоглогч өрөөнд, суудал дутвал робот.",
        `${WIN_SCORE} оноо түрүүнд ганцаархан гарсан суудал ялна — олон хүн тэнцвэл үргэлжилнэ.`,
      ],
      mapHint: MAP_MN,
    },
    en: {
      steps: [
        "Horse → camel → ox → sheep → horse: each power beats the next in the ring.",
        "Every round all four seats pick at once; points come from the 2–2 or 3–1 split (or 0 if all same or all different).",
        "Solo: you vs three bots. Online: 1–4 humans in a room, bots fill empty seats.",
        `First sole leader at ${WIN_SCORE} points wins — ties at the top keep the match going.`,
      ],
      mapHint: MAP_EN,
    },
  },
  "wooden-dice": {
    mn: {
      steps: [
        "Гурван модон шоог шидэж нийлбэрийг харна.",
        "Раунд бүрт өндөр нийлбэртэй тал ялна.",
        "Эхний 5 раунд хожсон тоглогч ялна.",
        "Зүүн/баруун: таны ба өрсөлдөгчийн нүд + нийлбэр. Төвд 3D шоо — дээд нүд шидэлттэй таарна.",
      ],
      mapHint: MAP_MN,
    },
    en: {
      steps: [
        "Roll three wooden dice and compare totals.",
        "Higher sum wins each round.",
        "First player to win five rounds wins the game.",
        "On screen: your dice, opponent’s dice, and totals. Center 3D dice: top face matches the roll.",
      ],
      mapHint: MAP_EN,
    },
  },
  default: {
    mn: {
      steps: [
        "Дэлгэц дээрх товчоор тоглоно.",
        "Дээд талын «?» дээр дарч дүрмийг харна.",
        "Хаах товчоор тоглоомыг хаана.",
      ],
      mapHint: MAP_MN,
    },
    en: {
      steps: [
        "Use the on-screen controls to play.",
        "Tap “?” in the header for rules; use Rules on the board for a quick sheet.",
        "Close the modal with the X when you’re done.",
      ],
      mapHint: MAP_EN,
    },
  },
};

function entryFor(gameType: string): HowToEntry {
  return HOW[gameType] ?? HOW.default!;
}

export function getHowToSteps(gameType: string, isMn: boolean): string[] {
  const e = entryFor(gameType);
  return isMn ? e.mn.steps : e.en.steps;
}

export function getHowToLines(gameType: string, isMn: boolean): string[] {
  return getHowToSteps(gameType, isMn);
}

export function getHowToMapHint(
  gameType: string,
  isMn: boolean,
): string | null {
  const e = entryFor(gameType);
  const h = isMn ? e.mn.mapHint : e.en.mapHint;
  return h?.trim() ? h : null;
}

export function getHowToAtStationHint(gameType: string, isMn: boolean): string {
  const e = entryFor(gameType);
  const custom = (isMn ? e.mn.atStationHint : e.en.atStationHint)?.trim();
  if (custom) return custom;
  return isMn ? AT_STATION_DEFAULT_MN : AT_STATION_DEFAULT_EN;
}
