import { STATION_GAME_WEEKLY_PLAY_CAP } from "@/lib/stationWeeklyPlayCap";

export { STATION_GAME_WEEKLY_PLAY_CAP };

export const STATION_CONFIGS: Record<
  string,
  {
    left: string;
    top: string;
    icon: string;
    wx: number;
    wz: number;
    region: string;
  }
> = {
  // ── CENTRAL ────────────────────────────────────────────
  ulaanbaatar: {
    left: "55%",
    top: "45%",
    icon: "🏙️",
    wx: 0,
    wz: 0,
    region: "Богд Хан Ордон",
  },
  zuunmod: {
    left: "55%",
    top: "49%",
    icon: "🛕",
    wx: 0,
    wz: 80,
    region: "Манзушир Хийд",
  },
  terelj: {
    left: "59%",
    top: "41%",
    icon: "🦅",
    wx: 130,
    wz: -90,
    region: "Арьяабал Хийд",
  },
  nalaikh: {
    left: "58%",
    top: "46%",
    icon: "🪨",
    wx: 100,
    wz: -10,
    region: "Нялга Агуй",
  },
  kharakhorum: {
    left: "43%",
    top: "48%",
    icon: "🏛️",
    wx: -200,
    wz: 12,
    region: "Эрдэнэзуу Хийд",
  },
  arvaikheer: {
    left: "44%",
    top: "54%",
    icon: "🗿",
    wx: -188,
    wz: 130,
    region: "Цагаан Суварга",
  },
  orkhon_river: {
    left: "40%",
    top: "41%",
    icon: "🌊",
    wx: -238,
    wz: -90,
    region: "Орхоны Хөндий",
  },
  mandalgovi: {
    left: "57%",
    top: "63%",
    icon: "🕌",
    wx: 20,
    wz: 230,
    region: "Онгийн Хийд",
  },

  // ── NORTH ──────────────────────────────────────────────
  darkhan: {
    left: "51%",
    top: "33%",
    icon: "🐴",
    wx: -62,
    wz: -175,
    region: "Хустайн Нуруу",
  },
  erdenet: {
    left: "46%",
    top: "35%",
    icon: "🛕",
    wx: -150,
    wz: -150,
    region: "Амарбаясгалант Хийд",
  },
  sukhbaatar: {
    left: "52%",
    top: "27%",
    icon: "🏰",
    wx: -45,
    wz: -250,
    region: "Алтан Булаг",
  },
  moron: {
    left: "34%",
    top: "28%",
    icon: "🌊",
    wx: -350,
    wz: -238,
    region: "Дэлгэр Мөрөн",
  },
  khatgal: {
    left: "33%",
    top: "21%",
    icon: "🏞️",
    wx: -375,
    wz: -325,
    region: "Хөвсгөл Нуур",
  },

  // ── WEST ───────────────────────────────────────────────
  uliastai: {
    left: "26%",
    top: "40%",
    icon: "🏔️",
    wx: -525,
    wz: -88,
    region: "Отгонтэнгэр Уул",
  },
  bayankhongor: {
    left: "35%",
    top: "58%",
    icon: "🦌",
    wx: -350,
    wz: 138,
    region: "Яхын Нуур",
  },
  altai: {
    left: "21%",
    top: "55%",
    icon: "⛰️",
    wx: -600,
    wz: 100,
    region: "Алтайн Нуруу",
  },
  khovd: {
    left: "12%",
    top: "48%",
    icon: "🦅",
    wx: -750,
    wz: 12,
    region: "Буянт Ухаа",
  },
  ulaangom: {
    left: "14%",
    top: "26%",
    icon: "🌊",
    wx: -712,
    wz: -263,
    region: "Увс Нуур",
  },

  // ── EAST ───────────────────────────────────────────────
  ondorhaan: {
    left: "68%",
    top: "42%",
    icon: "⛰️",
    wx: 238,
    wz: -62,
    region: "Бурхан Халдун",
  },
  kherlenbayan: {
    left: "75%",
    top: "44%",
    icon: "🌾",
    wx: 362,
    wz: -38,
    region: "Аврага Тосгон",
  },
  choibalsan: {
    left: "85%",
    top: "40%",
    icon: "🐎",
    wx: 538,
    wz: -88,
    region: "Хэрлэн Тохой",
  },
  baruun_urt: {
    left: "76%",
    top: "53%",
    icon: "🏕️",
    wx: 388,
    wz: 75,
    region: "Дадал",
  },

  // ── SOUTH GOBI ─────────────────────────────────────────
  dalanzadgad: {
    left: "48%",
    top: "75%",
    icon: "🦖",
    wx: -112,
    wz: 350,
    region: "Хонгорын Элс",
  },
  sainshand: {
    left: "68%",
    top: "68%",
    icon: "🕌",
    wx: 238,
    wz: 263,
    region: "Хамарын Хийд",
  },
  zamiin_uud: {
    left: "72%",
    top: "78%",
    icon: "🪨",
    wx: 312,
    wz: 388,
    region: "Их Газрын Чулуу",
  },
};

