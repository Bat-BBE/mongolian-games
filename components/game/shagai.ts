

export type ShagaiSide = "horse" | "sheep" | "goat" | "camel";

export interface ShagaiResult {
  side: ShagaiSide;
  name: string;
  symbol: string;
  mongolian: string;
  value: number;
  color: string;
  glow: string;
  description: string;
  luck: string;
  proverb: string;
}

export const SHAgAI_SIDES: Record<ShagaiSide, ShagaiResult> = {
  horse: {
    side: "horse",
    name: "Морь",
    symbol: "🐴",
    mongolian: "ᠮᠣᠷᠢ",
    value: 4,
    color: "#f0c040",
    glow: "rgba(240,192,64,0.5)",
    description: "Морь — эрч хүч, хурд, сүлд хийморийн бэлгэдэл. Хамгийн өндөр оноо.",
    luck: "Зорилгодоо хурдан хүрнэ. Аз таарч байна!",
    proverb: "Морин дээр гарсан хүн газар харахгүй.",
  },
  sheep: {
    side: "sheep",
    name: "Хонь",
    symbol: "🐑",
    mongolian: "ᠬᠣᠨᠢ",
    value: 3,
    color: "#90d890",
    glow: "rgba(144,216,144,0.5)",
    description: "Хонь — элбэг дэлбэг байдал, нөхөрсөг зан, гэр бүлийн бэлгэдэл.",
    luck: "Гэр бүлд аз жаргал орж ирнэ.",
    proverb: "Хонь олонтой хүн баян.",
  },
  goat: {
    side: "goat",
    name: "Ямаа",
    symbol: "🐐",
    mongolian: "ᠢᠮᠠᠭ᠎ᠠ",
    value: 2,
    color: "#c8956a",
    glow: "rgba(200,149,106,0.5)",
    description: "Ямаа — тэсвэр тэвчээр, авхаалж самбаа, бие даасан байдлын бэлгэдэл.",
    luck: "Саад бэрхшээлийг даван туулна.",
    proverb: "Ямаа өндөр хад авирдаг.",
  },
  camel: {
    side: "camel",
    name: "Тэмээ",
    symbol: "🐫",
    mongolian: "ᠲᠡᠮᠡᠭᠡ",
    value: 1,
    color: "#e0a050",
    glow: "rgba(224,160,80,0.5)",
    description: "Тэмээ — тэвчээр, дасан зохицох чадвар, говийн их тэвчээрийн бэлгэдэл.",
    luck: "Тэвчээртэй байгаарай — амжилт ирнэ.",
    proverb: "Тэмээ цөлийг давдаг, хүн бэрхийг давдаг.",
  },
};

// Euler rotation → дээшээ харж буй нүүр → ShagaiSide
export function detectShagaiSide(rotX: number, rotZ: number): ShagaiSide {
  const norm = (a: number) => ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  const rx = norm(rotX);
  const rz = norm(rotZ);

  const xFlat = rx < 0.45 || rx > 5.83;
  const xFlip = rx > 2.70 && rx < 3.58;
  const zFlat = rz < 0.45 || rz > 5.83;
  const zFlip = rz > 2.70 && rz < 3.58;

  if (xFlat && zFlat) return "horse";
  if (xFlip && zFlip) return "camel";
  if (zFlip && !xFlip) return "sheep";
  if (xFlip && !zFlip) return "goat";

  // Quadrant fallback
  if (rx < Math.PI) return rz < Math.PI ? "horse" : "sheep";
  return rz < Math.PI ? "goat" : "camel";
}

export interface ThrowRecord {
  side: ShagaiSide;
  timestamp: Date;
  throwNumber: number;
}