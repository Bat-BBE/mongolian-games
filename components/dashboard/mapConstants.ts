export const STATION_CONFIGS: Record<string, {
  left: string;
  top: string;
  icon: string;
  wx: number;
  wz: number;
  region: string;
}> = {
  // ── CENTRAL ────────────────────────────────────────────
  ulaanbaatar:  { left: "55%", top: "45%", icon: "🏙️", wx:   0,   wz:   0,   region: "Богд Хан Ордон" },
  zuunmod:      { left: "55%", top: "49%", icon: "🛕",  wx:   0,   wz:  80,   region: "Манзушир Хийд" },
  terelj:       { left: "59%", top: "41%", icon: "🦅",  wx: 130,   wz:  -90,  region: "Арьяабал Хийд" },
  nalaikh:      { left: "58%", top: "46%", icon: "🪨",  wx: 100,   wz:  -10,  region: "Нялга Агуй" },
  kharakhorum:  { left: "43%", top: "48%", icon: "🏛️",  wx: -200,  wz:   12,  region: "Эрдэнэзуу Хийд" },
  arvaikheer:   { left: "44%", top: "54%", icon: "🗿",  wx: -188,  wz:  130,  region: "Цагаан Суварга" },
  orkhon_river: { left: "40%", top: "41%", icon: "🌊",  wx: -238,  wz:  -90,  region: "Орхоны Хөндий" },
  mandalgovi:   { left: "57%", top: "63%", icon: "🕌",  wx:   20,  wz:  230,  region: "Онгийн Хийд" },

  // ── NORTH ──────────────────────────────────────────────
  darkhan:      { left: "51%", top: "33%", icon: "🐴",  wx:  -62,  wz: -175,  region: "Хустайн Нуруу" },
  erdenet:      { left: "46%", top: "35%", icon: "🛕",  wx: -150,  wz: -150,  region: "Амарбаясгалант Хийд" },
  sukhbaatar:   { left: "52%", top: "27%", icon: "🏰",  wx:  -45,  wz: -250,  region: "Алтан Булаг" },
  moron:        { left: "34%", top: "28%", icon: "🌊",  wx: -350,  wz: -238,  region: "Дэлгэр Мөрөн" },
  khatgal:      { left: "33%", top: "21%", icon: "🏞️",  wx: -375,  wz: -325,  region: "Хөвсгөл Нуур" },

  // ── WEST ───────────────────────────────────────────────
  uliastai:     { left: "26%", top: "40%", icon: "🏔️",  wx: -525,  wz:  -88,  region: "Отгонтэнгэр Уул" },
  bayankhongor: { left: "35%", top: "58%", icon: "🦌",  wx: -350,  wz:  138,  region: "Яхын Нуур" },
  altai:        { left: "21%", top: "55%", icon: "⛰️",  wx: -600,  wz:  100,  region: "Алтайн Нуруу" },
  khovd:        { left: "12%", top: "48%", icon: "🦅",  wx: -750,  wz:   12,  region: "Буянт Ухаа" },
  ulaangom:     { left: "14%", top: "26%", icon: "🌊",  wx: -712,  wz: -263,  region: "Увс Нуур" },

  // ── EAST ───────────────────────────────────────────────
  ondorhaan:    { left: "68%", top: "42%", icon: "⛰️",  wx:  238,  wz:  -62,  region: "Бурхан Халдун" },
  kherlenbayan: { left: "75%", top: "44%", icon: "🌾",  wx:  362,  wz:  -38,  region: "Аврага Тосгон" },
  choibalsan:   { left: "85%", top: "40%", icon: "🐎",  wx:  538,  wz:  -88,  region: "Хэрлэн Тохой" },
  baruun_urt:   { left: "76%", top: "53%", icon: "🏕️",  wx:  388,  wz:   75,  region: "Дадал" },

  // ── SOUTH GOBI ─────────────────────────────────────────
  dalanzadgad:  { left: "48%", top: "75%", icon: "🦖",  wx: -112,  wz:  350,  region: "Хонгорын Элс" },
  sainshand:    { left: "68%", top: "68%", icon: "🕌",  wx:  238,  wz:  263,  region: "Хамарын Хийд" },
  zamiin_uud:   { left: "72%", top: "78%", icon: "🪨",  wx:  312,  wz:  388,  region: "Их Газрын Чулуу" },
};

// Increase world spacing between stations/roads without changing 2D % positions.
export const WORLD_SCALE = 1.35;

/**
 * Өртөө хоорондын зайг ихэсгэх (нэгж: зам/гэр/3D байрлал бүгд ижил координат системд).
 */
export const STATION_SPREAD = 2.45;

