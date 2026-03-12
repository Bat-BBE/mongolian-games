export type DashLang = "mn" | "en";

export interface DashStrings {
  knowledgePoints: string;
  dailyTokens: string;
  rank: string;
  rankTitle: string;
  title: string;
  nav: {
    dashboard: string;
    map: string;
    stations: string;
    profile: string;
  };

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
  theme: {
    light: string;
    dark: string;
    system: string;
    toggle: string;
  };
}

export const DASH_STRINGS: Record<DashLang, DashStrings> = {
  mn: {
    title: "МОНГОЛЫН УЛАМЖЛАЛТ ТОГЛООМ",
    knowledgePoints: "Мэдлэгийн Оноо",
    dailyTokens: "Өдрийн Токен",
    rank: "Зэрэг Дэвших",
    rankTitle: "Элч",
    nav: {
      dashboard: "Хяналтын самбар",
      map: "Газрын зураг",
      stations: "Уртнууд",
      profile: "Профайл",
    },

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
      {
        id: "ulaanbaatar", name: "Нийслэл хүрээ",
        gameName: "Наадмын Арена",
        gameDesc: "Нийслэлийн их наадмын уралдаанд оролцоорой.",
        reward: "+250 МО", available: true,
      },
      {
        id: "zuunmod", name: "Богд хан уул",
        gameName: "Ойн Анчин",
        gameDesc: "Богдын уулын ойгоор анчлаж, ур чадвараа сорь.",
        reward: "+180 МО", available: true,
      },
      {
        id: "terelj", name: "Сүхбаатар жанжин",
        gameName: "Бүргэдний Нислэг",
        gameDesc: "Хан Хэнтийн нурууны бүргэдчин болж, бүргэдэн харваагаа сурга.",
        reward: "+220 МО", available: false,
      },
      {
        id: "nalaikh", name: "Налайх",
        gameName: "Нүүрсний Уурхай",
        gameDesc: "Уурхайн гүнд нуугдсан эрдэнэсийг олж авахад тусал.",
        reward: "+160 МО", available: false,
      },
      {
        id: "kharakhorum", name: "Хархорум",
        gameName: "Сур Харвах",
        gameDesc: "Монголын уламжлалт сур харваанд дадлагажиж, зорилтоо оноо.",
        reward: "+200 МО", available: false,
      },
      {
        id: "arvaikheer", name: "Арвайхээр",
        gameName: "Шагай Наадам",
        gameDesc: "Шагайгаараа нарийн тааруулж, оноо цуглуул.",
        reward: "+190 МО", available: false,
      },
      {
        id: "orkhon_river", name: "Орхон Гол",
        gameName: "Морин Уралдаан",
        gameDesc: "Тал нутгийн уламжлалт морин уралдаанд оролцоорой.",
        reward: "+350 МО", available: false,
      },
      {
        id: "mandalgovi", name: "Мандалговь",
        gameName: "Тэмээн Зам",
        gameDesc: "Говийн замаар тэмээгээ хөтөлж хүрэлцэ.",
        reward: "+280 МО", available: false,
      },

      // ── ХОЙД ───────────────────────────────────────────────
      {
        id: "darkhan", name: "Дархан",
        gameName: "Дархны Урлаг",
        gameDesc: "Төмрийн дархны уламжлалт техникийг эзэмш.",
        reward: "+210 МО", available: false,
      },
      {
        id: "erdenet", name: "Эрдэнэт",
        gameName: "Зэсийн Уурхай",
        gameDesc: "Эрдэнэтийн зэсийн уурхайн нууцыг тайл.",
        reward: "+240 МО", available: false,
      },
      {
        id: "sukhbaatar", name: "Сүхбаатар",
        gameName: "Галт Тэргэний Зам",
        gameDesc: "Транс-Монголын төмөр замын түүхийг мэдэ.",
        reward: "+200 МО", available: false,
      },
      {
        id: "moron", name: "Мөрөн",
        gameName: "Хөвсгөлийн Загасчин",
        gameDesc: "Хөвсгөл нуурт загасчлаж, хамгийн том загасыг ол.",
        reward: "+260 МО", available: false,
      },
      {
        id: "khatgal", name: "Хатгал",
        gameName: "Хөвсгөлийн Аялал",
        gameDesc: "Монголын далай гэгддэг Хөвсгөл нуурт завиар аял.",
        reward: "+300 МО", available: false,
      },

      // ── БАРУУН ─────────────────────────────────────────────
      {
        id: "uliastai", name: "Улиастай",
        gameName: "Завханы Тэмцэл",
        gameDesc: "Завхан аймгийн уламжлалт бөх барилдаанд ялалт байгуул.",
        reward: "+320 МО", available: false,
      },
      {
        id: "bayankhongor", name: "Баянхонгор",
        gameName: "Цаг Уурын Мэргэн",
        gameDesc: "Уул нурууны цаг агаарыг таамаглаж, аялагчдыг аврахад тусал.",
        reward: "+270 МО", available: false,
      },
      {
        id: "altai", name: "Алтай",
        gameName: "Бөх Барилдаан",
        gameDesc: "Монголын бөхийн уламжлалт арга техникийг эзэмш.",
        reward: "+420 МО", available: false,
      },
      {
        id: "khovd", name: "Ховд",
        gameName: "Казахын Бүргэдчин",
        gameDesc: "Ховдын Казах бүргэдчдийн нууцыг сурч, бүргэдийг сургах.",
        reward: "+380 МО", available: false,
      },
      {
        id: "ulaangom", name: "Улаангом",
        gameName: "Увсын Нуур",
        gameDesc: "Увсын нуурын экосистемийг хамгаалж, ховор шувуудыг буцааж өгөх.",
        reward: "+290 МО", available: false,
      },

      // ── ЗҮҮН ───────────────────────────────────────────────
      {
        id: "ondorhaan", name: "Өндөрхаан",
        gameName: "Хэнтийн Гэрэгэ",
        gameDesc: "Чингис хааны нутаг Хэнтийгээр гэрэгэ барин давхи.",
        reward: "+340 МО", available: false,
      },
      {
        id: "kherlenbayan", name: "Хэрлэн Баян",
        gameName: "Нүүдлийн Замнал",
        gameDesc: "Хэрлэн голын дагуу нүүдлийн маршрутыг тогтоо.",
        reward: "+230 МО", available: false,
      },
      {
        id: "choibalsan", name: "Чойбалсан",
        gameName: "Зүүн Монголын Тал",
        gameDesc: "Зүүн монголын өргөн тал нутгийг туулан аялж, сүрэг адуугаа хариул.",
        reward: "+400 МО", available: false,
      },
      {
        id: "baruun_urt", name: "Баруун-Урт",
        gameName: "Сүхбаатарын Нутаг",
        gameDesc: "Хувьсгалт баатрын нутагт уламжлалт тоглоомуудыг мэдэ.",
        reward: "+310 МО", available: false,
      },

      // ── ӨМНӨД ГОВЬ ────────────────────────────────────────
      {
        id: "dalanzadgad", name: "Даланзадгад",
        gameName: "Говийн Динозавр",
        gameDesc: "Өмнөговийн элсэнд нуугдсан динозаврын яснуудыг ухаж ол.",
        reward: "+360 МО", available: false,
      },
      {
        id: "sainshand", name: "Сайншанд",
        gameName: "Галт Тэрэгний Замч",
        gameDesc: "Дорноговийн УБТЗ-ын замчин болж, ачааг аюулгүй хүргэ.",
        reward: "+250 МО", available: false,
      },
      {
        id: "zamiin_uud", name: "Замын-Үүд",
        gameName: "Хилийн Наймаачин",
        gameDesc: "Хятадын хилийн боомтоор дамжуулан наймааны тоглоом явуул.",
        reward: "+450 МО", available: false,
      },
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
    theme: {
      light: "Цайвар",
      dark: "Харанхуй",
      system: "Систем",
      toggle: "Theme солих",
    },
  },

  en: {
    title: "MONGOLIAN TRADITIONAL GAMES",
    knowledgePoints: "Knowledge Points",
    dailyTokens: "Daily Tokens",
    rank: "Rank Progression",
    rankTitle: "Messenger",
    nav: {
      dashboard: "Dashboard",
      map: "Map",
      stations: "Stations",
      profile: "Profile",
    },

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
      // ── CENTRAL ────────────────────────────────────────────
      {
        id: "ulaanbaatar", name: "Ulaanbaatar",
        gameName: "Naadam Arena",
        gameDesc: "Compete in the capital's grand Naadam festival games.",
        reward: "+250 KP", available: true,
      },
      {
        id: "zuunmod", name: "Zuunmod",
        gameName: "Forest Hunter",
        gameDesc: "Hunt through the Bogd Khan forest and test your skills.",
        reward: "+180 KP", available: true,
      },
      {
        id: "terelj", name: "Terelj",
        gameName: "Eagle Flight",
        gameDesc: "Become an eagle hunter of Khan Khentii and train your eagle.",
        reward: "+220 KP", available: false,
      },
      {
        id: "nalaikh", name: "Nalaikh",
        gameName: "Coal Mine",
        gameDesc: "Help retrieve treasures hidden deep in the mine.",
        reward: "+160 KP", available: false,
      },
      {
        id: "kharakhorum", name: "Kharakhorum",
        gameName: "Archery",
        gameDesc: "Train in traditional Mongolian archery and hit your target.",
        reward: "+200 KP", available: false,
      },
      {
        id: "arvaikheer", name: "Arvaikheer",
        gameName: "Shagai Game",
        gameDesc: "Flick your ankle bone precisely and collect points.",
        reward: "+190 KP", available: false,
      },
      {
        id: "orkhon_river", name: "Orkhon River",
        gameName: "Horse Racing",
        gameDesc: "Compete in a traditional steppe horse race.",
        reward: "+350 KP", available: false,
      },
      {
        id: "mandalgovi", name: "Mandalgovi",
        gameName: "Camel Trail",
        gameDesc: "Lead your camel across the desert to the destination.",
        reward: "+280 KP", available: false,
      },

      // ── NORTH ──────────────────────────────────────────────
      {
        id: "darkhan", name: "Darkhan",
        gameName: "Blacksmith's Art",
        gameDesc: "Master the traditional techniques of iron crafting.",
        reward: "+210 KP", available: false,
      },
      {
        id: "erdenet", name: "Erdenet",
        gameName: "Copper Mine",
        gameDesc: "Solve the mysteries of Erdenet's copper mines.",
        reward: "+240 KP", available: false,
      },
      {
        id: "sukhbaatar", name: "Sukhbaatar",
        gameName: "Railway Line",
        gameDesc: "Learn the history of the Trans-Mongolian Railway.",
        reward: "+200 KP", available: false,
      },
      {
        id: "moron", name: "Moron",
        gameName: "Khovsgol Fisherman",
        gameDesc: "Fish in Lake Khovsgol and find the biggest catch.",
        reward: "+260 KP", available: false,
      },
      {
        id: "khatgal", name: "Khatgal",
        gameName: "Lake Khovsgol Journey",
        gameDesc: "Sail across Mongolia's 'Blue Pearl', Lake Khovsgol.",
        reward: "+300 KP", available: false,
      },

      // ── WEST ───────────────────────────────────────────────
      {
        id: "uliastai", name: "Uliastai",
        gameName: "Zavkhan Wrestling",
        gameDesc: "Win the traditional wrestling match of Zavkhan aimag.",
        reward: "+320 KP", available: false,
      },
      {
        id: "bayankhongor", name: "Bayankhongor",
        gameName: "Weather Sage",
        gameDesc: "Predict mountain weather and help rescue travelers.",
        reward: "+270 KP", available: false,
      },
      {
        id: "altai", name: "Altai",
        gameName: "Wrestling",
        gameDesc: "Master the techniques of traditional Mongolian wrestling.",
        reward: "+420 KP", available: false,
      },
      {
        id: "khovd", name: "Khovd",
        gameName: "Kazakh Eagle Hunter",
        gameDesc: "Learn the secrets of Khovd's Kazakh eagle hunters.",
        reward: "+380 KP", available: false,
      },
      {
        id: "ulaangom", name: "Ulaangom",
        gameName: "Uvs Lake",
        gameDesc: "Protect the ecosystem of Uvs Lake and return rare birds.",
        reward: "+290 KP", available: false,
      },

      // ── EAST ───────────────────────────────────────────────
      {
        id: "ondorhaan", name: "Ondorhaan",
        gameName: "Khentii Gerege",
        gameDesc: "Ride through Chinggis Khan's homeland carrying the gerege.",
        reward: "+340 KP", available: false,
      },
      {
        id: "kherlenbayan", name: "Kherlenbayan",
        gameName: "Nomadic Route",
        gameDesc: "Establish the nomadic migration route along the Kherlen River.",
        reward: "+230 KP", available: false,
      },
      {
        id: "choibalsan", name: "Choibalsan",
        gameName: "Eastern Steppe",
        gameDesc: "Journey across the vast Eastern Mongolian steppe and herd horses.",
        reward: "+400 KP", available: false,
      },
      {
        id: "baruun_urt", name: "Baruun-Urt",
        gameName: "Sukhbaatar's Land",
        gameDesc: "Learn traditional games in the homeland of the revolutionary hero.",
        reward: "+310 KP", available: false,
      },

      // ── SOUTH GOBI ─────────────────────────────────────────
      {
        id: "dalanzadgad", name: "Dalanzadgad",
        gameName: "Gobi Dinosaur",
        gameDesc: "Excavate dinosaur bones hidden in the Gobi sands.",
        reward: "+360 KP", available: false,
      },
      {
        id: "sainshand", name: "Sainshand",
        gameName: "Railway Engineer",
        gameDesc: "Work as a UBTZ engineer and deliver cargo safely.",
        reward: "+250 KP", available: false,
      },
      {
        id: "zamiin_uud", name: "Zamiin-Uud",
        gameName: "Border Trader",
        gameDesc: "Run a trade game across the Chinese border crossing.",
        reward: "+450 KP", available: false,
      },
    ],

    skillChallenge: "Skill Challenge",
    challengeTitle: "Ger Building",
    challengeDesc: "A local nomad family needs help setting up their winter camp. Precision is key!",
    accept: "Accept",
    xpReward: "+150 KP",

    stageName: "Orkhon Crossing",
    stageDesc: "The cradle of nomadic civilizations. Master the traditional equestrian arts to earn your passage.",
    minigame: "Mini-Game: Archery",
    lore: "Cultural Lore",
    theme: {
      light: "Light",
      dark: "Dark",
      system: "System",
      toggle: "Theme Mode",
    },
  },
};