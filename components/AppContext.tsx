"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type Language = "mn" | "en";

interface Translations {
  nav: {
    title: string;
    play: string;
    whatIs: string;
    howItWorks: string;
    games: string;
    features: string;
  };

  hero: {
    title1: string;
    title2: string;
    subtitle: string;
    cta: string;
    free: string;
  };

  whatIs: {
    heading: string;
    intro: string;
    items: { title: string; description: string }[];
  };

  howItWorks: {
    heading: string;
    intro: string;
    steps: { number: string; title: string; description: string }[];
  };

  games: {
    heading: string;
    intro: string;
    items: { name: string; desc: string }[];
    play: string;
    lock: string;
  };

  features: {
    heading: string;
    intro: string;
    items: string[];
  };

  cta: {
    heading1: string;
    heading2: string;
    button: string;
    note: string;
  };

  footer: {
    subtitle: string;
    links: string[];
    copy: string;
  };

  theme: {
    light: string;
    dark: string;
    system: string;
    toggle: string;
  };
}

const mn: Translations = {
  nav: {
    title: "МОНГОЛЫН УЛАМЖЛАЛТ ТОГЛООМ",
    play: "ОДОО ТОГЛОХ",
    whatIs: "Танилцуулга",
    howItWorks: "Хэрхэн тоглох",
    games: "Тоглоомууд",
    features: "Онцлогууд",
  },

  hero: {
    title1: "МОНГОЛЫН",
    title2: "УЛАМЖЛАЛТ ТОГЛООМУУД",
    subtitle:
      "Монголын уламжлалт тоглоом наадгай, нүүдэлчдийн соёл, оюуны өвийг орчин үеийн 3D технологиор амилуулсан дижитал тоглоомын ертөнц.",
    cta: "Тоглож эхлэх",
    free: "Энэхүү платформ нь Монголын өв соёл, тоглоом наадгайг орчин үеийн технологитой хослуулан шинэ үеийн хүүхэд залууст хүргэх зорилготой.",
  },

  whatIs: {
    heading: "ТАНИЛЦУУЛГА",
    intro:
      "Монголын уламжлалт тоглоом наадгай нь нүүдэлчдийн ахуй амьдрал, байгальтайгаа зохицон орших ухаан, оюуны сэтгэлгээ, хүмүүжил ёс суртахууныг илэрхийлсэн соёлын үнэт өв юм. Эрт үеэс монголчууд хүүхэд багачууддаа тоглоомоор дамжуулан авхаалж самбаа, хурц ухаан, нийтлэг зан, тэсвэр хатуужлыг төлөвшүүлж иржээ. Энэхүү платформ нь Монголын уламжлалт тоглоомыг орчин үеийн технологитой хослуулан шинэ үеийн хэрэглэгчдэд сонирхолтой хэлбэрээр хүргэх зорилготой.",

    items: [
      {
        title: "Уламжлалт тоглоомын дижитал сэргэлт",
        description:
          "Монголын эртний тоглоом наадгайг орчин үеийн 3D технологи, интерактив систем ашиглан дахин бүтээж, хэрэглэгчид сонирхолтой хэлбэрээр тоглох боломжийг олгоно.",
      },
      {
        title: "Нүүдэлчдийн соёлын өв",
        description:
          "Монгол тоглоом бүр нь мал аж ахуй, ан гөрөө, ахуй амьдрал, байгальтайгаа зохицон амьдрах ухааныг илэрхийлдэг соёлын өв юм.",
      },
      {
        title: "Оюуны хөгжил",
        description:
          "Шагайн наадгай, оньсон тоглоом зэрэг нь логик сэтгэлгээ, анхаарал төвлөрөл, ой тогтоолт, асуудал шийдвэрлэх чадварыг хөгжүүлдэг.",
      },
      {
        title: "Хүүхэд залуучуудад зориулсан боловсрол",
        description:
          "Тоглоомын явцад хэрэглэгчид Монголын түүх, зан заншил, уламжлалт тоглоомуудын утга учрыг ойлгож суралцах боломжтой.",
      },
      {
        title: "Виртуал аялал",
        description:
          "Тоглогч Монгол орны газрын зураг дээрх өртөөнүүдээр аялж тухайн бүс нутагтай холбоотой тоглоомуудыг нээн тоглоно.",
      },
      {
        title: "Соёлын өвийг хадгалан түгээх",
        description:
          "Энэхүү төсөл нь Монголын уламжлалт тоглоом наадгайг шинэ үеийн хүүхэд залуус болон олон улсын хэрэглэгчдэд танилцуулж соёлын өвийг хадгалан хамгаалахад чиглэнэ.",
      },
    ],
  },

  howItWorks: {
    heading: "ТОГЛООМ ХЭРХЭН ТОГЛОХ ВЭ",
    intro:
      "Тоглогч Монгол орны газрын зураг дээр байрлах уламжлалт өртөөнүүдээр аялж, тухайн бүс нутагт холбогдох тоглоомуудыг тоглон дараагийн өртөөг нээж ахин урагшилна.",
    steps: [
      {
        number: "01",
        title: "Танилцах ба турших",
        description:
          "Тоглогч эхлээд бүртгүүлэхгүйгээр тоглоомын ертөнцтэй танилцаж, энгийн туршилтын тоглоомуудыг тоглож үзэх боломжтой.",
      },
      {
        number: "02",
        title: "Нэвтэрч баатраа сонгох",
        description:
          "Хэрэв та аяллаа үргэлжлүүлж бүх тоглоомуудыг нээж тоглохыг хүсвэл Gmail ашиглан нэвтэрч өөрийн баатрыг сонгоно. Баатар бүр өөрийн өвөрмөц дүр төрхтэй.",
      },
      {
        number: "03",
        title: "Өртөөнүүдээр аялж тоглох",
        description:
          "Монгол орны өртөөнүүдээр аялж уламжлалт тоглоомуудыг тоглон даалгаврыг биелүүлж дараагийн бүс нутаг болон шинэ тоглоомуудыг нээнэ.",
      },
    ],
  },

  games: {
    heading: "УЛАМЖЛАЛТ ТОГЛООМУУД",
    intro:
      "Монголын уламжлалт тоглоомууд нь хүүхэд багачуудын оюун ухаан, авхаалж самбаа, нийтэч зан чанарыг хөгжүүлэх зорилготой байжээ.",
    items: [
      {
        name: "Шагайн наадгай",
        desc: "Хонины шагайгаар тоглодог Монголын хамгийн түгээмэл тоглоом. Нарийвчлал, авхаалж самбаа шаарддаг.",
      },
      {
        name: "Алаг мэлхий өрөх",
        desc: "Шагайгаар мэлхийн дүрс үүсгэн өрж тоглодог уламжлалт тоглоом.",
      },
      {
        name: "Дөрвөн бэрх",
        desc: "Шагай орхиж аз хийморь шинждэг уламжлалт наадгай.",
      },
      {
        name: "Үйчүүр",
        desc: "Монголын эртний хөзрийн төрлийн тоглоом бөгөөд стратеги, багаар тоглох ур чадвар шаарддаг.",
      },
      {
        name: "Хорол",
        desc: "Зэндмэнэ: 60 мод, жин, гэр эсвэл цай — тоглоом дотор бүрэн дүрмийн заавар.",
      },
      {
        name: "Хос ол",
        desc: "Санах ой, логик — 4×4 дээр шагайн талыг хос болгон ол.",
      },
      {
        name: "Тэвэг өшиглөх",
        desc: "Хүүхдүүдийн дунд түгээмэл тоглодог гар хөлний зохицол шаардсан тоглоом.",
      },
      {
        name: "Чулуу таах",
        desc: "Сэтгэхүй, анхаарал төвлөрөл шаардсан энгийн боловч сонирхолтой уламжлалт тоглоом.",
      },
    ],
    play: "Тоглох",
    lock: "Удахгүй",
  },

  features: {
    heading: "ОНЦЛОГУУД",
    intro:
      "Энэхүү платформ нь Монголын уламжлалт соёл болон орчин үеийн тоглоомын технологийг нэгтгэсэн олон онцлог боломжуудтай.",
    items: [
      "Монгол орны 3D интерактив газрын зураг",
      "Монголын уламжлалт тоглоомуудын дижитал хувилбарууд",
      "Өртөө дамжин аялж тоглох адал явдалт систем",
      "Баатар сонгох болон дүрийн хөгжүүлэлтийн систем",
      "Амжилт, шагнал, цуглуулгын систем",
      "Монголын соёлын танин мэдэхүйн мэдээлэл",
      "Тоглоом бүрийн тайлбар болон түүхэн мэдээлэл",
      "Монгол болон Англи хэлний дэмжлэг",
      "Хүүхэд, залуучуудад зориулсан боловсролын бүтэц",
      "Онлайн нэвтрэлт болон хэрэглэгчийн профайл",
      "Шинэ тоглоом болон бүс нутгийг үе шаттайгаар нээх систем",
      "Монгол соёлыг олон улсын хэрэглэгчдэд танилцуулах платформ",
    ],
  },

  cta: {
    heading1: "Монголын өв соёлын ертөнцөд",
    heading2: "Өөрийн аяллаа өнөөдөр эхлүүл",
    button: "Аяллаа эхлүүлэх",
    note: "Энэхүү тоглоом нь боловсрол, соёлын танин мэдэхүйн зорилготой.",
  },

  footer: {
    subtitle: "Монголын уламжлалт тоглоомын дижитал платформ",
    links: ["Төсөл", "Нууцлал", "Холбоо"],
    copy: "© 2026 МУИС — дипломын төсөл",
  },

  theme: {
    light: "Цайвар",
    dark: "Харанхуй",
    system: "Систем",
    toggle: "Theme солих",
  },
};