// Increase world spacing between stations/roads without changing 2D % positions.
export const WORLD_SCALE = 1.35;

/**
 * Өртөө хоорондын зайг ихэсгэх (нэгж: зам/гэр/3D байрлал бүгд ижил координат системд).
 */
export const STATION_SPREAD = 2.45;

/** Станцын wx/wz-аас дэлхийн XZ (бүх зам, гэр, камер ижил). */
export function stationWorldXZ(
  wx: number,
  wz: number,
): { x: number; z: number } {
  const f = WORLD_SCALE * STATION_SPREAD;
  return { x: wx * f, z: wz * f };
}

/**
 * Тоглогчийн гэр — Сүхбаатарын цаад тал (хойд зүг, эзгүй бэлчир).
 * sukhbaatar: wx -45, wz -250 — түүнээс цааш хойд руу; ойрын өртөөнүүдээс (~100+ wx/wz нэгж) зайтай.
 * Бүх өртөөтэй ижил: wx/wz × WORLD_SCALE × STATION_SPREAD
 */
export const PLAYER_HOME_WX = -130;
export const PLAYER_HOME_WZ = -330;
export const PLAYER_HOME_X = PLAYER_HOME_WX * WORLD_SCALE * STATION_SPREAD;
export const PLAYER_HOME_Z = PLAYER_HOME_WZ * WORLD_SCALE * STATION_SPREAD;

