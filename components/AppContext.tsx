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
    features: "Онцлогууд",
    games: "Тоглоомууд",
  },

  hero: {
    title1: "МОНГОЛЫН",
    title2: "УЛАМЖЛАЛТ ТОГЛООМУУД",
    subtitle:
      "Монголын уламжлалт тоглоом, соёлын өв, нүүдэлчдийн ахуйг орчин үеийн 3D технологи ашиглан танилцуулах дижитал тоглоомын платформ.",
    cta: "Тоглох",
    free:
      "Энэхүү платформ нь Монголын өв соёл, уламжлалт тоглоом наадгайг орчин үеийн технологитой хослуулан түгээн дэлгэрүүлэх зорилготой.",
  },

  whatIs: {
    heading: "ТАНИЛЦУУЛГА",
    intro:
      "Монголын уламжлалт тоглоомууд нь нүүдэлчдийн амьдрал, ахуй соёл, ухаан сэтгэлгээг илэрхийлдэг өвөрмөц соёлын өв юм. Энэхүү төсөл нь тэдгээр тоглоомыг орчин үеийн дижитал хэлбэрт шилжүүлж, хүүхэд залуус болон олон улсын хэрэглэгчдэд сонирхолтой байдлаар хүргэх зорилготой.",
    items: [
      {
        title: "Уламжлалт тоглоомуудын дижитал хувилбар",
        description:
          "Монголын эртний наадгай, тоглоомуудыг орчин үеийн 3D технологи ашиглан дахин бүтээж, хэрэглэгчид интерактив байдлаар тоглох боломжийг олгоно.",
      },
      {
        title: "Монгол орноор виртуал аялал",
        description:
          "Тоглогчид Монголын түүхэн өртөөнүүд болон байгалийн үзэсгэлэнт газруудаар аялж, тухайн бүс нутагтай холбоотой тоглоомуудыг нээж тоглоно.",
      },
      {
        title: "Соёлын өвийг хадгалан түгээх",
        description:
          "Уламжлалт тоглоом, домог, зан заншлыг орчин үеийн залуу үед сонирхолтой байдлаар хүргэж, соёлын өвийг хадгалан хамгаалах зорилготой.",
      },
    ],
  },

  howItWorks: {
    heading: "ТОГЛООМ ХЭРХЭН ТОГЛОХ ВЭ?",
    intro:
      "Тоглогчид өөрийн баатрыг сонгож Монгол орны газрын зураг дээрх өртөөнүүдээр аялж, төрөл бүрийн уламжлалт тоглоомуудыг тоглон шинэ бүс нутгийг нээнэ.",
    steps: [
      {
        number: "01",
        title: "Баатраа сонго",
        description:
          "Тоглогч өөрийн хүссэн дүрийг сонгож тоглоомын аяллаа эхлүүлнэ. Дүр бүр өөрийн өвөрмөц хэв маягтай.",
      },
      {
        number: "02",
        title: "Өртөөнүүдийг судал",
        description:
          "Монгол орны газрын зураг дээр байрлах түүхэн өртөөнүүдийг нээн судалж тухайн бүс нутгийн тоглоомуудыг тоглоно.",
      },
      {
        number: "03",
        title: "Тоглож амжилт цуглуул",
        description:
          "Тоглоомуудыг амжилттай давж оноо, шагнал, дурсгалт олдвор цуглуулж шинэ боломжуудыг нээнэ.",
      },
    ],
  },

  games: {
    heading: "УЛАМЖЛАЛТ ТОГЛООМУУД",
    intro:
      "Монголын ардын уламжлалт тоглоомууд нь нүүдэлчдийн амьдрал, ахуй соёл, оюун ухаан, авхаалж самбааг хөгжүүлэх зорилготой байжээ. Эдгээр тоглоомууд нь хүүхэд залуусын анхаарал төвлөрөл, логик сэтгэлгээ, гар-нүдний зохицлыг сайжруулдаг.",
    items: [
      {
        name: "Шагайн наадгай",
        desc: "Монгол хүүхдүүдийн хамгийн өргөн тархсан тоглоом. Шагай харваж онох, цуглуулах зэрэг төрөлтэй бөгөөд нарийвчлал, стратеги, авхаалж самбааг хөгжүүлдэг.",
      },
      {
        name: "Сурын харваа",
        desc: "Монголын үндэсний спортын нэг. Нум сум ашиглан бай онох бөгөөд төвлөрөл, нарийвчлал, дотоод тэнцвэрийг шаарддаг.",
      },
      {
        name: "Морин уралдаан",
        desc: "Монголын наадмын гол спортын нэг. Хурд, тэсвэр, замын мэдрэмж, шийдвэр гаргах чадварыг сорьдог.",
      },
      // {
      //   name: "Монгол шатар",
      //   desc: "Стратеги, төлөвлөлт, логик сэтгэлгээг хөгжүүлдэг уламжлалт оюуны тоглоом.",
      // },
      {
        name: "Дөрвөн бэрх",
        desc: "Шагай ашиглан тоглодог аз болон авхаалжийг хослуулсан уламжлалт наадгай.",
      },
      // {
      //   name: "Тэвэг өшиглөх",
      //   desc: "Хүүхдүүдийн дунд түгээмэл тоглодог тоглоом бөгөөд гар-нүдний зохицол, хурд, анхаарал төвлөрлийг хөгжүүлдэг.",
      // },
      // {
      //   name: "Алтан шагай",
      //   desc: "Шагай ашиглан оноо цуглуулах сонирхолтой тоглоом. Аз болон ур чадвар хоёрыг зэрэг сорьдог.",
      // },
      // {
      //   name: "Наадмын их баяр",
      //   desc: "Монголын үндэсний баяр наадмын уур амьсгалд суурилсан олон төрлийн соёлын мини тоглоомууд.",
      // },
    ],
  },

  features: {
    heading: "ОНЦЛОГУУД",
    intro:
      "Энэхүү тоглоомын платформ нь Монголын уламжлалт соёл болон орчин үеийн технологийг хослуулсан онцлог шийдлүүдтэй.",
    items: [
      "3D интерактив газрын зураг",
      "Монголын уламжлалт тоглоомуудын дижитал хувилбар",
      "Соёлын мэдээлэл болон түүхэн танин мэдэхүй",
      "Амжилт, шагнал цуглуулах систем",
      "Суралцах болон хөгжих боломж",
      "Олон улсын хэрэглэгчдэд зориулсан англи хэлний дэмжлэг",
    ],
  },

  cta: {
    heading1: "Монголын өв соёлын ертөнцөд",
    heading2: "Өөрийн аяллаа өнөөдөр эхлүүлээрэй",
    button: "Аяллаа эхлүүлэх",
    note:
      "Энэхүү тоглоом нь боловсролын болон соёлын танин мэдэхүйн зорилготой.",
  },

  footer: {
    subtitle: "Монголын уламжлалт тоглоомын платформ",
    links: ["Төсөл", "Нууцлал", "Холбоо"],
    copy: "© 2026 МУИС — дипломын ажил",
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
      "An interactive digital platform that introduces Mongolia's traditional games, culture, and nomadic heritage through immersive 3D experiences.",
    cta: "Playing",
    free:
      "Inspired by authentic Mongolian traditions and cultural heritage.",
  },

  whatIs: {
    heading: "OVERVIEW",
    intro:
      "Traditional Mongolian games reflect the wisdom, lifestyle, and cultural values of nomadic civilization. This project aims to transform these traditional games into engaging digital experiences for modern audiences.",
    items: [
      {
        title: "Digital Versions of Traditional Games",
        description:
          "Classic Mongolian folk games recreated using modern 3D technologies for interactive gameplay.",
      },
      {
        title: "Virtual Journey Across Mongolia",
        description:
          "Players travel across Mongolia through historic relay stations while discovering cultural games along the way.",
      },
      {
        title: "Preserving Cultural Heritage",
        description:
          "The platform helps preserve and promote traditional Mongolian culture to younger generations and international audiences.",
      },
    ],
  },

  howItWorks: {
    heading: "HOW TO PLAY",
    intro:
      "Choose your character, explore different regions of Mongolia, and unlock traditional games as you travel across the map.",
    steps: [
      {
        number: "01",
        title: "Choose Your Hero",
        description:
          "Select your character and begin your journey through the world of Mongolian traditional games.",
      },
      {
        number: "02",
        title: "Explore the Map",
        description:
          "Travel through historical relay stations and discover unique cultural games in each region.",
      },
      {
        number: "03",
        title: "Play and Achieve",
        description:
          "Complete challenges, collect achievements, and unlock new areas and rewards.",
      },
    ],
  },

  games: {
    heading: "TRADITIONAL GAMES",
    intro:
      "Traditional Mongolian games reflect the lifestyle, creativity, and wisdom of the nomadic culture. These games help develop concentration, strategic thinking, coordination, and patience.",

    items: [
      {
        name: "Shagai Game",
        desc: "One of the most popular traditional Mongolian games played with sheep ankle bones. It develops precision, strategy, and quick reflexes.",
      },
      {
        name: "Archery",
        desc: "A traditional Mongolian sport where players use bows to hit targets. It requires high levels of focus, precision, and balance.",
      },
      {
        name: "Horse Racing",
        desc: "A symbolic sport of Mongolian culture. It tests endurance, speed, and decision-making skills.",
      },
      // {
      //   name: "Mongolian Chess",
      //   desc: "A traditional strategy board game that develops logical thinking, planning, and tactical skills.",
      // },
      {
        name: "Four Bones Game",
        desc: "A traditional ankle bone game that combines both luck and skill, played widely in Mongolian culture.",
      },
      // {
      //   name: "Tevég (Kick Shuttle)",
      //   desc: "A traditional game where players keep a small object in the air using their feet. It improves coordination, balance, and agility.",
      // },
      // {
      //   name: "Golden Shagai",
      //   desc: "A competitive ankle bone game where players collect points by accurately striking the target bones.",
      // },
      // {
      //   name: "Naadam Festival Games",
      //   desc: "Mini-games inspired by Mongolia's famous Naadam festival, celebrating traditional sports and cultural activities.",
      // },
    ],
  },

  features: {
    heading: "FEATURES",
    intro:
      "The platform combines traditional culture with modern technology to create a unique gaming experience.",
    items: [
      "Interactive 3D world map",
      "Digital versions of traditional Mongolian games",
      "Cultural knowledge and storytelling",
      "Achievement and reward system",
      "Educational and entertaining gameplay",
      "Bilingual support (Mongolian & English)",
    ],
  },

  cta: {
    heading1: "Begin Your Journey",
    heading2: "Into Mongolian Culture Today",
    button: "Start Your Adventure",
    note:
      "This project is developed as an educational and cultural platform.",
  },

  footer: {
    subtitle: "Digital platform for traditional Mongolian games",
    links: ["Project", "Privacy", "Contact"],
    copy: "© 2026 NUM — student thesis project",
  },

  theme: {
    light: "Light",
    dark: "Dark",
    system: "System",
    toggle: "Theme Mode",
  },
};

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