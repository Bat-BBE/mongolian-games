import type { HeroId } from "./hero-strings";

export type HeroStats = { wisdom: number; strength: number; speed: number };

/** Баатар — UI + DB-аас (getContentHeroes) нэг мөр болгоно. */
export interface Hero {
  id: HeroId;
  /** Хуучин нийцлийн тулд голчлон MN */
  name: string;
  title: string;
  nameMn: string;
  nameEn: string;
  titleMn: string;
  titleEn: string;
  imageUrl: string;
  modelPath?: string;
  available: boolean;
  color: string;
  emissive?: string;
  stats: HeroStats;
  /** DB `bio_mn` / `bio_en` — хоосон бол доор тайлбар харуулахгүй */
  bioMn: string;
  bioEn: string;
}

export const HEROES: Hero[] = [
  {
    id: "shikhikhutag",
    name: "Шихихутаг",
    title: "Хаадын Зөвлөх",
    nameMn: "Шихихутаг",
    nameEn: "Shikhikhutag",
    titleMn: "Хаадын Зөвлөх",
    titleEn: "The Judge",
    imageUrl: "/images/shihihutag.jpg",
    modelPath: "/models/hero-2.fbx",
    available: true,
    color: "#ffd559",
    emissive: "#D4AF37",
    stats: { wisdom: 90, strength: 60, speed: 70 },
    bioMn: "",
    bioEn: "",
  },
  {
    id: "tatatunga",
    name: "Тататунга",
    title: "Бичгийн Эзэн",
    nameMn: "Тататунга",
    nameEn: "Tatatunga",
    titleMn: "Бичгийн Эзэн",
    titleEn: "The Scribe",
    imageUrl: "/images/tatatunga.png",
    modelPath: "/models/X Bot.fbx",
    available: true,
    color: "#00A3E0",
    emissive: "#00c0ff",
    stats: { wisdom: 95, strength: 40, speed: 55 },
    bioMn: "",
    bioEn: "",
  },
  {
    id: "subutai",
    name: "Сүбэдэй",
    title: "Дайны Баатар",
    nameMn: "Сүбэдэй",
    nameEn: "Subutai",
    titleMn: "Дайны Баатар",
    titleEn: "The General",
    imageUrl: "/images/subutai.png",
    modelPath: "/models/X Bot.fbx.fbx",
    available: true,
    color: "#C0392B",
    emissive: "#e04030",
    stats: { wisdom: 70, strength: 95, speed: 85 },
    bioMn: "",
    bioEn: "",
  },
  {
    id: "rashid",
    name: "Рашид",
    title: "Түүхч Эрдэмтэн",
    nameMn: "Рашид",
    nameEn: "Rashid-al-Din",
    titleMn: "Түүхч Эрдэмтэн",
    titleEn: "The Historian",
    imageUrl: "/images/rashid.png",
    modelPath: "/models/X Bot.fbx",
    available: true,
    color: "#9B59B6",
    emissive: "#b070d0",
    stats: { wisdom: 85, strength: 50, speed: 60 },
    bioMn: "",
    bioEn: "",
  },
];

export const STORAGE_KEY = "mongol_game_player";

export interface SavedPlayer {
  name: string;
  heroId: HeroId;
}

export function loadPlayer(): SavedPlayer | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.name) return parsed as SavedPlayer;
  } catch {}
  return null;
}

export function savePlayer(data: SavedPlayer) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

export function clearPlayer() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}
