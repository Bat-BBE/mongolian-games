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
    games: {
      id: string;
      name: string;
      desc: string;
      reward: string;
      isDone: boolean;
    }[];
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

    currentExpedition: "Одоогийн Өртөө",
    mainQuest: "Үндсэн Даалгавар",
    questTitle: "Талын Элч",
    questDesc:
      "Орхоны хөндийг гатлан Их Хааны тамгыг хүргэх. Өөрчлөгдөх салхинаас болгоомжил.",
    continueJourney: "Аяллыг Үргэлжлүүлэх",
    treasury: "Эрдэнэс",

    urtuuChain: "Өртөө Гинж",
    discovered: "Нээгдсэн",
    masteries: "Ур Чадвар",
    seasonCycle: "Улирлын Эргэлт",
    seasons: {
      spring: "Хавар",
      summer: "Зун",
      autumn: "Намар",
      winter: "Өвөл",
    },

    currentLocation: "Одоогийн байршил",
    nextStation: "Дараагийн уртуу",
    locked: "Хаалттай",

    leaderboard: "Жагсаалт",
    activeBonus: "Идэвхтэй Оноо",
    journal: "Өдрийн Тэмдэглэл",
    beginRelay: "Шинэ Өртөө эхлүүлэх Эхлүүлэх",

    stations: [
      {
        id: "ulaanbaatar",
        name: "Богд Хан Ордон",
        games: [
          {
            id: "naadam",
            name: "Наадмын Арена",
            desc: "Нийслэлийн их наадмын уралдаанд оролцоорой.",
            reward: "+250 МО",
            isDone: false,
          },
          {
            id: "shagai",
            name: "Шагай Наадам",
            desc: "Шагайгаараа нарийн тааруулж, оноо цуглуул.",
            reward: "+100 МО",
            isDone: false,
          },
        ],
        available: true,
      },
      {
        id: "zuunmod",
        name: "Манзушир Хийд",
        games: [
          {
            id: "forest_hunter",
            name: "Ойн Анчин",
            desc: "Богдын уулын ойгоор анчлаж, ур чадвараа сорь.",
            reward: "+180 МО",
            isDone: false,
          },
        ],
        available: true,
      },
      {
        id: "terelj",
        name: "Арьяабал Хийд",
        games: [
          {
            id: "eagle_flight",
            name: "Бүргэдний Нислэг",
            desc: "Хан Хэнтийн нурууны бүргэдчин болж, бүргэдэн харваагаа сурга.",
            reward: "+220 МО",
            isDone: false,
          },
        ],
        available: false,
      },
      {
        id: "nalaikh",
        name: "Нялга Агуй",
        games: [
          {
            id: "mine",
            name: "Нүүрсний Уурхай",
            desc: "Уурхайн гүнд нуугдсан эрдэнэсийг олж авахад тусал.",
            reward: "+160 МО",
            isDone: false,
          },
        ],
        available: false,
      },
      {
        id: "kharakhorum",
        name: "Эрдэнэзуу Хийд",
        games: [
          {
            id: "archery",
            name: "Сур Харвах",
            desc: "Монголын уламжлалт сур харваанд дадлагажиж, зорилтоо оноо.",
            reward: "+200 МО",
            isDone: false,
          },
          {
            id: "puzzle",
            name: "Оньс Гогцоо",
            desc: "Эртний оньсого тааж оюунаа сорь.",
            reward: "+150 МО",
            isDone: false,
          },
        ],
        available: false,
      },
      {
        id: "arvaikheer",
        name: "Цагаан Суварга",
        games: [
          {
            id: "shagai",
            name: "Шагай Наадам",
            desc: "Шагайгаараа нарийн тааруулж, оноо цуглуул.",
            reward: "+190 МО",
            isDone: false,
          },
        ],
        available: false,
      },
      {
        id: "orkhon_river",
        name: "Орхоны Хөндий",
        games: [
          {
            id: "horse_racing",
            name: "Морин Уралдаан",
            desc: "Тал нутгийн уламжлалт морин уралдаанд оролцоорой.",
            reward: "+350 МО",
            isDone: false,
          },
        ],
        available: false,
      },
      {
        id: "mandalgovi",
        name: "Онгийн Хийд",
        games: [
          {
            id: "camel_trail",
            name: "Тэмээн Зам",
            desc: "Говийн замаар тэмээгээ хөтөлж хүрэлцэ.",
            reward: "+280 МО",
            isDone: false,
          },
        ],
        available: false,
      },

      {
        id: "darkhan",
        name: "Хустайн Нуруу",
        games: [
          {
            id: "blacksmith",
            name: "Дархны Урлаг",
            desc: "Төмрийн дархны уламжлалт техникийг эзэмш.",
            reward: "+210 МО",
            isDone: false,
          },
        ],
        available: false,
      },
      {
        id: "erdenet",
        name: "Амарбаясгалант Хийд",
        games: [
          {
            id: "copper_mine",
            name: "Зэсийн Уурхай",
            desc: "Эрдэнэтийн зэсийн уурхайн нууцыг тайл.",
            reward: "+240 МО",
            isDone: false,
          },
        ],
        available: false,
      },
      {
        id: "sukhbaatar",
        name: "Алтан Булаг",
        games: [
          {
            id: "railway",
            name: "Галт Тэргэний Зам",
            desc: "Транс-Монголын төмөр замын түүхийг мэдэ.",
            reward: "+200 МО",
            isDone: false,
          },
        ],
        available: false,
      },
      {
        id: "moron",
        name: "Дэлгэр Мөрөн",
        games: [
          {
            id: "fisherman",
            name: "Хөвсгөлийн Загасчин",
            desc: "Хөвсгөл нуурт загасчлаж, хамгийн том загасыг ол.",
            reward: "+260 МО",
            isDone: false,
          },
        ],
        available: false,
      },
      {
        id: "khatgal",
        name: "Хөвсгөл Нуур",
        games: [
          {
            id: "lake_journey",
            name: "Хөвсгөлийн Аялал",
            desc: "Монголын далай гэгддэг Хөвсгөл нуурт завиар аял.",
            reward: "+300 МО",
            isDone: false,
          },
        ],
        available: false,
      },

      {
        id: "uliastai",
        name: "Отгонтэнгэр Уул",
        games: [
          {
            id: "zavkhan_wrestling",
            name: "Завханы Тэмцэл",
            desc: "Завхан аймгийн уламжлалт бөх барилдаанд ялалт байгуул.",
            reward: "+320 МО",
            isDone: false,
          },
        ],
        available: false,
      },
      {
        id: "bayankhongor",
        name: "Яхын Нуур",
        games: [
          {
            id: "weather_sage",
            name: "Цаг Уурын Мэргэн",
            desc: "Уул нурууны цаг агаарыг таамаглаж, аялагчдыг аврахад тусал.",
            reward: "+270 МО",
            isDone: false,
          },
        ],
        available: false,
      },
      {
        id: "altai",
        name: "Алтайн Нуруу",
        games: [
          {
            id: "wrestling",
            name: "Бөх Барилдаан",
            desc: "Монголын бөхийн уламжлалт арга техникийг эзэмш.",
            reward: "+420 МО",
            isDone: false,
          },
        ],
        available: false,
      },
      {
        id: "khovd",
        name: "Буянт Ухаа",
        games: [
          {
            id: "kazakh_eagle",
            name: "Казахын Бүргэдчин",
            desc: "Ховдын Казах бүргэдчдийн нууцыг сурч, бүргэдийг сургах.",
            reward: "+380 МО",
            isDone: false,
          },
        ],
        available: false,
      },
      {
        id: "ulaangom",
        name: "Увс Нуур",
        games: [
          {
            id: "uvs_lake",
            name: "Увсын Нуур",
            desc: "Увсын нуурын экосистемийг хамгаалж, ховор шувуудыг буцааж өгөх.",
            reward: "+290 МО",
            isDone: false,
          },
        ],
        available: false,
      },

      {
        id: "ondorhaan",
        name: "Бурхан Халдун",
        games: [
          {
            id: "khentii_gerege",
            name: "Хэнтийн Гэрэгэ",
            desc: "Чингис хааны нутаг Хэнтийгээр гэрэгэ барин давхи.",
            reward: "+340 МО",
            isDone: false,
          },
        ],
        available: false,
      },
      {
        id: "kherlenbayan",
        name: "Аврага Тосгон",
        games: [
          {
            id: "nomad_route",
            name: "Нүүдлийн Замнал",
            desc: "Хэрлэн голын дагуу нүүдлийн маршрутыг тогтоо.",
            reward: "+230 МО",
            isDone: false,
          },
        ],
        available: false,
      },
      {
        id: "choibalsan",
        name: "Хэрлэн Тохой",
        games: [
          {
            id: "eastern_steppe",
            name: "Зүүн Монголын Тал",
            desc: "Зүүн монголын өргөн тал нутгийг туулан аялж, сүрэг адуугаа хариул.",
            reward: "+400 МО",
            isDone: false,
          },
        ],
        available: false,
      },
      {
        id: "baruun_urt",
        name: "Дадал",
        games: [
          {
            id: "sukhbaatar_land",
            name: "Сүхбаатарын Нутаг",
            desc: "Хувьсгалт баатрын нутагт уламжлалт тоглоомуудыг мэдэ.",
            reward: "+310 МО",
            isDone: false,
          },
        ],
        available: false,
      },

      {
        id: "dalanzadgad",
        name: "Хонгорын Элс",
        games: [
          {
            id: "gobi_dinosaur",
            name: "Говийн Динозавр",
            desc: "Өмнөговийн элсэнд нуугдсан динозаврын яснуудыг ухаж ол.",
            reward: "+360 МО",
            isDone: false,
          },
        ],
        available: false,
      },
      {
        id: "sainshand",
        name: "Хамарын Хийд",
        games: [
          {
            id: "railway_engineer",
            name: "Галт Тэрэгний Замч",
            desc: "Дорноговийн УБТЗ-ын замчин болж, ачааг аюулгүй хүргэ.",
            reward: "+250 МО",
            isDone: false,
          },
        ],
        available: false,
      },
      {
        id: "zamiin_uud",
        name: "Их Газрын Чулуу",
        games: [
          {
            id: "border_trader",
            name: "Хилийн Наймаачин",
            desc: "Хятадын хилийн боомтоор дамжуулан наймааны тоглоом явуул.",
            reward: "+450 МО",
            isDone: false,
          },
        ],
        available: false,
      },
    ],

    skillChallenge: "Ур Чадварын Сорил",
    challengeTitle: "Гэр Барих",
    challengeDesc:
      "Нутгийн нүүдэлчин гэр бүл өвлийн буудалдаа тусламж хүсэж байна. Нарийвчлал чухал!",
    accept: "Хүлээн авах",
    xpReward: "+150 МО",

    stageName: "Орхоны Гарам",
    stageDesc:
      "Нүүдлийн соёлын өлгий нутаг. Эдгээр ариун газраар дамжин өнгөрөхийн тулд уламжлалт морин урлагаа мэргэшүүл.",
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
    questDesc:
      "Crossing the Orkhon Valley to deliver the seal of the Great Khan. Beware of the changing winds.",
    continueJourney: "Continue Journey",
    treasury: "Treasury",

    urtuuChain: "Urtuu Chain",
    discovered: "Discovered",
    masteries: "Masteries",
    seasonCycle: "Season Cycle",
    seasons: {
      spring: "Spring",
      summer: "Summer",
      autumn: "Autumn",
      winter: "Winter",
    },

    currentLocation: "Current location",
    nextStation: "Next station",
    locked: "Locked",

    leaderboard: "Leaderboard",
    activeBonus: "Active Relay Bonus",
    journal: "Journal",
    beginRelay: "Begin New Relay",

    stations: [
      {
        id: "ulaanbaatar",
        name: "Bogd Khan Palace",
        games: [
          {
            id: "naadam",
            name: "Naadam Arena",
            desc: "Compete in the capital's grand Naadam festival games.",
            reward: "+250 KP",
            isDone: false,
          },
          {
            id: "shagai",
            name: "Shagai Game",
            desc: "Flick your ankle bone precisely and collect points.",
            reward: "+100 KP",
            isDone: false,
          },
        ],
        available: true,
      },
      {
        id: "zuunmod",
        name: "Manzushir Monastery",
        games: [
          {
            id: "forest_hunter",
            name: "Forest Hunter",
            desc: "Hunt through the Bogd Khan forest and test your skills.",
            reward: "+180 KP",
            isDone: false,
          },
        ],
        available: true,
      },
      {
        id: "terelj",
        name: "Aryabal Temple",
        games: [
          {
            id: "eagle_flight",
            name: "Eagle Flight",
            desc: "Become an eagle hunter of Khan Khentii and train your eagle.",
            reward: "+220 KP",
            isDone: false,
          },
        ],
        available: false,
      },
      {
        id: "nalaikh",
        name: "Nulag Cave",
        games: [
          {
            id: "mine",
            name: "Coal Mine",
            desc: "Help retrieve treasures hidden deep in the mine.",
            reward: "+160 KP",
            isDone: false,
          },
        ],
        available: false,
      },
      {
        id: "kharakhorum",
        name: "Erdene Zuu Monastery",
        games: [
          {
            id: "archery",
            name: "Archery",
            desc: "Train in traditional Mongolian archery and hit your target.",
            reward: "+200 KP",
            isDone: false,
          },
          {
            id: "puzzle",
            name: "Ancient Puzzle",
            desc: "Solve the historical mysteries of the capital.",
            reward: "+150 KP",
            isDone: false,
          },
        ],
        available: false,
      },
      {
        id: "arvaikheer",
        name: "White Stupa",
        games: [
          {
            id: "shagai",
            name: "Shagai Game",
            desc: "Flick your ankle bone precisely and collect points.",
            reward: "+190 KP",
            isDone: false,
          },
        ],
        available: false,
      },
      {
        id: "orkhon_river",
        name: "Orkhon Valley",
        games: [
          {
            id: "horse_racing",
            name: "Horse Racing",
            desc: "Compete in a traditional steppe horse race.",
            reward: "+350 KP",
            isDone: false,
          },
        ],
        available: false,
      },
      {
        id: "mandalgovi",
        name: "Ongiin Monastery",
        games: [
          {
            id: "camel_trail",
            name: "Camel Trail",
            desc: "Lead your camel across the desert to the destination.",
            reward: "+280 KP",
            isDone: false,
          },
        ],
        available: false,
      },

      {
        id: "darkhan",
        name: "Khustai National Park",
        games: [
          {
            id: "blacksmith",
            name: "Blacksmith's Art",
            desc: "Master the traditional techniques of iron crafting.",
            reward: "+210 KP",
            isDone: false,
          },
        ],
        available: false,
      },
      {
        id: "erdenet",
        name: "Amarbayasgalant Monastery",
        games: [
          {
            id: "copper_mine",
            name: "Copper Mine",
            desc: "Solve the mysteries of Erdenet's copper mines.",
            reward: "+240 KP",
            isDone: false,
          },
        ],
        available: false,
      },
      {
        id: "sukhbaatar",
        name: "Altan Bulag",
        games: [
          {
            id: "railway",
            name: "Railway Line",
            desc: "Learn the history of the Trans-Mongolian Railway.",
            reward: "+200 KP",
            isDone: false,
          },
        ],
        available: false,
      },
      {
        id: "moron",
        name: "Delger Moron",
        games: [
          {
            id: "fisherman",
            name: "Khovsgol Fisherman",
            desc: "Fish in Lake Khovsgol and find the biggest catch.",
            reward: "+260 KP",
            isDone: false,
          },
        ],
        available: false,
      },
      {
        id: "khatgal",
        name: "Lake Khovsgol",
        games: [
          {
            id: "lake_journey",
            name: "Lake Khovsgol Journey",
            desc: "Sail across Mongolia's 'Blue Pearl', Lake Khovsgol.",
            reward: "+300 KP",
            isDone: false,
          },
        ],
        available: false,
      },

      {
        id: "uliastai",
        name: "Otgontenger Mountain",
        games: [
          {
            id: "zavkhan_wrestling",
            name: "Zavkhan Wrestling",
            desc: "Win the traditional wrestling match of Zavkhan aimag.",
            reward: "+320 KP",
            isDone: false,
          },
        ],
        available: false,
      },
      {
        id: "bayankhongor",
        name: "Yakh Lake",
        games: [
          {
            id: "weather_sage",
            name: "Weather Sage",
            desc: "Predict mountain weather and help rescue travelers.",
            reward: "+270 KP",
            isDone: false,
          },
        ],
        available: false,
      },
      {
        id: "altai",
        name: "Altai Mountains",
        games: [
          {
            id: "wrestling",
            name: "Wrestling",
            desc: "Master the techniques of traditional Mongolian wrestling.",
            reward: "+420 KP",
            isDone: false,
          },
        ],
        available: false,
      },
      {
        id: "khovd",
        name: "Buyant Ukhaa",
        games: [
          {
            id: "kazakh_eagle",
            name: "Kazakh Eagle Hunter",
            desc: "Learn the secrets of Khovd's Kazakh eagle hunters.",
            reward: "+380 KP",
            isDone: false,
          },
        ],
        available: false,
      },
      {
        id: "ulaangom",
        name: "Uvs Lake",
        games: [
          {
            id: "uvs_lake",
            name: "Uvs Lake",
            desc: "Protect the ecosystem of Uvs Lake and return rare birds.",
            reward: "+290 KP",
            isDone: false,
          },
        ],
        available: false,
      },

      {
        id: "ondorhaan",
        name: "Burkhan Khaldun",
        games: [
          {
            id: "khentii_gerege",
            name: "Khentii Gerege",
            desc: "Ride through Chinggis Khan's homeland carrying the gerege.",
            reward: "+340 KP",
            isDone: false,
          },
        ],
        available: false,
      },
      {
        id: "kherlenbayan",
        name: "Avraga Town",
        games: [
          {
            id: "nomad_route",
            name: "Nomadic Route",
            desc: "Establish the nomadic migration route along the Kherlen River.",
            reward: "+230 KP",
            isDone: false,
          },
        ],
        available: false,
      },
      {
        id: "choibalsan",
        name: "Kherlen Bend",
        games: [
          {
            id: "eastern_steppe",
            name: "Eastern Steppe",
            desc: "Journey across the vast Eastern Mongolian steppe and herd horses.",
            reward: "+400 KP",
            isDone: false,
          },
        ],
        available: false,
      },
      {
        id: "baruun_urt",
        name: "Dadal",
        games: [
          {
            id: "sukhbaatar_land",
            name: "Sukhbaatar's Land",
            desc: "Learn traditional games in the homeland of the revolutionary hero.",
            reward: "+310 KP",
            isDone: false,
          },
        ],
        available: false,
      },

      {
        id: "dalanzadgad",
        name: "Khongoryn Els",
        games: [
          {
            id: "gobi_dinosaur",
            name: "Gobi Dinosaur",
            desc: "Excavate dinosaur bones hidden in the Gobi sands.",
            reward: "+360 KP",
            isDone: false,
          },
        ],
        available: false,
      },
      {
        id: "sainshand",
        name: "Khamariin Khiid",
        games: [
          {
            id: "railway_engineer",
            name: "Railway Engineer",
            desc: "Work as a UBTZ engineer and deliver cargo safely.",
            reward: "+250 KP",
            isDone: false,
          },
        ],
        available: false,
      },
      {
        id: "zamiin_uud",
        name: "Ikh Gazriin Chuluu",
        games: [
          {
            id: "border_trader",
            name: "Border Trader",
            desc: "Run a trade game across the Chinese border crossing.",
            reward: "+450 KP",
            isDone: false,
          },
        ],
        available: false,
      },
    ],

    skillChallenge: "Skill Challenge",
    challengeTitle: "Ger Building",
    challengeDesc:
      "A local nomad family needs help setting up their winter camp. Precision is key!",
    accept: "Accept",
    xpReward: "+150 KP",

    stageName: "Orkhon Crossing",
    stageDesc:
      "The cradle of nomadic civilizations. Master the traditional equestrian arts to earn your passage.",
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
