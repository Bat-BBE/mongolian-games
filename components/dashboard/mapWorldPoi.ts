/**
 * 3D газрын дээрх өртөөнөөс тусдаа, жижиг «газрын сонин» цэгүүд
 * (ойртмолцоо картад богино мэдээлэл). wx/wz нь `stationWorldXZ`-тай ижил систем.
 */
export type MapWorldPoi = {
  id: string;
  /** Зураг/карт дээр сонгосон world өнцөг (mapConstants-тай нэг) */
  wx: number;
  wz: number;
  titleMn: string;
  titleEn: string;
  factMn: string;
  factEn: string;
  /** Зөвлөмж — 3D жижиг тэмдэгнүүд (emoji) */
  icon: string;
};

const MAP_WORLD_POI_LIST: MapWorldPoi[] = [
  {
    id: "tidbit_twohumped",
    wx: 62,
    wz: 48,
    icon: "🐪",
    titleMn: "Дэгдээхэй",
    titleEn: "Bactrian camels",
    factMn:
      "Монголд хоёр бөхт дэгдээхэй (тугын хүрэн) — хүйтэн, хуурайд зохицсон, өвлийн аялалд ч ачаа тээнэ.",
    factEn:
      "Bactrian (two-humped) camels are the cold, dry land specialists here — they’ve carried trade and gear across the steppe and desert for ages.",
  },
  {
    id: "tidbit_ger",
    wx: -92,
    wz: 75,
    icon: "⛺",
    titleMn: "Гэр — зөөвөр суурь",
    titleEn: "The ger, a movable home",
    factMn:
      "Дугуй гэр — салхинд агаар сэлгэлт сайтай, хөдлөхөд сурагтай, өвөл зуны ялгаанд тохируулсан нүүдэлчийн сууц.",
    factEn:
      "A ger is a round, felt-covered dwelling built to pack up and follow herds — the classic portable home of herding life on the open land.",
  },
  {
    id: "tidbit_morin_khuur",
    wx: 175,
    wz: 40,
    icon: "🎻",
    titleMn: "Морин хуур",
    titleEn: "The horsehead fiddle",
    factMn:
      "Морин толгойтой — модон хоолойг морины хол явдлыг санаагдуулсан, эх орны сүрчиг зэмсэг.",
    factEn:
      "The morin khuur’s carved scroll recalls a horse; its voice carries long, floating melodies in tradition and song.",
  },
  {
    id: "tidbit_orkhon_script",
    wx: -248,
    wz: -12,
    icon: "📜",
    titleMn: "Орхоны хөндий",
    titleEn: "The Orkhon valley",
    factMn:
      "Энэхүү хөндий нь нүүдлийн түүх, сүм хийд, олон эртний төвлөрөлтэй холбоотой — ЮНЕСКО-гийн нэгэн өв.",
    factEn:
      "The Orkhon valley is tied to long stretches of steppe power and monastic life — a UNESCO-recognized cultural landscape.",
  },
  {
    id: "tidbit_khovsgol",
    wx: -332,
    wz: -300,
    icon: "🧊",
    titleMn: "Хөвсгөл",
    titleEn: "Khövsgöl",
    factMn:
      "Номхон, гүн ус — дэлхийн эзэмшсэн цэнгэг усыг цөөн хувийг эзэлдэг, хүйтэн, цэнгэл усыг санаагдуулсан нуур.",
    factEn:
      "“Dark blue sea” in local speech — a deep, cold lake in the north, holding a big share of the planet’s unfrozen fresh surface water in one bowl.",
  },
  {
    id: "tidbit_gobi_rocks",
    wx: 90,
    wz: 300,
    icon: "🦕",
    titleMn: "Говийн нүд",
    titleEn: "Gobi & ancient life",
    factMn:
      "Өргөн элс, сунгалан — олон сая жилийн өмнөх амьтан, уулын баримт энд олддог, өөр ертөнцтэй дөхсөн нэг нутаг.",
    factEn:
      "The Gobi is more than empty sand — it’s a fossil and dinosaur-rich desert where dry wind shapes stone and story.",
  },
  {
    id: "tidbit_horse_culture",
    wx: 520,
    wz: -120,
    icon: "🏇",
    titleMn: "Морь",
    titleEn: "Horses in daily life",
    factMn:
      "Монголд морь — нүүдлийн нэг хэсэг, уралдаан, сургаал, уламжлалт ёсонд хамгийн ойр амьтад.",
    factEn:
      "Horses are woven into work, play, and ceremony — a living thread between family herds and the open range.",
  },
  {
    id: "tidbit_starry_steppe",
    wx: -380,
    wz: 200,
    icon: "🌌",
    titleMn: "Том тэнгэр",
    titleEn: "Open sky",
    factMn:
      "Хялбархан харанхуй, гэрлийн багасах зайтай — гэрийн нээсэн нүх, элсэн нутгаас одод илэрхийг харахад тохь тухтай нэг нөхцөл.",
    factEn:
      "Far from city glare, the steppe and desert nights are deep black fields — a natural dome for stargazing above the ger and trail.",
  },
];

export const MAP_WORLD_POIS: ReadonlyArray<MapWorldPoi> = MAP_WORLD_POI_LIST;

export function getMapWorldPoiById(
  id: string,
): MapWorldPoi | undefined {
  return MAP_WORLD_POI_LIST.find((p) => p.id === id);
}
