/** One-off: prints INSERT rows for map_stations — run: node scripts/gen-map-stations-sql.mjs */
const STATION_CONFIGS = {
  ulaanbaatar: { left: "55%", top: "45%", icon: "🏙️", wx: 0, wz: 0, region: "Богд Хан Ордон" },
  zuunmod: { left: "55%", top: "49%", icon: "🛕", wx: 0, wz: 80, region: "Манзушир Хийд" },
  terelj: { left: "59%", top: "41%", icon: "🦅", wx: 130, wz: -90, region: "Арьяабал Хийд" },
  nalaikh: { left: "58%", top: "46%", icon: "🪨", wx: 100, wz: -10, region: "Нялга Агуй" },
  kharakhorum: { left: "43%", top: "48%", icon: "🏛️", wx: -200, wz: 12, region: "Эрдэнэзуу Хийд" },
  arvaikheer: { left: "44%", top: "54%", icon: "🗿", wx: -188, wz: 130, region: "Цагаан Суварга" },
  orkhon_river: { left: "40%", top: "41%", icon: "🌊", wx: -238, wz: -90, region: "Орхоны Хөндий" },
  mandalgovi: { left: "57%", top: "63%", icon: "🕌", wx: 20, wz: 230, region: "Онгийн Хийд" },
  darkhan: { left: "51%", top: "33%", icon: "🐴", wx: -62, wz: -175, region: "Хустайн Нуруу" },
  erdenet: { left: "46%", top: "35%", icon: "🛕", wx: -150, wz: -150, region: "Амарбаясгалант Хийд" },
  sukhbaatar: { left: "52%", top: "27%", icon: "🏰", wx: -45, wz: -250, region: "Алтан Булаг" },
  moron: { left: "34%", top: "28%", icon: "🌊", wx: -350, wz: -238, region: "Дэлгэр Мөрөн" },
  khatgal: { left: "33%", top: "21%", icon: "🏞️", wx: -375, wz: -325, region: "Хөвсгөл Нуур" },
  uliastai: { left: "26%", top: "40%", icon: "🏔️", wx: -525, wz: -88, region: "Отгонтэнгэр Уул" },
  bayankhongor: { left: "35%", top: "58%", icon: "🦌", wx: -350, wz: 138, region: "Яхын Нуур" },
  altai: { left: "21%", top: "55%", icon: "⛰️", wx: -600, wz: 100, region: "Алтайн Нуруу" },
  khovd: { left: "12%", top: "48%", icon: "🦅", wx: -750, wz: 12, region: "Буянт Ухаа" },
  ulaangom: { left: "14%", top: "26%", icon: "🌊", wx: -712, wz: -263, region: "Увс Нуур" },
  ondorhaan: { left: "68%", top: "42%", icon: "⛰️", wx: 238, wz: -62, region: "Бурхан Халдун" },
  kherlenbayan: { left: "75%", top: "44%", icon: "🌾", wx: 362, wz: -38, region: "Аврага Тосгон" },
  choibalsan: { left: "85%", top: "40%", icon: "🐎", wx: 538, wz: -88, region: "Хэрлэн Тохой" },
  baruun_urt: { left: "76%", top: "53%", icon: "🏕️", wx: 388, wz: 75, region: "Дадал" },
  dalanzadgad: { left: "48%", top: "75%", icon: "🦖", wx: -112, wz: 350, region: "Хонгорын Элс" },
  sainshand: { left: "68%", top: "68%", icon: "🕌", wx: 238, wz: 263, region: "Хамарын Хийд" },
  zamiin_uud: { left: "72%", top: "78%", icon: "🪨", wx: 312, wz: 388, region: "Их Газрын Чулуу" },
};

const JOURNEY_ORDER = [
  "choibalsan",
  "kherlenbayan",
  "baruun_urt",
  "ondorhaan",
  "terelj",
  "nalaikh",
  "ulaanbaatar",
  "zuunmod",
  "mandalgovi",
  "sainshand",
  "zamiin_uud",
  "sukhbaatar",
  "darkhan",
  "erdenet",
  "kharakhorum",
  "orkhon_river",
  "arvaikheer",
  "moron",
  "khatgal",
  "bayankhongor",
  "uliastai",
  "dalanzadgad",
  "altai",
  "ulaangom",
  "khovd",
];

const EN_NAMES = {
  choibalsan: "Choibalsan",
  kherlenbayan: "Kherlenbayan",
  baruun_urt: "Baruun-Urt",
  ondorhaan: "Öndörkhaan",
  terelj: "Terelj",
  nalaikh: "Nalaikh",
  ulaanbaatar: "Ulaanbaatar",
  zuunmod: "Zuunmod",
  mandalgovi: "Mandalgovi",
  sainshand: "Sainshand",
  zamiin_uud: "Zamiin-Uud",
  sukhbaatar: "Sükhbaatar (city)",
  darkhan: "Darkhan",
  erdenet: "Erdenet",
  kharakhorum: "Karakorum",
  orkhon_river: "Orkhon Valley",
  arvaikheer: "Arvaikheer",
  moron: "Mörön",
  khatgal: "Khatgal",
  bayankhongor: "Bayankhongor",
  uliastai: "Uliastai",
  dalanzadgad: "Dalanzadgad",
  altai: "Altai",
  ulaangom: "Ulaangom",
  khovd: "Khovd",
};

function esc(s) {
  return s.replace(/'/g, "''");
}

const rows = [];
for (let i = 0; i < JOURNEY_ORDER.length; i++) {
  const slug = JOURNEY_ORDER[i];
  const c = STATION_CONFIGS[slug];
  if (!c) throw new Error(`Missing ${slug}`);
  const pos = JSON.stringify({ left: c.left, top: c.top, wx: c.wx, wz: c.wz });
  const nameEn = EN_NAMES[slug] || slug;
  const qhMn = `${c.region} — аяллын зорилт.`;
  const qhEn = `Objective near ${nameEn}.`;
  rows.push(
    `('${esc(slug)}', '${esc(c.region)}', '${esc(nameEn)}', '${esc(c.region)}', '${esc(nameEn)}', '${esc(c.icon)}', '${esc(pos)}'::jsonb, ${i}, '${esc(qhMn)}', '${esc(qhEn)}')`
  );
}

console.log(rows.join(",\n"));
