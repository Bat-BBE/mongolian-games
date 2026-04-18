export type HeroId = "shikhikhutag" | "tatatunga" | "subutai" | "rashid";
export type Lang = "mn" | "en";

/** DB / JSON-аас ирсэн утгыг HeroId болгоно. */
export function parseHeroId(raw: unknown): HeroId {
  if (
    raw === "shikhikhutag" ||
    raw === "tatatunga" ||
    raw === "subutai" ||
    raw === "rashid"
  ) {
    return raw;
  }
  return "shikhikhutag";
}

export const HERO_STRINGS = {
  mn: {
    gameTagline: "⚔ Монгол Домог ⚔",
    gameTitle1: "Өв &",
    gameTitle2: "Соёл",
    namePlaceholder: "Нэрээ оруулна уу...",
    emailPlaceholder: "И-мэйл хаяг",
    emailHint: "Бүртгэлтэй бол шууд тоглоомд орно",
    checkingEmail: "Шалгаж байна...",
    enterBtn: "Нэвтрэх",
    greeting: "Тавтай морил,",
    chooseHero: "Баатраа сонгоно уу",
    wisdom: "Мэргэн",
    strength: "Хүч",
    speed: "Хурд",
    locked: "Түгжигдсэн",
    lockedHero: "Түгжигдсэн Баатар",
    playBtn: "Аянд гарах",
    guest: "Зочноор үргэлжлүүлэх",
    autoSave: "Таны дэвшил үүлэнд автоматаар хадгалагдана",
    toast: (name: string, hero: string) =>
      `⚔ ${name} — ${hero}-тай хамт аян эхэллээ!`,
    role: {
      shikhikhutag: "Мэргэн Ухаан · Зан Суртахуун",
      tatatunga: "Мэдлэг · Гэгээрэл",
      subutai: "Стратеги · Дайчин",
      rashid: "Домог · Ухаан",
    },
    title: {
      shikhikhutag: "Шүүгч",
      tatatunga: "Бичигч",
      subutai: "Жанжин",
      rashid: "Түүхч",
    },
    name: {
      shikhikhutag: "Шихихутаг",
      tatatunga: "Тататунга",
      subutai: "Субэдэй",
      rashid: "Рашид ад-Дин",
    },
  },
  en: {
    gameTagline: "⚔ Mongol Legend ⚔",
    gameTitle1: "Heritage &",
    gameTitle2: "Culture",
    namePlaceholder: "Enter your name...",
    emailPlaceholder: "Enter your email...",
    emailHint: "Registered users go directly to the game",
    checkingEmail: "Checking...",
    enterBtn: "Enter",
    greeting: "Welcome,",
    chooseHero: "Choose Your Champion",
    wisdom: "Wisdom",
    strength: "Strength",
    speed: "Speed",
    locked: "Locked",
    lockedHero: "Locked Hero",
    playBtn: "Begin the Journey",
    guest: "Continue as Guest",
    autoSave: "Your progress and high scores will be automatically saved",
    toast: (name: string, hero: string) =>
      `⚔ ${name} — The journey begins with ${hero}!`,
    role: {
      shikhikhutag: "Wisdom · Morality",
      tatatunga: "Knowledge · Enlightenment",
      subutai: "Strategy · Warrior",
      rashid: "Lore · Intellect",
    },
    title: {
      shikhikhutag: "The Judge",
      tatatunga: "The Scribe",
      subutai: "The General",
      rashid: "The Historian",
    },
    name: {
      shikhikhutag: "Shikhikhutag",
      tatatunga: "Tatatunga",
      subutai: "Subutai",
      rashid: "Rashid-al-Din",
    },
  },
} as const;

export interface HeroStrings {
  gameTagline: string;
  gameTitle1: string;
  gameTitle2: string;
  namePlaceholder: string;
  emailPlaceholder: string;
  emailHint: string;
  checkingEmail: string;
  enterBtn: string;
  greeting: string;
  chooseHero: string;
  wisdom: string;
  strength: string;
  speed: string;
  locked: string;
  lockedHero: string;
  playBtn: string;
  guest: string;
  autoSave: string;
  toast: (name: string, hero: string) => string;
  role: Record<HeroId, string>;
  title: Record<HeroId, string>;
  name: Record<HeroId, string>;
}