const en: Translations = {
  nav: {
    title: "MONGOLIAN TRADITIONAL GAMES",
    play: "PLAY NOW",
    whatIs: "About",
    howItWorks: "How It Works",
    games: "Games",
    features: "Features",
  },

  hero: {
    title1: "MONGOLIAN",
    title2: "TRADITIONAL GAMES",
    subtitle:
      "A digital platform that revives Mongolia's traditional games and nomadic cultural heritage through immersive interactive gameplay.",
    cta: "Start Playing",
    free: "This project introduces Mongolian cultural heritage and traditional games using modern technology.",
  },

  whatIs: {
    heading: "OVERVIEW",
    intro:
      "Traditional Mongolian folk games are a valuable cultural heritage that reflects the nomadic lifestyle, harmony with nature, intellectual thinking, and moral values of the Mongolian people. Since ancient times, Mongolians have used games to develop children's agility, intelligence, teamwork, and perseverance. This platform aims to present traditional Mongolian games in a modern digital format by combining them with contemporary technology and interactive gameplay.",

    items: [
      {
        title: "Digital revival of traditional games",
        description:
          "Ancient Mongolian games are recreated using modern 3D technology and interactive systems, allowing users to experience and play them in an engaging digital environment.",
      },
      {
        title: "Nomadic cultural heritage",
        description:
          "Each traditional game reflects aspects of nomadic life such as animal husbandry, hunting traditions, daily lifestyle, and the wisdom of living in harmony with nature.",
      },
      {
        title: "Intellectual development",
        description:
          "Games such as ankle bone games and traditional puzzles help develop logical thinking, concentration, memory, and problem-solving skills.",
      },
      {
        title: "Educational experience for children and youth",
        description:
          "While playing, users can learn about Mongolian history, traditions, and the cultural meanings behind traditional games.",
      },
      {
        title: "Virtual journey",
        description:
          "Players travel across stations located on the map of Mongolia and unlock games associated with different regions.",
      },
      {
        title: "Preserving and promoting cultural heritage",
        description:
          "This project aims to introduce Mongolian traditional games to younger generations and international audiences while helping preserve and promote cultural heritage.",
      },
    ],
  },

  howItWorks: {
    heading: "HOW THE GAME WORKS",
    intro:
      "Players travel through traditional stations located on the map of Mongolia. By playing games associated with each region and completing challenges, they unlock new stations and progress further in their journey.",
    steps: [
      {
        number: "01",
        title: "Explore and try the game",
        description:
          "Players can first explore the game world without registration and try simple demo games to understand how the platform works.",
      },
      {
        number: "02",
        title: "Login and choose your hero",
        description:
          "If you wish to continue your journey and unlock all games, you can sign in using Gmail and choose your hero. Each hero has a unique appearance and identity.",
      },
      {
        number: "03",
        title: "Travel through stations",
        description:
          "Players travel across stations on the map of Mongolia, complete traditional games and challenges, and unlock new regions and additional games.",
      },
    ],
  },

  games: {
    heading: "TRADITIONAL GAMES",
    intro:
      "Traditional Mongolian games were designed to develop intelligence, agility, and teamwork among children.",
    items: [
      {
        name: "Shagai Shooting",
        desc: "One of the most popular Mongolian games played with sheep ankle bones.",
      },
      {
        name: "Alag Melkhii",
        desc: "A traditional board game where ankle bones are arranged in the shape of a turtle.",
      },
      {
        name: "Four Bones",
        desc: "A luck-based ankle bone game used to predict fortune.",
      },
      {
        name: "Uichuur",
        desc: "An ancient Mongolian strategic card game played in teams.",
      },
      {
        name: "Khorol",
        desc: "Zendmene: 60 pieces, trump, gers or tea — full rules inside the game modal.",
      },
      {
        name: "Memory Pairs",
        desc: "Train memory and logic — match pairs of shagai sides on a 4×4 grid before time runs out.",
      },
      {
        name: "Teveg",
        desc: "A traditional shuttle-kick game played mostly by children.",
      },
      {
        name: "Stone Guessing",
        desc: "A simple but engaging guessing game that improves attention and memory.",
      },
    ],
    play: "Play",
    lock: "Coming soon",
  },

  features: {
    heading: "FEATURES",
    intro:
      "This platform combines traditional Mongolian culture with modern gaming technology to provide a unique digital experience.",
    items: [
      "Interactive 3D map of Mongolia",
      "Digital versions of traditional Mongolian games",
      "Adventure-based gameplay through travel stations",
      "Hero selection and character progression system",
      "Achievements, rewards, and collectible system",
      "Cultural knowledge about Mongolian traditions",
      "Historical background and explanations for each game",
      "Support for both Mongolian and English languages",
      "Educational structure designed for children and youth",
      "Online login and player profile system",
      "Progressive unlocking of new regions and games",
      "A platform introducing Mongolian culture to a global audience",
    ],
  },

  cta: {
    heading1: "Begin Your Journey",
    heading2: "Into Mongolian Culture",
    button: "Start Adventure",
    note: "Educational cultural project",
  },

  footer: {
    subtitle: "Digital platform for Mongolian traditional games",
    links: ["Project", "Privacy", "Contact"],
    copy: "© 2026 NUM — student thesis",
  },

  theme: {
    light: "Light",
    dark: "Dark",
    system: "System",
    toggle: "Theme Mode",
  },
};

////////////////////////////////////////////////////

const translations = { mn, en };

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
  heroSelectOpen: boolean;
  setHeroSelectOpen: (v: boolean) => void;
}

const AppContext = createContext<AppContextType>({
  language: "en",
  setLanguage: () => {},
  t: en,
  heroSelectOpen: false,
  setHeroSelectOpen: () => {},
});

export function AppProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");
  const [heroSelectOpen, setHeroSelectOpen] = useState(false);

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        t: translations[language],
        heroSelectOpen,
        setHeroSelectOpen,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
