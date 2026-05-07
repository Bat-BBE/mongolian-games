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
  /** Эрдэнэсийн сан доторх мөрүүд — КП нь «МО», чулуу нь эрдэнэ, зоос тусдаа */
  treasuryKpLabel: string;
  treasuryCoinsLabel: string;
  treasuryGemsLabel: string;
  treasuryHint: string;
  /** Зүүн самбар: эрдэнийн чулуу дээр дарахад нээгдэх солилцоо */
  treasuryGemExchangeTitle: string;
  treasuryGemExchangeBlurb: string;
  treasuryGemExchangeAll: string;
  /** Гэр: мал авахад чулуу хаанаас солихыг заах */
  homeGemExchangePointer: string;
  /** Урамшууллын хувь 100% — авдар нээх */
  rankChestOpen: string;
  rankChestClaim: string;
  rankChestResultGem: string;
  rankChestResultKp: string;
  rankChestResultCoins: string;

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
  /** Sidebar: аяллын өдөр / Journey day */
  journeyDayLabel: string;
  /** Leaderboard avatar row heading */
  topPlayersLabel: string;
  /** "Өртөө" / Station — уртуу дугаарын угтвар */
  urtuuCounter: string;
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

  accountMenuProfile: string;
  /** Account dropdown: replay dashboard spotlight tour */
  accountMenuTour: string;
  accountMenuLogout: string;
  profileEmailLabel: string;
  profileLevelLabel: string;
  profileXpLabel: string;
  profileKpLabel: string;
  profileStationLabel: string;
  profileTierLabel: string;
  profilePageTitle: string;
  profileVisitedStationsTitle: string;
  profileChangeHeroTitle: string;
  profileHeroCooldownLabel: string;
  profileHeroOnCooldown: string;
  profileHeroConfirm: string;
  profileNoSession: string;
  dialogClose: string;
  mapRegionLabel: string;
  /** Map: travel hero to selected urtuu */
  mapTravelToStation: string;
  /** Map: walk hero back to ger (home) */
  mapReturnHome: string;
  /** Map: cancel travel and restore hero to spot before «Очих» */
  mapReturnToPreviousSpot: string;
  /** Map: label above the player’s home ger (distinct from urtuu gers) */
  mapYourGerTitle: string;
  mapYourGerSubtitle: string;
  /** Map: short pin text on the 3D home ger (keep brief) */
  mapHomePinLabel: string;
  /** Sidebar: jump camera to home ger on the 3D map */
  mapGoToGer: string;
  /** Left panel: «Даалгавар» / «Quests» — газрын зургийн зүүн панелийн гарчиг */
  questsPanelTitle: string;
  /** Гэр дээрх даалгаврын хэсгийг хураах (aria) */
  questsPanelCollapseAria: string;
  /** Дахин дэлгэх (aria) */
  questsPanelExpandAria: string;
  /** Left panel: section title when hero is at ger (not «Одоогийн өртөө») */
  sidebarAtHomeSectionTitle: string;
  /** Left panel: status line when at ger */
  sidebarAtHomeBadge: string;
  /** Left panel: short hint when at ger (no Go home button) */
  sidebarAtHomeHint: string;
  /** Map overlay: how-to title (keep short) */
  mapGuideTitle: string;
  mapGuideStep1: string;
  mapGuideStep2: string;
  mapGuideStep3: string;
  mapGuideHide: string;
  /** Map: help button label (short) */
  mapGuideShow: string;
  /** Map: мэдэгдлийн цонхны гарчиг */
  mapNotificationsTitle: string;
  mapNotificationsEmpty: string;
  mapNotificationsClearRead: string;
  mapNotifWelcomeTitle: string;
  mapNotifWelcomeBody: string;
  mapNotifChatTitle: string;
  mapNotifChatBody: string;
  /** Map: world tidbit near small POI markers (not a station) */
  mapWorldPoiBadge: string;
  /** Map: onisogo (riddle) marker — badge / modal overline */
  mapOnisogoBadge: string;
  mapOnisogoOpenCta: string;
  mapOnisogoSolvedChip: string;
  mapOnisogoSolvedToast: string;
  mapOnisogoPickHint: string;
  mapOnisogoWrong: string;
  mapOnisogoClose: string;
  /** `{n}` = coins awarded */
  mapOnisogoCoinsEarned: string;
  /** Map: emote menu — accessibility (icon-only) */
  mapHeroEmoteMenuAria: string;
  mapHeroEmoteIdleAria: string;
  mapHeroEmoteWaveAria: string;
  mapHeroEmoteGreetAria: string;
  mapHeroEmoteKissAria: string;
  mapHeroEmoteDanceAria: string;
  mapHeroEmoteBoxingAria: string;
  mapHeroEmoteBootyAria: string;
  mapHeroEmoteHipHopAria: string;
  mapHeroEmotePrayingAria: string;
  mapHeroEmoteSillyDanceAria: string;
  /** Map: virtual joystick — accessibility (icon-only) */
  mapJoystickMoveAria: string;
  /** Map: portrait mode — short tip to rotate device (mobile / tablet) */
  mapLandscapeHint: string;
  /** Left panel: section title matching map guide */
  mapHowToSectionTitle: string;
  /** Газрын зураг — эхний удаагийн алхам алхмын заавар (5 алхам) */
  mapCoachBadge: string;
  mapCoachBack: string;
  mapCoachNext: string;
  mapCoachFinish: string;
  mapCoachSkipAll: string;
  mapCoachClose: string;
  mapCoachProgressAria: string;
  /** `{n}` одоогийн, `{total}` нийт */
  mapCoachStepCounter: string;
  /** Алхам 1 — хэвтээ утасны зөвлөмж */
  mapCoachLandscapeTip: string;
  mapCoachStepTitles: readonly [string, string, string, string, string];
  mapCoachStepBodies: readonly [string, string, string, string, string];
  /** First-visit spotlight tour (dashboard) */
  introWelcomeTitle: string;
  introWelcomeBody: string;
  introHeroTitle: string;
  introHeroBody: string;
  introStationsTitle: string;
  introStationsBody: string;
  introHomeTitle: string;
  introHomeBody: string;
  introStepMapTitle: string;
  introStepMapBody: string;
  introStepSidebarTitle: string;
  introStepSidebarBody: string;
  introStepNavTitle: string;
  introStepNavBody: string;
  introNext: string;
  introSkip: string;
  introDone: string;
  /** Short label for each of the 7 intro steps (stepper in UI). */
  introStepLabels: [string, string, string, string, string, string, string];
  gamesAtStation: string;
  /** Map popup / sidebar: station lore heading */
  mapStationHistoryTitle: string;
  /** Map popup: short play button */
  mapPlayGameShort: string;
  gameStatusLocked: string;
  gameStatusDone: string;
  /** Map popup: open per-game step guide */
  mapStationHowToOpen: string;
  mapStationHowToHide: string;
  mapStationHowToBack: string;
  /** Station popup: 7 хоногийн лимит — идэвхтэй үед; `{cap}` = тоглоом тоглох дээд хязгаар */
  stationPopupWeeklyActive: string;
  /** Station popup: бүх тоглоомын долоо хоногийн оролт дууссан */
  stationPopupWeeklyExhausted: string;
  /** Popup: түүхийн блокын доорх нэг мөр тайлбар */
  mapStationCultureCaption: string;
  /** Popup: «Юу хийх вэ» алхмуудын гарчиг */
  stationPopupStepsTitle: string;
  stationPopupStepTravel: string;
  stationPopupStepPickGame: string;
  /** Тоглоомын карт дээрх богино шошго */
  stationPopupGameAbout: string;
  /** Товч дээр: тоглоомын 7 хоногийн оролт дууссан — `{cap}`-ийг 2 удаа орлуулна */
  stationPopupPerGameWeekCap: string;
}

