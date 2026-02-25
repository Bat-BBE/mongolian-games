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
    title: "МОНГОЛ УЛАМЖЛАЛТ ТОГЛООМ",
    play: "ТОГЛОХ",
    whatIs: "Юу вэ?",
    howItWorks: "Хэрхэн ажилладаг",
    games: "Тоглоомууд",
    features: "Онцлогууд",
  },
  hero: {
    title1: "МОНГОЛ",
    title2: "УЛАМЖЛАЛТ ТОГЛООМ",
    subtitle: "Монгол орноор тоглоом тоглон аяллаар мэдрээрэй.",
    cta: "Тоглох",
    free: "Бета судлаачдад үнэгүй хандалт",
  },
  whatIs: {
    items: [
      { title: "Уламжлалт тоглоом тоглоорой", description: "Тал нутгийн зүрхнээс гарсан 3D физик дээр суурилсан сорилтуудыг эзэмшээрэй." },
      { title: "Өртөөгөөр аялаарай", description: "Түүхэн өртөөний системийг дагаж уудам нутгаар аяллаарай." },
      { title: "Соёлын шагнал олж ав", description: "Өвөрмөц дижитал олдворуудыг цуглуул, баатрын амжилтуудаа нээгээрэй." },
    ],
  },
  howItWorks: {
    heading: "Хэрхэн ажилладаг",
    steps: [
      { number: "1", title: "Баатраа сонгоорой", description: "Өөрийн архетип болон тусгай чадваруудаа сонгоорой." },
      { number: "2", title: "Өртөөний газрыг аялаарай", description: "Интерактив 3D газрын зураг дээр өртөөнүүдийг судлаарай." },
      { number: "3", title: "Тоглож цуглуул", description: "Мини тоглоомуудыг эзэмш, нэр хүндээ олж ав." },
    ],
  },
  games: {
    heading: "Тоглоомууд",
    items: [
      { name: "Шагайн тоглоом", desc: "Физик ба магадлалыг заадаг." },
      { name: "Сурын харваа", desc: "Нарийвчлал, анхаарлыг эзэмшүүлдэг." },
      { name: "Морин уралдаан", desc: "Тэвчээр, хурдыг сурна." },
      { name: "Наадмын баяр", desc: "Хамтын нийгэмлэгийн сорилтууд." },
    ],
  },
  features: {
    items: ["Монгол соёлыг сур", "Логик ба ур чадвараа хөгжүүл", "Уламжлалыг нээн илрүүл"],
  },
  cta: {
    heading1: "Монголын аялалаа",
    heading2: "Өнөөдөр эхлүүлээрэй",
    button: "Тоглож эхлэх",
    note: "Бета судлаачдад үнэгүй хандалт",
  },
  footer: {
    subtitle: "Монголын Өвийн Платформ",
    links: ["Түүх", "Нууцлал", "Дэмжлэг"],
    copy: "© 2024 MTGA Studios",
  },
  theme: { light: "Цагаан", dark: "Хар", system: "Систем", toggle: "Өнгөний сонголт" },
};

const en: Translations = {
  nav: {
    title: "MONGOLIAN TRADITIONAL GAMES",
    play: "PLAY NOW",
    whatIs: "What Is It?",
    howItWorks: "How It Works",
    games: "Games",
    features: "Features",
  },
  hero: {
    title1: "MONGOLIAN",
    title2: "TRADITIONAL GAMES",
    subtitle: "Embark on a 3D journey through Mongolia's heritage.",
    cta: "Play",
    free: "Free access for beta explorers",
  },
  whatIs: {
    items: [
      { title: "Play Traditional Games", description: "Master 3D physics-based challenges from the heart of the steppe." },
      { title: "Travel through Örtöö stations", description: "Navigate the historic relay system across vast landscapes." },
      { title: "Earn cultural rewards & badges", description: "Collect unique digital artifacts and unlock hero achievements." },
    ],
  },
  howItWorks: {
    heading: "How It Works",
    steps: [
      { number: "1", title: "Choose Hero", description: "Select your archetype and special abilities." },
      { number: "2", title: "Travel Örtöö Map", description: "Explore relay stations on the interactive 3D map." },
      { number: "3", title: "Play & Collect", description: "Master mini-games and earn your reputation." },
    ],
  },
  games: {
    heading: "Games",
    items: [
      { name: "Shagai Games", desc: "Teach physics & probability." },
      { name: "Archery", desc: "Master precision and focus." },
      { name: "Horse Racing", desc: "Learn endurance and speed." },
      { name: "Festivals", desc: "Community challenges." },
    ],
  },
  features: {
    items: ["Learn Mongolian culture", "Develop logic & skill", "Discover traditions"],
  },
  cta: {
    heading1: "Start Your Mongolian",
    heading2: "Adventure Today",
    button: "Start Playing",
    note: "Free access for beta explorers",
  },
  footer: {
    subtitle: "Mongolian Heritage Platform",
    links: ["History", "Privacy", "Support"],
    copy: "© 2024 MTGA Studios",
  },
  theme: { light: "Light", dark: "Dark", system: "System", toggle: "Toggle theme" },
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