function fnv1a32(key: string): number {
  const k = key.trim().toLowerCase() || "local";
  let h = 2166136261;
  for (let i = 0; i < k.length; i++) {
    h ^= k.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Ганц seed-ээс хоёр тусгаарлагдсан [0,1) утга — өнцөг ба радиус давхардахгүй. */
function hashToUnit2(seed: number): [number, number] {
  let x = seed >>> 0;
  x ^= x >>> 16;
  x = Math.imul(x, 0x7feb352d) >>> 0;
  const u0 = x / 4294967296;
  x ^= x >>> 15;
  x = Math.imul(x, 0x846ca68b) >>> 0;
  const u1 = x / 4294967296;
  return [u0, u1];
}

function rehashSeed(seed: number, round: number): number {
  let x = (seed + round * 0x9e3779b9) >>> 0;
  x ^= x >>> 16;
  x = Math.imul(x, 0x7feb352d) >>> 0;
  x ^= x >>> 15;
  x = Math.imul(x, 0x846ca68b) >>> 0;
  return x >>> 0;
}

let stationWorldCentersCache: Array<{ x: number; z: number }> | null = null;
function allStationWorldCenters(): Array<{ x: number; z: number }> {
  if (!stationWorldCentersCache) {
    stationWorldCentersCache = Object.values(STATION_CONFIGS).map((c) =>
      stationWorldXZ(c.wx, c.wz),
    );
  }
  return stationWorldCentersCache;
}

/** Тоглогчийн гэрийн төв → `STATION_CONFIGS` өртөөний гол цэгээс дор хаяж ийм зайтай. */
const PLAYER_HOME_MIN_CLEAR_FROM_STATION = 112;
const PLAYER_HOME_MIN_CLEAR_FROM_STATION_SQ =
  PLAYER_HOME_MIN_CLEAR_FROM_STATION * PLAYER_HOME_MIN_CLEAR_FROM_STATION;

function isPlayerHomeClearOfStations(x: number, z: number): boolean {
  const stations = allStationWorldCenters();
  for (let i = 0; i < stations.length; i++) {
    const s = stations[i];
    const dx = x - s.x;
    const dz = z - s.z;
    if (dx * dx + dz * dz < PLAYER_HOME_MIN_CLEAR_FROM_STATION_SQ) {
      return false;
    }
  }
  return true;
}

/** Бүх оролдлого татгалзсан бол: гадаад тойрог дээр өртөөнөөс хамгийн хол цэг. */
function playerHomeFallbackFurthestOnRing(): { x: number; z: number } {
  const stations = allStationWorldCenters();
  const rOuter = 268;
  let bestA = 0;
  let bestMinD2 = -1;
  for (let k = 0; k < 36; k++) {
    const ang = (k / 36) * Math.PI * 2;
    const x = PLAYER_HOME_X + Math.cos(ang) * rOuter;
    const z = PLAYER_HOME_Z + Math.sin(ang) * rOuter;
    let minD2 = Infinity;
    for (let i = 0; i < stations.length; i++) {
      const s = stations[i];
      const dx = x - s.x;
      const dz = z - s.z;
      minD2 = Math.min(minD2, dx * dx + dz * dz);
    }
    if (minD2 > bestMinD2) {
      bestMinD2 = minD2;
      bestA = ang;
    }
  }
  return {
    x: PLAYER_HOME_X + Math.cos(bestA) * rOuter,
    z: PLAYER_HOME_Z + Math.sin(bestA) * rOuter,
  };
}

/**
 * Тоглогч бүрт тогтмол (hash) гэрийн төв — нэг world дээр олон тоглогчийн гэр/хашаа
 * ижил цэг дээр багтахгүй, хоорондоо ойрхон давхцах магадлалыг бууруулах зорилготой.
 *
 * Мөн `STATION_CONFIGS` дээрх өртөө/газрын цэгүүдийн гол байрлалтай давхцахгүй (замын гэртэй
 * нэг дор гаргахгүй) — ойрын оролдлогоор дахин сонгоно.
 *
 * Анхаар: олон тоглогчийн хоорондын давхцал — санамсаргүй тархалт (100% баталгаа биш).
 */
export function playerHomeWorldAnchor(userKey: string): {
  x: number;
  z: number;
} {
  let seed = fnv1a32(userKey);
  /** Том хашааны хагас тэнхлэг ~70+ — төв хоорондын зай ихэвчлэн 130–160+ байх ёстой */
  const rInner = 108;
  const rOuter = 268;
  const r2In = rInner * rInner;
  const r2Out = rOuter * rOuter;
  for (let attempt = 0; attempt < 56; attempt++) {
    const [u, v] = hashToUnit2(seed);
    /** Цаган хоолойд талбайн хувьд тэгш: P(r) ∝ r */
    const r = Math.sqrt(u * (r2Out - r2In) + r2In);
    const theta = v * Math.PI * 2;
    const x = PLAYER_HOME_X + Math.cos(theta) * r;
    const z = PLAYER_HOME_Z + Math.sin(theta) * r;
    if (isPlayerHomeClearOfStations(x, z)) {
      return { x, z };
    }
    seed = rehashSeed(seed, attempt + 1);
  }
  return playerHomeFallbackFurthestOnRing();
}

// ── НАР ЗҮҮНЭЭС ГАРЧ БАРУУН ТИЙШ — 15 өртөө (гүйцэтгэл / аяллын тоолуур) ──
// Бүх өртөө газрын зураг дээр хэвээр; энд зөвхөн “албан” аяллын дараалал.
// `server/src/journeyOrder.ts` → ижил дараалал.
export const JOURNEY_ORDER: string[] = [
  "choibalsan",
  "kherlenbayan",
  "ondorhaan",
  "terelj",
  "nalaikh",
  "ulaanbaatar",
  "zuunmod",
  "mandalgovi",
  "darkhan",
  "erdenet",
  "kharakhorum",
  "moron",
  "khatgal",
  "altai",
  "khovd",
];

export const HORSE_COLORS = [
  0x6b3a1f, 0x3a2010, 0xc8a060, 0x8a6030, 0x1a1008, 0xd4b890, 0xa06040,
];

/** Газрын хэмжээ — өргөн тал (хязгаар багатай мэт харагдахуйц). */
export const TERRAIN_W = 12000;
export const TERRAIN_D = 10000;
/** Давхцсан тэгш өнцөгтүүдийн тоо — багасгахад RAM/CPU хэмнэнэ. */
/** Газрын нарийвчлал (хэт багасгавал «зураг шиг» хоосон харагдана). */
export const TERRAIN_SEG = 256;

/** 3D map — нарны сүүдрийн texture (2048 = илүү нарийвчлал, 1024 = GPU/VRAM хөнгөвч). */
export const MAP_PERF_SHADOW_MAP = 2048;
/** Retina: өндөр DPR = fill rate их; бууруулбал илүү тогтвортой FPS. */
export const MAP_PERF_MAX_DPR = 1.32;

/**
 * Газрын 3D `useThreeScene` — нэг мандал. `app/globals.css` дэх `--map-*` өнгөтэй
 * тааруулсан (2D card / floating UI-той ижил "агаар"). Өөрчлөхөд хоёуланг нь шинэчил.
 */
export const MAP_SCENE = {
  background: 0x92c4e8,
  fog: 0xb8d0e8,
  /** Алсаар алгуур арилгаж, тэнгэрийн reverb */
  fogDensity: 0.00086,
  ambient: 0xa8b8d8,
  ambientInt: 0.52,
  sun: 0xffecd8,
  sunInt: 2.12,
  fill: 0xc8dce8,
  fillInt: 0.4,
  back: 0xffc878,
  backInt: 0.3,
  hemiSky: 0x8ec0e8,
  hemiGround: 0x6a9a45,
  hemiInt: 0.52,
  toneMappingExposure: 1.08,
} as const;

export const MAP_SCENE_CSS = {
  sky: "#92c4e8",
  fog: "#b8d0e8",
} as const;
/** Газрын 2D label overlay: React setState-ийг 60Hz бүр дуудахгүй. */
export const MAP_LABEL_UI_MIN_INTERVAL_MS = 45;

export function normalizeStationId(raw: string | undefined): string {
  let s = raw?.trim() || "ulaanbaatar";
  if (s === "orkhon") s = "orkhon_river";
  return s;
}

export function getStationJourneyIndex(stationId: string): number {
  return JOURNEY_ORDER.indexOf(stationId);
}
export function isStationUnlockedInJourney(
  stationId: string,
  _currentStationId: string,
): boolean {
  if (stationId === "home") return true;
  return Boolean(STATION_CONFIGS[stationId]);
}

/** Өртөө → тоглоом → тухайн тоглоомыг дуусгасан цагийн жагсаалт (7 хоногийн цонхонд `STATION_GAME_WEEKLY_PLAY_CAP` хүртэл). */
export type StationGameVisits = Record<string, Record<string, number[]>>;

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** Нэг тоглоомонд 7 хоногт үлдсэн тоглолтын тоо. */
export function gameWeeklyPlaysRemaining(
  stationId: string,
  gameSlug: string,
  stationGameVisits: StationGameVisits | undefined,
): number {
  const now = Date.now();
  const visits = (stationGameVisits?.[stationId]?.[gameSlug] ?? [])
    .map((x) => Number(x))
    .filter((n) => Number.isFinite(n) && n >= now - WEEK_MS);
  return Math.max(0, STATION_GAME_WEEKLY_PLAY_CAP - visits.length);
}

/**
 * Тухайн өртөөний бүх тоглоом 7 хоногийн хязгаараа дуусгасан эсэх.
 * `gameSlugs` хоосон бол false (түгжээ үүсгэхгүй).
 */
export function stationAllGamesWeeklyLocked(
  stationId: string,
  gameSlugs: string[],
  stationGameVisits: StationGameVisits | undefined,
): boolean {
  const slugs = gameSlugs.filter((s) => s.trim().length > 0);
  if (slugs.length === 0) return false;
  return slugs.every(
    (slug) => gameWeeklyPlaysRemaining(stationId, slug, stationGameVisits) <= 0,
  );
}

/** @deprecated Нэг тоглоом тутамд лимит рүү шилжсэн; зөвхөн хуучин өгөгдөлд зориулсан. */
export function stationWeeklyPlaysRemaining(
  stationId: string,
  stationVisits: Record<string, number[]> | undefined,
): number {
  const windowMs = 7 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const visits = (stationVisits?.[stationId] ?? [])
    .map((x) => Number(x))
    .filter((n) => Number.isFinite(n) && n >= now - windowMs);
  return Math.max(0, STATION_GAME_WEEKLY_PLAY_CAP - visits.length);
}
