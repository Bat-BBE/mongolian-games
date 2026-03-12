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

export const HORSE_COLORS = [
  0x6b3a1f, 0x3a2010, 0xc8a060,
  0x8a6030, 0x1a1008, 0xd4b890, 0xa06040,
];

export const TERRAIN_W   = 1800;
export const TERRAIN_D   = 1000;
export const TERRAIN_SEG = 360;