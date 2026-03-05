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
    title: "МОНГОЛ УЛАМЖЛАЛТ ТОГЛООМУУД",
    play: "ОДОО ТОГЛОХ",
    whatIs: "Төслийн тухай",
    howItWorks: "Хэрхэн ажиллах вэ",
    games: "Тоглоомын сан",
    features: "Давуу талууд",
  },
  hero: {
    title1: "МОНГОЛЫН",
    title2: "УЛАМЖЛАЛТ ТОГЛООМУУД",
    subtitle:
      "Монголын өв соёлыг 3D орчинд, интерактив аяллаар мэдрэх дижитал платформ.",
    cta: "Тоглож эхлэх",
    free: "Бүх тоглоомууд нь үндэсний өв соёлд суурилсан.",
  },
  whatIs: {
    items: [
      {
        title: "Уламжлалт тоглоомуудыг орчин үеийн хэлбэрээр",
        description:
          "Тал нутагт оюун ухаан, ур чадварыг сорих 3D физикт суурилсан тоглоомууд.",
      },
      {
        title: "Өртөөний аяллын систем",
        description:
          "Монголын түүхэн өртөөгөөр явч  монгол орноор виртуал аялал хийнэ.",
      },
      {
        title: "Соёлын үнэт шагналууд",
        description:
          "Дижитал олдвор, амжилтын тэмдэг цуглуулж, өөрийн баатарлаг замналыг бүтээ.",
      },
    ],
  },
  howItWorks: {
    heading: "Хэрхэн ажилладаг вэ ?",
    steps: [
      {
        number: "1",
        title: "Баатраа сонго",
        description:
          "Өөрийн тоглох хэв маягт тохирсон хэв маяг болон тусгай чадварыг сонго.",
      },
      {
        number: "2",
        title: "Өртөөнүүдээр аял",
        description:
          "Интерактив 3D газрын зураг дээр түүхэн өртөөнүүдийг судалж нээ.",
      },
      {
        number: "3",
        title: "Тоглож, амжилт бүтээ",
        description:
          "Жижиг тоглоомуудыг амжилттай давж, оноо болон шагналуудаа цуглуул.",
      },
    ],
  },
  games: {
    heading: "Тоглоомын төрөлүүд",
    items: [
      {
        name: "Шагайн наадгай",
        desc: "Физик, магадлал болон стратегийн сэтгэлгээг хөгжүүлнэ.",
      },
      {
        name: "Сурын харваа",
        desc: "Нарийвчлал, төвлөрөл, дотоод тэнцвэрийг сорих тоглоом.",
      },
      {
        name: "Морин уралдаан",
        desc: "Тэвчээр, хурд, шийдвэр гаргалтыг хослуулсан сорилт.",
      },
      {
        name: "Наадмын их баяр",
        desc: "Хамтын оролцоонд суурилсан нийгмийн сорилтууд.",
      },
    ],
  },
  features: {
    items: [
      "Монголын өв соёлыг танин мэдэх",
      "Логик сэтгэлгээ ба ур чадвараа хөгжүүлэх",
      "Уламжлалт мэдлэгийг орчин үеийн технологитой хослуулах",
    ],
  },
  cta: {
    heading1: "Монголын өв соёлын",
    heading2: "Аяллаа өнөөдөр эхлүүл",
    button: "Тоглож эхлэх",
    note: "Бета хувилбарт үнэ төлбөргүй нэвтрэх боломжтой.",
  },
  footer: {
    subtitle: "Монголын Өв Соёлын Дижитал Платформ",
    links: ["Төслийн тухай", "Нууцлалын бодлого", "Тусламж"],
    copy: "© 2026 MTGA Studios. Бүх эрх хуулиар хамгаалагдсан.",
  },
  theme: {
    light: "Цагаан",
    dark: "Хар",
    system: "Систем",
    toggle: "Өнгөний горим",
  },
};

const en: Translations = {
  nav: {
    title: "MONGOLIAN TRADITIONAL GAMES",
    play: "PLAY NOW",
    whatIs: "About",
    howItWorks: "How It Works",
    games: "Game Library",
    features: "Key Features",
  },
  hero: {
    title1: "MONGOLIAN",
    title2: "TRADITIONAL GAMES",
    subtitle:
      "A digital platform that brings Mongolia’s cultural heritage to life through immersive 3D experiences.",
    cta: "Start Playing",
    free: "All games are inspired by authentic Mongolian heritage.",
  },
  whatIs: {
    items: [
      {
        title: "Traditional Games, Reimagined",
        description:
          "Experience physics-based 3D challenges inspired by the wisdom of the steppe.",
      },
      {
        title: "Örtöö Travel System",
        description:
          "Journey across vast landscapes following Mongolia’s historic relay network.",
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
        number: "1",
        title: "Choose Your Hero",
        description:
          "Select an archetype and unique abilities that match your playstyle.",
      },
      {
        number: "2",
        title: "Explore the Örtöö Map",
        description:
          "Discover historic relay stations on an interactive 3D world map.",
      },
      {
        number: "3",
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
    <AppContext.Provider value={{ language, setLanguage, t: translations[language], heroSelectOpen, setHeroSelectOpen }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}