export const DASH_STRINGS: Record<DashLang, DashStrings> = {
  mn: {
    title: "МОНГОЛЫН УЛАМЖЛАЛТ ТОГЛООМ",
    knowledgePoints: "Цуглуулсан Оноо",
    dailyTokens: "Өдрийн Токен",
    rank: "Урамшуулал",
    rankTitle: "Хувь",
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
      "Өртөөг сонгоод «Очих» дар. Өртөөний хаалганд ойртоход тоглоомууд нээгдэнэ.",
    continueJourney: "Аяллыг Үргэлжлүүлэх",
    treasury: "Эрдэнэс",
    treasuryKpLabel: "МО (КП)",
    treasuryCoinsLabel: "Зоос",
    treasuryGemsLabel: "Э/чулуу",
    treasuryHint:
      "МО (КП) = тоглоом хожиход нэмэгддэг эрдэнэсийн оноо. Зоос = тоглоом тоглох, ялахад; гэрт зарцуулна. Эрдэнийн чулуу = нэг өртөөний бүх тоглоомыг ялсны урамшуулал (нэг удаа), мөн авдар зэргээр.",
    treasuryGemExchangeTitle: "Чулуу → зоос",
    treasuryGemExchangeBlurb:
      "1 эрдэнийн чулууг зоос болгон солино. Доорх товчоор тоо сонгоно уу.",
    treasuryGemExchangeAll: "Бүгдийг солих",
    homeGemExchangePointer:
      "Чулуугаа зоос болгохыг зүүн самбарын «Э/чулуу» мөр дээр дарж нээнэ үү.",
    rankChestOpen: "Хувь дүүрсэн — авдар нээгээрэй",
    rankChestClaim: "Авдар нээх",
    rankChestResultGem: "Танд 1 эрдэнийн чулуу олдлоо!",
    rankChestResultKp: "Танд +{n} МО олдлоо!",
    rankChestResultCoins: "Танд +{n} зоос олдлоо!",

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
    nextStation: "Дараагийн өртөө",
    locked: "Хаалттай",

    leaderboard: "Жагсаалт",
    activeBonus: "Идэвхтэй Оноо",
    journeyDayLabel: "Аяллын өдөр",
    topPlayersLabel: "Топ тоглогчид",
    urtuuCounter: "Өртөө",
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

    accountMenuProfile: "Профайл",
    accountMenuTour: "Заавар харах",
    accountMenuLogout: "Гарах",
    profileEmailLabel: "И-мэйл",
    profileLevelLabel: "Түвшин",
    profileXpLabel: "Туршлага (XP)",
    profileKpLabel: "Мэдлэгийн оноо",
    profileStationLabel: "Одоогийн өртөө",
    profileTierLabel: "Зэрэглэл",
    profilePageTitle: "Тоглогчийн профайл",
    profileVisitedStationsTitle: "Очсон өртөөнүүд",
    profileChangeHeroTitle: "Баатар солих",
    profileHeroCooldownLabel: "Дараагийн солих хүртэлх хугацаа:",
    profileHeroOnCooldown:
      "24 цаг тутамд нэг удаа баатраа солино. Дуусах хүртэл түр хүлээнэ үү.",
    profileHeroConfirm: "Сонгох",
    profileNoSession:
      "Тоглогчийн мэдээлэл олдсонгүй. Нүүр хуудаснаас «Тоглох» товч дээр дарч нэвтэрнэ үү.",
    dialogClose: "Хаах",
    mapRegionLabel: "Бүс нутаг",
    mapTravelToStation: "Өртөөнд очих",
    mapReturnHome: "Гэрт очих",
    mapReturnToPreviousSpot: "Өмнөх байрлал руу",
    mapYourGerTitle: "Таны гэр",
    mapYourGerSubtitle: "Тоглогчийн байршил · газрын зураг дээрх гэр",
    mapHomePinLabel: "Гэр",
    mapGoToGer: "Гэрт очих",
    questsPanelTitle: "Чиглүүлэгч:",
    questsPanelCollapseAria: "Хураах",
    questsPanelExpandAria: "Нээх",
    sidebarAtHomeSectionTitle: "Таны байршил",
    sidebarAtHomeBadge: "Гэртээ байна",
    sidebarAtHomeHint:
      "Зураг дээр өртөөг сонгоод «Очих» дарах эсвэл өртөө рүү чиглүүлж явж очих боломжтой.",
    mapGuideTitle: "Газрын зураг дээр юу хийх вэ?",
    mapGuideStep1:
      "Өртөөний тэмдэг дээр дарж сонгоно. «Очих» — баатар шууд тийш очно; эсвэл WASD / сум / зүүн доод joystick-оор очоорой.",
    mapGuideStep2:
      "Өртөөнд ойртсон эсвэл сонгосон үед доор цонх гарна. Тоглоомын «Тоглох» дарж эхэлнэ.",
    mapGuideStep3:
      "КП, зоос, аялал — зүүн самбар. Гэр, мал — газрын зураг дээрх гэр эсвэл «Миний гэр».",
    mapGuideHide: "Хаах",
    mapGuideShow: "Заавар",
    mapNotificationsTitle: "Мэдэгдэл",
    mapNotificationsEmpty: "Одоогоор шинэ зүйл алга.",
    mapNotificationsClearRead: "Бүгдийг уншсан",
    mapNotifWelcomeTitle: "Газрын зурагт тавтай морил",
    mapNotifWelcomeBody:
      "Өртөө сонгоод очоорой — ойртсоноор тоглоом нээгдэнэ. КП, зоос — профайл цонхоос.",
    mapNotifChatTitle: "Нэгдсэн чат",
    mapNotifChatBody:
      "Баруун доод чатын товчоор бусад тоглогчидтой мессеж солилцоно. Joystick-ийн дээр байрлана.",
    mapWorldPoiBadge: "Газрын сонин",
    mapOnisogoBadge: "Оньсого",
    mapOnisogoOpenCta: "Нээх",
    mapOnisogoSolvedChip: "Таасан",
    mapOnisogoSolvedToast: "Та энэ оньсогыг аль хэдийн таасан байна.",
    mapOnisogoPickHint: "Дөрвөн хариултаас зөвийг сонгоно уу.",
    mapOnisogoWrong: "Буруу байна — дахин сонгоно уу.",
    mapOnisogoClose: "Хаах",
    mapOnisogoCoinsEarned: "+{n} зоос оллоо!",
    mapHeroEmoteMenuAria: "Баатарын дохио сонгох",
    mapHeroEmoteIdleAria: "Зогсолт",
    mapHeroEmoteWaveAria: "Дохих",
    mapHeroEmoteGreetAria: "Мэндчилгээ",
    mapHeroEmoteKissAria: "Үнсэлт",
    mapHeroEmoteDanceAria: "Бүжиг",
    mapHeroEmoteBoxingAria: "Бокс",
    mapHeroEmoteBootyAria: "Booty бүжиг",
    mapHeroEmoteHipHopAria: "Hip hop бүжиг",
    mapHeroEmotePrayingAria: "Залбирал",
    mapHeroEmoteSillyDanceAria: "Инээдтэй бүжиг",
    mapJoystickMoveAria: "Баатарыг газрын зураг дээр явуулах",
    mapLandscapeHint: "Утсаа хэвтээ болгоно уу.",
    mapHowToSectionTitle: "Хэрхэн тоглох вэ?",
    mapCoachBadge: "Анхны заавар",
    mapCoachBack: "Өмнөх",
    mapCoachNext: "Дараах",
    mapCoachFinish: "Дуусгах",
    mapCoachSkipAll: "Алгасах",
    mapCoachClose: "Хаах",
    mapCoachProgressAria: "Зааврын алхмууд",
    mapCoachStepCounter: "Алхам {n} / {total}",
    mapCoachLandscapeTip:
      "Зөвлөмж: Утасаа хэвтээ болгож тогловол газар илүү том харагдаж, доод joystick ашиглахад амар.",
    mapCoachStepTitles: [
      "1. Баатараа хөдөлгөх",
      "2. Өртөө сонгох",
      "3. Тоглоом эхлүүлэх",
      "4. Дээд мөр ба гэр",
      "5. Жижиг овоонууд (оньсого)",
    ],
    mapCoachStepBodies: [
      "Утас, таб: доод баруун талын дугуйг чирж баатрыг явуулна. Ирмэгт ойртуулбал хурдан явна. Компьютер: WASD эсвэл сум, Shift = гүйх.",
      "Газар дээрх өртөөний нэр/тэмдэг дээр дар. Зүүн доод «Чиглүүлэгч» хэсэгт мэдээлэл гарна. «Очих» дарвал баатар шууд тэр өртөө рүү очно.",
      "Өртөөнд ойртоход доор нээгдсэн цонхноос тоглоомоо сонгоод «Тоглох» дар. Ойртсон ч сонгосон ч тоглоом нээгдэнэ.",
      "Дээд мөрөнд: хэл солих (MN/EN), зоос ба эрдэнэс, профайл. Газрын зураг дээрх «Гэр» тэмдэг дээр очоод нээнэ.",
      "Ногоон жижиг овоо — «газрын тайлбар» (товч мэдээлэл). Хөх ягаан өнгийн овоо — оньсого: ойртоход «Нээх» дарж асуултанд хариулж зоос авна.",
    ],
    introWelcomeTitle: "Эхний заавар — 7 алхам",
    introWelcomeBody:
      "Та одоо Үндсэн хуудас тоглоомын хэсэгт байна.\n\n【3 гол хэсэг】\n▸ ЗҮҮН — аялал, даалгавар, эрдэнэс (КП, зоос, эрдэнийн чулуу)\n▸ ТӨВ/БАРУУН — 3D газрын зураг; энд баатраа удирдана\n▸ HOME — гэр/малаа нээж сайжруулах хэсэг\n\n【Яаж үргэлжлүүлэх вэ】\n• «Дараагийн» — дараагийн алхам руу орно\n• «Алгасах · Шууд эхлэх» — зааврыг хаагаад шууд тоглож эхэлнэ",
    introHeroTitle: "Алхам 2. Баатараа хаана, хэрхэн хөдөлгөх вэ",
    introHeroBody:
      "【Хаана】 Дэлгэцийн төв, улаан зам дээр 3D баатар. Зүүн талд 2D самбар байна.\n\n【Хэрхэн】\n• Утас/таб — зүүн доод дугуй (joystick)-г чирж явуулна; ирмэг рүү түлхвэл хурдан явна\n• Компьютер — WASD эсвэл сум; Shift дарвал гүйнэ\n\n【Шууд очих】 Зүүн самбараас «Очих» дарах эсвэл өртөө сонгох — баатар шууд тийш очно.\n\nОдоо турш: joystick/WASD-аар 2-3 алхам хийж үз.\n\nДараагийн алхам: өртөө, тоглоом нээх.",
    introStationsTitle: "Алхам 3. Өртөө сонгож, тоглоом нээх",
    introStationsBody:
      "【Хаана】 3D газрын зураг дээр өөр өөр түүхэн өртөө (тэмдэгтэй).\n\n【Юу хийх】 Өртөө ойртуулж эсвэл нэрийг дар — тоглоомын жагсаалт гарна. Сонгоод нэвтрэх/тоглох.\n\n【Дүрэм】 Нэг тоглоомыг 7 хоногт хамгийн ихдээ 3 удаа. Эхэнд өөрийн эхний өртөөгөөс эхлүүлэх нь зөв.",
    introHomeTitle: "Алхам 4. Гэр, мал, оноо — хаанаас удирдах вэ",
    introHomeBody:
      "【Гэр цонх】 Газрын зураг дээр home/нутаг өртөө руу очих (баатар home дээр) — гэр, малыг цонхоор нээж сайжруулна. Заримд «Миний гэр» товч байна.\n\n【Оноо】 Тоглоом ялалт → КП, зоос (зүүн — Эрдэнэс). Өртөө бүтэн → эрдэнийн чулуу (нэг удаа). Чулууг зоос болгох — зүүн «Э/чулуу».\n\n【Баатар, профайл】 Дээд баруун аватар/нэр дар — профайл, баатар солих.",
    introStepMapTitle: "Алхам 5. 3D газрын зураг (одоо тодорхойлсон)",
    introStepMapBody:
      "Цэнхэр хүрээ — энэ л 3D нутаг. Баатар, өртөө, гэр (home), тусламж (?), утсан дээр дугуй/камер. Утас босоо бол хэвтээ болгоод үз — илүү тод.",
    introStepSidebarTitle: "Алхам 6. Зүүн самбар (аялал, эрдэнэс)",
    introStepSidebarBody:
      "Зүүн тал (утас: доод товчоор): одоогийн өртөө, даалгавар, КП/зоос/чулуу, авдар, чулуу→зоос солилцоо. Өртөө, тоглоомын гол мэдээлэл энд.",
    introStepNavTitle: "Алхам 7. Дээд мөр (хэл, профайл)",
    introStepNavBody:
      "Цэнхэр хүрээ — онооны жагсаалт, профайл (баатар/нэр), МН/EN, өнгө. Заавар дахин: профайлын цэс эсвэл тусламж.\n«Ойлголоо» дар — заавар хаагдана. Амжилт! 🌿",
    introNext: "Дараагийн",
    introSkip: "Алгасах · Шууд эхлэх",
    introDone: "Ойлголоо",
    introStepLabels: [
      "Танилцах · бүтэц",
      "Баатар · хөдөлгөөн",
      "Өртөө · тоглоом",
      "Гэр · оноо",
      "3D газар",
      "Зүүн самбар",
      "Дээд меню",
    ],
    gamesAtStation: "Тоглоомууд",
    mapStationHistoryTitle: "Өртөөний түүх",
    mapPlayGameShort: "Тоглох",
    gameStatusLocked: "Хүлээгдэж буй",
    gameStatusDone: "Дууссан",
    mapStationHowToOpen: "Алхам заавар",
    mapStationHowToHide: "Хураах",
    mapStationHowToBack: "Өмнөх",
    stationPopupWeeklyActive:
      "Тоглоом бүр энэ өртөөнд 7 хоногт хамгийн ихдээ {cap} удаа тоголно.",
    stationPopupWeeklyExhausted:
      "Энэ өртөөний бүх тоглоомын 7 хоногийн оролт дууссан. Хэсэг хугацааны дараа дахин нээгдэнэ.",
    mapStationCultureCaption:
      "Энэ нутаг, түүхийн товч — доорх мэдээллийг уншиад тоглоом руу орно уу.",
    stationPopupStepsTitle: "Энд яаж үргэлжлүүлэх вэ",
    stationPopupStepTravel:
      "Эхлээд «Очих» (эсвэл өөрөө очоод) энэ өртөөнд ирнэ.",
    stationPopupStepPickGame:
      "Дараа нь доорх тоглоомын «Тоглох» дарна — шинэ цонхонд нээгдэнэ.",
    stationPopupGameAbout: "Товч танилцуулга",
    stationPopupPerGameWeekCap: "{cap}/{cap} · 7 хоног",
  },

  en: {
    title: "MONGOLIAN TRADITIONAL GAMES",
    knowledgePoints: "Knowledge Points",
    dailyTokens: "Daily Tokens",
    rank: "Reward",
    rankTitle: "Rank",
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
      "Pick a station, tap Go there, then walk to the door to open games.",
    continueJourney: "Continue Journey",
    treasury: "Treasury",
    treasuryKpLabel: "KP",
    treasuryCoinsLabel: "Coins",
    treasuryGemsLabel: "Gems",
    treasuryHint:
      "KP = merit points earned when you win games. Coins = from playing (and wins); spend at home/shop. Gems = one-time bonus when you win every game at a station, plus chests, etc.",
    treasuryGemExchangeTitle: "Gems → coins",
    treasuryGemExchangeBlurb: "Trade gems for coins. Pick an amount below.",
    treasuryGemExchangeAll: "Exchange all",
    homeGemExchangePointer:
      "To convert gems to coins, tap the Gems row in the left treasury panel.",
    rankChestOpen: "Reward bar full — open your chest",
    rankChestClaim: "Open chest",
    rankChestResultGem: "You received 1 gem!",
    rankChestResultKp: "You received +{n} KP!",
    rankChestResultCoins: "You received +{n} coins!",

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
    journeyDayLabel: "Journey day",
    topPlayersLabel: "Top Players",
    urtuuCounter: "Station",
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

    accountMenuProfile: "Profile",
    accountMenuTour: "Show tour",
    accountMenuLogout: "Sign out",
    profileEmailLabel: "Email",
    profileLevelLabel: "Level",
    profileXpLabel: "Experience (XP)",
    profileKpLabel: "Knowledge points",
    profileStationLabel: "Current station",
    profileTierLabel: "Tier",
    profilePageTitle: "Player profile",
    profileVisitedStationsTitle: "Stations visited",
    profileChangeHeroTitle: "Change hero",
    profileHeroCooldownLabel: "Next change in",
    profileHeroOnCooldown:
      "You can change your hero once every 24 hours. Please wait until the timer ends.",
    profileHeroConfirm: "Save this hero",
    profileNoSession:
      "No player session found. Use Play on the home page to sign in.",
    dialogClose: "Close",
    mapRegionLabel: "Region",
    mapTravelToStation: "Go there",
    mapReturnHome: "Return to ger",
    mapReturnToPreviousSpot: "Back to previous spot",
    mapYourGerTitle: "Your ger",
    mapYourGerSubtitle: "Your home base on the journey map",
    mapHomePinLabel: "Home",
    mapGoToGer: "Home",
    questsPanelTitle: "Guide:",
    questsPanelCollapseAria: "Collapse quests panel",
    questsPanelExpandAria: "Expand quests panel",
    sidebarAtHomeSectionTitle: "Your base",
    sidebarAtHomeBadge: "At your ger",
    sidebarAtHomeHint:
      "Choose a station on the map, tap Go there, and move near the door to open games.",
    mapGuideTitle: "What to do on the map",
    mapGuideStep1:
      "Tap a station marker to select it. «Go there» moves your hero instantly—or walk with WASD / arrows / the joystick.",
    mapGuideStep2:
      "When you’re close (or after selecting), a panel opens below. Tap «Play» on a game to start it in a new window.",
    mapGuideStep3:
      "KP, coins, journey: left sidebar. Home & livestock: your ger on the map or «My home».",
    mapGuideHide: "Close",
    mapGuideShow: "Help",
    mapNotificationsTitle: "Notifications",
    mapNotificationsEmpty: "You’re all caught up.",
    mapNotificationsClearRead: "Mark all read",
    mapNotifWelcomeTitle: "Welcome to the map",
    mapNotifWelcomeBody:
      "Pick a station and go there — games open when you’re close. KP and coins are in your profile.",
    mapNotifChatTitle: "Map chat",
    mapNotifChatBody:
      "Use the chat bubble above the joystick to message other players on this map.",
    mapWorldPoiBadge: "Along the way",
    mapOnisogoBadge: "Riddle",
    mapOnisogoOpenCta: "Open",
    mapOnisogoSolvedChip: "Solved",
    mapOnisogoSolvedToast: "You already solved this riddle.",
    mapOnisogoPickHint: "Pick the correct answer from the four choices.",
    mapOnisogoWrong: "Not quite — try another answer.",
    mapOnisogoClose: "Close",
    mapOnisogoCoinsEarned: "+{n} coins earned!",
    mapHeroEmoteMenuAria: "Choose hero gesture",
    mapHeroEmoteIdleAria: "Idle stance",
    mapHeroEmoteWaveAria: "Wave",
    mapHeroEmoteGreetAria: "Greet",
    mapHeroEmoteKissAria: "Blow a kiss",
    mapHeroEmoteDanceAria: "Dance",
    mapHeroEmoteBoxingAria: "Boxing",
    mapHeroEmoteBootyAria: "Booty dance",
    mapHeroEmoteHipHopAria: "Hip hop dance",
    mapHeroEmotePrayingAria: "Praying",
    mapHeroEmoteSillyDanceAria: "Silly dance",
    mapJoystickMoveAria: "Move hero on the map",
    mapLandscapeHint:
      "For a more comfortable map, rotate your phone to landscape.",
    mapHowToSectionTitle: "How to play",
    mapCoachBadge: "Quick start",
    mapCoachBack: "Back",
    mapCoachNext: "Next",
    mapCoachFinish: "Done",
    mapCoachSkipAll: "Skip",
    mapCoachClose: "Close",
    mapCoachProgressAria: "Tutorial steps",
    mapCoachStepCounter: "Step {n} of {total}",
    mapCoachLandscapeTip:
      "Tip: landscape mode gives a wider view and makes the lower-right joystick easier to use.",
    mapCoachStepTitles: [
      "1. Move your hero",
      "2. Pick a station",
      "3. Start a game",
      "4. Top bar & home",
      "5. Small markers (facts & riddles)",
    ],
    mapCoachStepBodies: [
      "Phone/tablet: drag the lower-right joystick. Nudge toward the edge to move faster. Desktop: WASD or arrow keys; hold Shift to sprint.",
      "Tap a station marker or its label on the map. The guide panel below-left shows details. Tap «Go there» to jump your hero to that station.",
      "When you’re close (or after selecting a station), a panel opens. Choose a game and tap «Play».",
      "Use the top bar to switch language, see coins and rewards, and open your profile. Visit the «Home» marker on the map to open your ger.",
      "Green-ring cairns share short map facts. Purple cairns are riddles: get close, tap «Open», pick the right answer to earn coins.",
    ],
    introWelcomeTitle: "Onboarding — 7 steps",
    introWelcomeBody:
      "You are on the home dashboard.\n\n【3 main areas】\n▸ LEFT — journey, tasks, rewards (KP, coins, gems)\n▸ CENTER/RIGHT — 3D map; move your hero here\n▸ HOME — ger/livestock upgrade area\n\n【How to continue】\n• “Next” — go to the next step\n• “Skip · Start now” — close this tour and play immediately",
    introHeroTitle: "Step 2. Where the hero is, how to move",
    introHeroBody:
      "【Where】 The 3D hero is on the red path in the middle; a 2D panel is on the left.\n\n【How】\n• Phone/tablet: lower-left joystick — drag to move; push toward edge to move faster\n• Desktop: WASD or arrows; hold Shift to sprint\n\n【Quick travel】 Left panel — tap “Go” or pick a station; hero teleports there.\n\nTry now: move 2-3 steps with joystick/WASD.\n\nNext: open a station and game.",
    introStationsTitle: "Step 3. Choose a stop, open a game",
    introStationsBody:
      "【Where】 Historic stops (markers) on the 3D map.\n\n【What to do】 Walk up or tap the name — a game list opens. Choose and start.\n\n【Rule】 At most 3 plays per game every 7 days. Good to start at your first stop.",
    introHomeTitle: "Step 4. Ger, animals, points — where to manage",
    introHomeBody:
      "【Home panel】 Walk to the home / homeland stop (hero on home) to open — upgrade ger and animals. Some UIs have a “My home” button.\n\n【Points】 Wins → KP and coins (left — Treasury). All games at a stop once → bonus gem (one-time). Turn gems to coins — left “E/gem” (or equivalent).\n\n【Avatar / profile】 Top-right name or picture — profile and hero look.",
    introStepMapTitle: "Step 5. 3D map (highlighted)",
    introStepMapBody:
      "The blue frame is this 3D world. Hero, stops, home (?), and on phones a ring / camera. Rotate to landscape for a better view.",
    introStepSidebarTitle: "Step 6. Left sidebar (journey, treasury)",
    introStepSidebarBody:
      "Left (on phones, often a bottom control): current stop, tasks, KP/coins/gems, rewards, gem→coin. Core info about the stop and games lives here.",
    introStepNavTitle: "Step 7. Top bar (language, profile)",
    introStepNavBody:
      "Blue frame: leaderboard, profile (name/hero), MN/EN, theme. To replay the tour: profile menu or help.\nTap “Got it” to close. Enjoy! 🌿",
    introNext: "Next",
    introSkip: "Skip · Start now",
    introDone: "Got it",
    introStepLabels: [
      "Overview · layout",
      "Hero · movement",
      "Stop · game",
      "Home · points",
      "3D map",
      "Left bar",
      "Top menu",
    ],
    gamesAtStation: "Games",
    mapStationHistoryTitle: "Station history",
    mapPlayGameShort: "Play",
    gameStatusLocked: "Locked",
    gameStatusDone: "Completed",
    mapStationHowToOpen: "Step guide",
    mapStationHowToHide: "Hide",
    mapStationHowToBack: "Back",
    stationPopupWeeklyActive:
      "Each game at this station can be played up to {cap} times per rolling 7-day window.",
    stationPopupWeeklyExhausted:
      "Weekly plays for all games at this station are used up. They unlock again after the window rolls.",
    mapStationCultureCaption:
      "About this place — a short note from the steppe relay. Read it, then pick a game.",
    stationPopupStepsTitle: "What to do here",
    stationPopupStepTravel:
      "First use «Go there» (or walk) until you reach this station.",
    stationPopupStepPickGame:
      "Then tap «Play» under a game—it opens in the game modal.",
    stationPopupGameAbout: "About",
    stationPopupPerGameWeekCap: "{cap}/{cap} · 7-day cap",
  },
};

