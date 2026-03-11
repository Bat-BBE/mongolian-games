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
    steps: { number: string; title: string; description: string }[];
  };
  games: {
    heading: string;
    items: { name: string; desc: string }[];
  };
  features: {
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
    title: "МОНГОЛЫН УЛАМЖЛАЛТ ТОГЛООМУУД",
    play: "ОДОО ТОГЛОХ",
    whatIs: "Танилцуулга",
    howItWorks: "Ажиллах заавар",
    games: "Тоглоомууд",
    features: "Онцлогууд",
  },
  hero: {
    title1: "МОНГОЛЫН",
    title2: "УЛАМЖЛАЛТ ТОГЛООМУУД",
    subtitle:
      "Монголын уламжлалт тоглоом, зан үйл, домгийг 3D орчинд амилуулсан интерактив дижитал талбар.",
    cta: "Тоглоомоо эхлүүлэх",
    free: "Бүх тоглоом нь монголын жинхэнэ уламжлал, өв соёлоос сэдэвлэсэн.",
  },
  whatIs: {
    heading: "ТӨСЛИЙН ТАНИЛЦУУЛГА",
    intro:
      "Монголын уламжлалт тоглоом, өв соёл, домгийг орчин үеийн тоглоомын хэлээр нэг дор багтаасан дижитал ертөнц.",
    items: [
      {
        title: "Уламжлалт тоглоомуудыг орчин үеийн хэлээр",
        description:
          "Тал нутгийн ахуй, билэг ухааныг шингээсэн, физикийн хөдөлгөөн дээр суурилсан 3D тоглоомууд.",
      },
      {
        title: "Өртөө дамжин аялах систем",
        description:
          "Монголын эртний өртөө, зам мөрийг даган Монгол орныг виртуал орчинд тойрон аялна.",
      },
      {
        title: "Соёлын онцгой шагналууд",
        description:
          "Дижитал олдвор, медаль, тэмдэг цуглуулж, өөрийн баатарлаг замналыг бүтээ.",
      },
    ],
  },
  howItWorks: {
  heading: "Тоглоом хэрхэн өрнөдөг вэ?",
    steps: [
      {
        number: "01",
        title: "Өөрийн баатрыг сонго",
        description:
          "Тоглох хэв маягтаа тохирсон дүр, түүний зан чанар, тусгай чадваруудыг сонго.",
      },
      {
        number: "02",
        title: "Өртөөнүүдээр аялан нээгд",
        description:
          "Интерактив 3D газрын зураг дээрх түүхэн өртөөнүүдийг судалж, нэг бүрчлэн нээгээрэй.",
      },
      {
        number: "03",
        title: "Тоглож, домог бүтээ",
        description:
          "Дэд тоглоомуудыг амжилттай давж, оноо, нэр хүнд, шагналаа цуглуул.",
      },
    ],
  },
  games: {
    heading: "Тоглоомууд",
    items: [
      {
        name: "Шагайн наадгай",
        desc: "Физик хөдөлгөөн, магадлалын мэдрэмж, стратегийн сэтгэлгээг зэрэг хөгжүүлнэ.",
      },
      {
        name: "Сурын харваа",
        desc: "Нарийвчлал, төвлөрөл, дотоод тэнцвэрээ сорих харвааны сорилт.",
      },
      {
        name: "Морин уралдаан",
        desc: "Тэвчээр, хурд, замын тактик, шийдвэр гаргалтыг хамтад нь шалгана.",
      },
      {
        name: "Наадмын их баяр",
        desc: "Наадмын уур амьсгалд хамтдаа оролцож, нийгмийн харилцаанд суурилсан сорилтуудыг давна.",
      },
    ],
  },
  features: {
    items: [
      "Монголын уламжлал, домог, зан үйлийг тоглоомын хэлээр танин мэдэх",
      "Логик сэтгэлгээ, анхаарал төвлөрөл, гар‑нүдний зохицол зэрэг ур чадвараа хөгжүүлэх",
      "Уламжлалт мэдлэг, үлгэр домгийг орчин үеийн технологитой уялдуулан хадгалж, түгээх",
    ],
  },
  cta: {
    heading1: "Монголын өв соёлын ертөнцөд",
    heading2: "Өнөөдөр аяллаа эхлүүлээрэй",
    button: "Аяллаа эхлүүлэх",
    note: "Бета хувилбарын үеэр бүх тоглоомыг үнэ төлбөргүй турших боломжтой.",
  },
  footer: {
    subtitle: "Монголын өв соёлыг хадгалж, түгээх дижитал платформ",
    links: ["Төслийн тухай", "Нууцлалын бодлого", "Тусламж, холбоо барих"],
    copy: "© 2026 MTGA Studios. Зохиогчийн бүх эрх хуулиар хамгаалагдсан.",
  },
  theme: {
    light: "Гэрэл",
    dark: "Харанхуй",
    system: "Системийн тохиргоо",
    toggle: "Горим солих",
  },
};

const en: Translations = {
  nav: {
    title: "MONGOLIAN TRADITIONAL GAMES",
    play: "PLAY NOW",
    whatIs: "Overview",
    howItWorks: "How It Works",
    games: "Game Library",
    features: "Key Features",
  },
  hero: {
    title1: "MONGOLIAN",
    title2: "TRADITIONAL GAMES",
    subtitle:
      "A digital platform that brings Mongolia's cultural heritage to life through immersive 3D experiences.",
    cta: "Start Playing",
    free: "All games are inspired by authentic Mongolian heritage.",
  },
  whatIs: {
    heading: "PROJECT OVERVIEW",
    intro:
      "A living world of traditional Mongolian games and legends, blended into one immersive digital platform.",
    items: [
      {
        title: "Traditional Games, Reimagined",
        description:
          "Experience physics-based 3D challenges inspired by the wisdom of the steppe.",
      },
      {
        title: "Örtöö Travel System",
        description:
          "Journey across vast landscapes following Mongolia's historic relay network.",
      },
      {
        title: "Cultural Rewards & Achievements",
        description:
          "Collect digital artifacts and unlock achievements along your heroic path.",
      },
    ],
  },
  howItWorks: {
    heading: "How It Works",
    steps: [
      {
        number: "01",
        title: "Choose Your Hero",
        description:
          "Select an archetype and unique abilities that match your playstyle.",
      },
      {
        number: "02",
        title: "Explore the Örtöö Map",
        description:
          "Discover historic relay stations on an interactive 3D world map.",
      },
      {
        number: "03",
        title: "Play & Achieve",
        description:
          "Master mini-games, earn reputation, and unlock cultural rewards.",
      },
    ],
  },
  games: {
    heading: "Game Categories",
    items: [
      {
        name: "Shagai",
        desc: "Develop physics intuition, probability, and strategic thinking.",
      },
      {
        name: "Archery",
        desc: "Refine precision, focus, and mental balance.",
      },
      {
        name: "Horse Racing",
        desc: "Test endurance, speed, and decision-making skills.",
      },
      {
        name: "Naadam Festival",
        desc: "Engage in community-based cultural challenges.",
      },
    ],
  },
  features: {
    items: [
      "Explore Mongolian cultural heritage",
      "Enhance logic and practical skills",
      "Blend tradition with modern technology",
    ],
  },
  cta: {
    heading1: "Begin Your Journey",
    heading2: "Into Mongolian Heritage Today",
    button: "Start Your Adventure",
    note: "Free access available during beta release.",
  },
  footer: {
    subtitle: "Digital Platform for Mongolian Heritage",
    links: ["About", "Privacy Policy", "Support"],
    copy: "© 2026 MTGA Studios. All rights reserved.",
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