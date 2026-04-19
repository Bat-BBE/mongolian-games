import type { HeroId } from "./hero-strings";

export type HeroStats = { wisdom: number; strength: number; speed: number };

export interface Hero {
  id: HeroId;
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
  bioMn: string;
  bioEn: string;
}

export const HEROES: Hero[] = [
  {
    id: "shikhikhutag",
    name: "Шихихутаг",
    title: "Их Монгол Улсын дээд заргач",
    nameMn: "Шихихутаг",
    nameEn: "Shikhikhutag",
    titleMn: "Их Монгол Улсын дээд заргач",
    titleEn: "The Great Announcer of the Mongol Empire",
    imageUrl: "/images/shihihutag.png",
    modelPath: "/models/hero1.glb",
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
    title: "Их бичгийн багш",
    nameMn: "Тататунга",
    nameEn: "Tatatunga",
    titleMn: "Их бичгийн багш",
    titleEn: "The Master of the Great Script",
    imageUrl: "/images/tatatunga1.png",
    modelPath: "/models/stading idle 01.fbx",
    available: true,
    color: "#00A3E0",
    emissive: "#00c0ff",
    stats: { wisdom: 95, strength: 40, speed: 55 },
    bioMn: "",
    bioEn: "",
  },
  {
    id: "subutai",
    name: "Болд Чинсан",
    title: "Түүхч, төрийн түшээ",
    nameMn: "Болд Чинсан",
    nameEn: "Bold Chinsan",
    titleMn: "Түүхч, төрийн түшээ",
    titleEn: "Historian and Statesman",
    imageUrl: "/images/boldchinsan.png",
    modelPath: "/models/hero3.glb",
    available: true,
    color: "#C0392B",
    emissive: "#e04030",
    stats: { wisdom: 70, strength: 95, speed: 85 },
    bioMn: "",
    bioEn: "",
  },
  {
    id: "rashid",
    name: "Чойжи-Одсэр",
    title: "Монгол хэл шинжлэлийн эрдэмтэн",
    nameMn: "Чойжи-Одсэр",
    nameEn: "Choijiodser",
    titleMn: "Монгол хэл шинжлэлийн эрдэмтэн",
    titleEn: "Mongolian Linguistics Scholar",
    imageUrl: "/images/choijiodser.png",
    modelPath: "/models/hero4.glb",
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
