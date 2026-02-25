import type { HeroId } from "./hero-strings";

export const HEROES = [
  {
    id: "shikhikhutag" as HeroId,
    name: "Шихихутаг",
    title: "Хаадын Зөвлөх",
    imageUrl: "/images/shikhikhutag.jpg",
    modelPath: "/models/X Bot.fbx",
    available: true,
    color: "#ffd559",
    emissive: "#D4AF37",
    stats: { wisdom: 90, strength: 60, speed: 70 },
  },
  {
    id: "tatatunga" as HeroId,
    name: "Тататунга",
    title: "Бичгийн Эзэн",
    imageUrl: "/images/tatatunga.jpg",
    modelPath: "/models/X Bot.fbx",
    available: false,
    color: "#00A3E0",
    emissive: "#00c0ff",
    stats: { wisdom: 95, strength: 40, speed: 55 },
  },
  {
    id: "subutai" as HeroId,
    name: "Сүбэдэй",
    title: "Дайны Баатар",
    imageUrl: "/images/subutai.jpg",
    modelPath: "/models/X Bot.fbx",
    available: false,
    color: "#C0392B",
    emissive: "#e04030",
    stats: { wisdom: 70, strength: 95, speed: 85 },
  },
  {
    id: "rashid" as HeroId,
    name: "Рашид",
    title: "Түүхч Эрдэмтэн",
    imageUrl: "/images/rashid.jpg",
    modelPath: "/models/X Bot.fbx",
    available: false,
    color: "#9B59B6",
    emissive: "#b070d0",
    stats: { wisdom: 85, strength: 50, speed: 60 },
  },
] as const;

export type Hero = (typeof HEROES)[number];

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