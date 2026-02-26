
export type DashLang = "mn" | "en";

export interface DashStrings {

  knowledgePoints: string;
  dailyTokens: string;
  rank: string;
  rankTitle: string;
  title: string;

  currentExpedition: string;
  mainQuest: string;
  questTitle: string;
  questDesc: string;
  continueJourney: string;
  treasury: string;

  urtuuChain: string;
  discovered: string;
  masteries: string;
  seasonCycle: string;
  seasons: { spring: string; summer: string; autumn: string; winter: string };

  currentLocation: string;
  nextStation: string;
  locked: string;

  leaderboard: string;
  activeBonus: string;
  journal: string;
  beginRelay: string;

  stations: {
    id: string;
    name: string;
    gameName: string;
    gameDesc: string;
    reward: string;
    available: boolean;
  }[];

  skillChallenge: string;
  challengeTitle: string;
  challengeDesc: string;
  accept: string;
  xpReward: string;

  stageName: string;
  stageDesc: string;
  minigame: string;
  lore: string;
}

export const DASH_STRINGS: Record<DashLang, DashStrings> = {
  mn: {
    title: "МОНГОЛ УЛАМЖЛАЛТ ТОГЛООМ",
    knowledgePoints: "Мэдлэгийн Оноо",
    dailyTokens: "Өдрийн Токен",
    rank: "Зэрэг Дэвших",
    rankTitle: "Элч",

    currentExpedition: "Одоогийн Аялал",
    mainQuest: "Үндсэн Даалгавар",
    questTitle: "Талын Элч",
    questDesc: "Орхоны хөндийг гатлан Их Хааны тамгыг хүргэх. Өөрчлөгдөх салхинаас болгоомжил.",
    continueJourney: "Аяллыг Үргэлжлүүлэх",
    treasury: "Эрдэнэс",

    urtuuChain: "Уртуу Гинж",
    discovered: "Нээгдсэн",
    masteries: "Ур Чадвар",
    seasonCycle: "Улирлын Эргэлт",
    seasons: { spring: "Хавар", summer: "Зун", autumn: "Намар", winter: "Өвөл" },

    currentLocation: "Одоогийн байршил",
    nextStation: "Дараагийн уртуу",
    locked: "Хаалттай",

    leaderboard: "Жагсаалт",
    activeBonus: "Идэвхтэй Бонус",
    journal: "Өдрийн Тэмдэглэл",
    beginRelay: "Шинэ Уртуу Эхлүүлэх",

    stations: [
      { id: "kharakhorum", name: "Хархорум", gameName: "Сур Харвах", gameDesc: "Монголын уламжлалт сур харваанд дадлагажиж, зорилтоо оноо.", reward: "+200 МО", available: true },
      { id: "orkhon", name: "Орхон Хөндий", gameName: "Морин Уралдаан", gameDesc: "Тал нутгийн уламжлалт морин уралдаанд оролцоорой.", reward: "+350 МО", available: false },
      { id: "erdenet", name: "Эрдэнэт Буйр", gameName: "Шагай Наадам", gameDesc: "Шагайгаараа нарийн тааруулж, оноо цуглуул.", reward: "+180 МО", available: false },
      { id: "altai", name: "Алтай Бэхлэлт", gameName: "Бөх Барилдаан", gameDesc: "Монголын бөхийн уламжлалт арга техникийг эзэмш.", reward: "+420 МО", available: false },
      { id: "gobi", name: "Говийн Гарам", gameName: "Тэмээн Зам", gameDesc: "Говийн замаар тэмээгээ хөтөлж хүрэлцэ.", reward: "+300 МО", available: false },
    ],

    skillChallenge: "Ур Чадварын Сорил",
    challengeTitle: "Гэр Барих",
    challengeDesc: "Нутгийн нүүдэлчин гэр бүл өвлийн буудалдаа тусламж хүсэж байна. Нарийвчлал чухал!",
    accept: "Хүлээн авах",
    xpReward: "+150 МО",

    stageName: "Орхоны Гарам",
    stageDesc: "Нүүдлийн соёлын өлгий нутаг. Эдгээр ариун газраар дамжин өнгөрөхийн тулд уламжлалт морин урлагаа мэргэшүүл.",
    minigame: "Мини-Тоглоом: Сур Харвах",
    lore: "Соёлын Түүх",
  },

  en: {
    title: "MONGOLIAN TRADITIONAL GAMES",
    knowledgePoints: "Knowledge Points",
    dailyTokens: "Daily Tokens",
    rank: "Rank Progression",
    rankTitle: "Messenger",

    currentExpedition: "Current Expedition",
    mainQuest: "Main Quest",
    questTitle: "The Steppe Messenger",
    questDesc: "Crossing the Orkhon Valley to deliver the seal of the Great Khan. Beware of the changing winds.",
    continueJourney: "Continue Journey",
    treasury: "Treasury",

    urtuuChain: "Urtuu Chain",
    discovered: "Discovered",
    masteries: "Masteries",
    seasonCycle: "Season Cycle",
    seasons: { spring: "Spring", summer: "Summer", autumn: "Autumn", winter: "Winter" },

    currentLocation: "Current location",
    nextStation: "Next station",
    locked: "Locked",

    leaderboard: "Leaderboard",
    activeBonus: "Active Relay Bonus",
    journal: "Journal",
    beginRelay: "Begin New Relay",

    stations: [
      { id: "kharakhorum", name: "Kharakhorum", gameName: "Archery", gameDesc: "Train in traditional Mongolian archery and hit your target.", reward: "+200 KP", available: true },
      { id: "orkhon", name: "Orkhon Valley", gameName: "Horse Racing", gameDesc: "Compete in a traditional steppe horse race.", reward: "+350 KP", available: false },
      { id: "erdenet", name: "Erdenet Buir", gameName: "Shagai Game", gameDesc: "Flick your ankle bone and collect points.", reward: "+180 KP", available: false },
      { id: "altai", name: "Altai Fortress", gameName: "Wrestling", gameDesc: "Master the techniques of traditional Mongolian wrestling.", reward: "+420 KP", available: false },
      { id: "gobi", name: "Gobi Crossing", gameName: "Camel Trail", gameDesc: "Lead your camel across the desert to the destination.", reward: "+300 KP", available: false },
    ],

    skillChallenge: "Skill Challenge",
    challengeTitle: "Ger Building",
    challengeDesc: "A local nomad family needs help setting up their winter camp. Precision is key!",
    accept: "Accept",
    xpReward: "+150 KP",

    stageName: "Orkhon Crossing",
    stageDesc: "The cradle of nomadic civilizations. Master the traditional equestrian arts to earn your passage through these sacred lands.",
    minigame: "Mini-Game: Archery",
    lore: "Cultural Lore",
  },
};