/** API `ui_strings.key` → DashStrings field (left sidebar + rank labels). */
const SIDEBAR_STRING_KEYS: Record<string, keyof DashStrings> = {
  "sidebar.currentExpedition": "currentExpedition",
  "sidebar.mainQuest": "mainQuest",
  "sidebar.questTitle": "questTitle",
  "sidebar.questDesc": "questDesc",
  "sidebar.continueJourney": "continueJourney",
  "sidebar.treasury": "treasury",
  "sidebar.rank": "rank",
  "sidebar.rankTitle": "rankTitle",
  "sidebar.leaderboard": "leaderboard",
  "sidebar.activeBonus": "activeBonus",
  "sidebar.journeyDayLabel": "journeyDayLabel",
  "sidebar.topPlayersLabel": "topPlayersLabel",
  "sidebar.urtuuCounter": "urtuuCounter",
};

export function mergeDashboardSidebar(
  base: DashStrings,
  apiStrings: Record<string, string>,
  computed?: Partial<Pick<DashStrings, "questTitle" | "questDesc">>,
): DashStrings {
  const next: DashStrings = { ...base };
  const mut = next as unknown as Record<string, string>;
  for (const [apiKey, field] of Object.entries(SIDEBAR_STRING_KEYS)) {
    const v = apiStrings[apiKey];
    if (typeof v === "string" && v.length > 0) {
      mut[field] = v;
    }
  }
  if (computed?.questTitle) next.questTitle = computed.questTitle;
  if (computed?.questDesc) next.questDesc = computed.questDesc;
  return next;
}
