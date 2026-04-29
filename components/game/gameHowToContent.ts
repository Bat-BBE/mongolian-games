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
        "Талбар дээрх шагайнуудаас ижил талтай хос олж нясална. Нясалсны дараа хосоос нэгийг авч талбарт үргэлжлүүлнэ. Эцэст нь ганц шагай үлдвэл ялна.",
        "① Хос сонгох: Ижил талтай 2 шагай сонгоно.",
        "② Зам зурах: Эхний шагайгаас нөгөө шагай руу чирж зам татна.",
        "③ Няслах: «Няслах» дарж мөргөлдүүлнэ.",
        "④ Нэгийг авах: Нясалсан хосоос нэг шагайг авна.",
        "⑤ Ялалт: Нэг шагай үлдэх хүртэл давтсаар ялна.",
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
        "Доорх хайрцагт байгаа шатны дарааллыг мөрдөнө (4×4 → 3×3 → 2×∞).",
        "Нэг шидэлтэнд дээрээ морьтой гарсан шагай бүр +1 морины оноо.",
        "Табло — хамгийн түрүүнд 12 морины оноо хүргэгч ялна.",
        "Өрөөнд зөвхөн таных бол ~10–15 секундын дараа роботтой автоматаар эхэлнэ.",
      ],
      mapHint: MAP_MN,
    },
    en: {
      steps: [
        "Follow the tier strip below: 4×4, then 3×3, then 2-bone throws until the match ends.",
        "Each bone showing horse on top adds +1 horse point for that throw.",
        "Scoreboard: first to 12 horse points wins.",
        "Solo in a room: the match auto-starts vs bots after about 10–15 seconds.",
      ],
      mapHint: MAP_EN,
    },
  },
  "berkh-12-shagai": {
    mn: {
      steps: [
        "2–4 суудал ээлжээр нэг дор 4 шагай шиднэ — зөвхөн морь, тэмээгээр овоо шилжинэ.",
        "Морь — өмнөх идэвхтэй суудлаас, тэмээ — дараагийн суудалд; 0 бол хасагдана.",
        "Ялалт: бүх шагай, сүүлийн үлдсэн, эсвэл ээлжийн төгсгөл.",
      ],
      mapHint: MAP_MN,
    },
    en: {
      steps: [
        "2–4 seats take turns throwing 4 bones at once. Only horses & camels move mories.",
        "Horse takes from the previous active seat; camel pays the next. 0 mories = out.",
        "Win: all bones, last standing, or turn-cap tie-break.",
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
        "Морь → тэмээ → үхэр → хонь → дахин морь: циклын дагуу хэн хэнийгээ дийлдэг.",
        "Раунд бүр 4 суудал нэгэн зэрэг сонголт хийнэ; суудал бүр дийлсэн өрсөлдөгч бүртээ +1 суурь оноо авна (нарийвчилсан нөлөө: модалын доор).",
        "Ганцаархагт та + 3 робот; сүлжээнд 1–4 тоглогч, суудал дутвал робот.",
        `${WIN_SCORE} оноонд түрүүлж ганцаархан гарсан суудал ялна; тэнцвэл үргэлжилнэ.`,
      ],
      mapHint: MAP_MN,
    },
    en: {
      steps: [
        "Horse → camel → ox → sheep → horse: each power beats the next in the ring.",
        "All four seats lock in each round; each seat gains +1 base point per opponent it beats (effects below).",
        "Solo: you vs three bots. Online: 1–4 humans; bots fill empty seats.",
        `First sole leader at ${WIN_SCORE} points wins; ties at the top keep the match going.`,
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