/** Станцын wx/wz-аас дэлхийн XZ (бүх зам, гэр, камер ижил). */
export function stationWorldXZ(wx: number, wz: number): { x: number; z: number } {
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

// ── НАР ЗҮҮНЭЭС ГАРЧ БАРУУН ТИЙШ ЯВАХ ДАРААЛАЛ ──────────
// Нар мандах зүүн бүс → Төв → Баруун бүс → Нар жаргах
// wx утгаар зүүнээс (өндөр wx) баруун тийш (бага wx) буурах дарааллаар
export const JOURNEY_ORDER: string[] = [
  // 🌅 НАР МАНДАХ ЗҮҮ Н — Хэрлэн голын бүс (wx ~538..362)
  "choibalsan",    // wx: 538 — хамгийн зүүн
  "kherlenbayan",  // wx: 362
  "baruun_urt",    // wx: 388

  // ⛅ ЗҮҮН-ТӨВИЙН БҮС — Хэнтийн нуруу (wx ~238..100)
  "ondorhaan",     // wx: 238
  "terelj",        // wx: 130
  "nalaikh",       // wx: 100

  // 🌞 ДУНДЫН ЦЭГ — Улаанбаатар (wx: 0)
  "ulaanbaatar",   // wx:   0

  // ☀️ ӨМНӨД ЧИГЛЭЛ — Говийн зам (wx ~20..312)
  "zuunmod",       // wx:   0, wz:  80
  "mandalgovi",    // wx:  20, wz: 230
  "sainshand",     // wx: 238, wz: 263
  "zamiin_uud",    // wx: 312, wz: 388

  // 🌤 ХОЙД ЧИГЛЭЛ — Хангайн бүс (wx ~-45..-375)
  "sukhbaatar",    // wx:  -45, wz: -250
  "darkhan",       // wx:  -62, wz: -175
  "erdenet",       // wx: -150, wz: -150
  "kharakhorum",   // wx: -200, wz:   12
  "orkhon_river",  // wx: -238, wz:  -90
  "arvaikheer",    // wx: -188, wz:  130
  "moron",         // wx: -350, wz: -238
  "khatgal",       // wx: -375, wz: -325
  "bayankhongor",  // wx: -350, wz:  138

  // 🌇 БАРУУН БҮС — Алтайн нуруу (wx ~-525..-750)
  "uliastai",      // wx: -525
  "dalanzadgad",   // wx: -112, wz: 350 (говийн баруун)
  "altai",         // wx: -600
  "ulaangom",      // wx: -712, wz: -263

  // 🌆 НАР ЖАРГАХ — Хамгийн баруун (wx: -750)
  "khovd",         // wx: -750 — хамгийн барууsн
];

export const HORSE_COLORS = [
  0x6b3a1f, 0x3a2010, 0xc8a060,
  0x8a6030, 0x1a1008, 0xd4b890, 0xa06040,
];

/** Газрын хэмжээ — өргөн тал (хязгаар багатай мэт харагдахуйц). */
export const TERRAIN_W   = 12000;
export const TERRAIN_D   = 10000;
export const TERRAIN_SEG = 448;

/** Firebase/хуучин өгөгдөлд `orkhon` гэж ирвэл зураг дээрх slug руу. */
export function normalizeStationId(raw: string | undefined): string {
  let s = raw?.trim() || "ulaanbaatar";
  if (s === "orkhon") s = "orkhon_river";
  return s;
}

/** Аяллын дараалал дахь индекс (байхгүй бол -1) */
export function getStationJourneyIndex(stationId: string): number {
  return JOURNEY_ORDER.indexOf(stationId);
}

/**
 * Газрын зураг дээрх аяллын дарааллын түгжээгүй — бүх өртөө руу очих боломжтой.
 * 7 хоногийн тоглолтын хязгаар нь StationPopup / сервер дээр тооцогдоно.
 */
export function isStationUnlockedInJourney(
  stationId: string,
  _currentStationId: string,
): boolean {
  if (stationId === "home") return true;
  return Boolean(STATION_CONFIGS[stationId]);
}

/** Өртөө → тоглоом → тухайн тоглоомыг дуусгасан цагийн жагсаалт (7 хоногийн цонхонд 2 хүртэл). */
export type StationGameVisits = Record<string, Record<string, number[]>>;

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** Нэг тоглоомond 7 хоногт үлдсэн тоглолтын тоо (хамгийн ихдээ 2). */
export function gameWeeklyPlaysRemaining(
  stationId: string,
  gameSlug: string,
  stationGameVisits: StationGameVisits | undefined,
): number {
  const now = Date.now();
  const visits = (stationGameVisits?.[stationId]?.[gameSlug] ?? [])
    .map((x) => Number(x))
    .filter((n) => Number.isFinite(n) && n >= now - WEEK_MS);
  return Math.max(0, 2 - visits.length);
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
    (slug) =>
      gameWeeklyPlaysRemaining(stationId, slug, stationGameVisits) <= 0,
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
  return Math.max(0, 2 - visits.length);
}