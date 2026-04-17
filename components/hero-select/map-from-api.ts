import type { HeroRow } from "@/lib/api";
import { getApiBaseUrl } from "@/lib/api";
import { HEROES, type Hero } from "./hero-data";
function readStats(raw: unknown): { wisdom: number; strength: number; speed: number } | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const n = (k: string) => {
    const v = o[k];
    return typeof v === "number" ? v : Number(v);
  };
  if (!Number.isFinite(n("wisdom"))) return null;
  return {
    wisdom: n("wisdom"),
    strength: n("strength"),
    speed: n("speed"),
  };
}

/** API-аас ирсэн баатруудыг локал fallback-тай нэгтгэнэ (slug = HeroId). */
export function mergeHeroesFromApi(rows: HeroRow[] | null | undefined): Hero[] {
  const safe = Array.isArray(rows) ? rows : [];
  const bySlug = new Map(safe.map((r) => [r.slug, r]));
  const out: Hero[] = [];
  const apiBase = getApiBaseUrl();

  for (const fb of HEROES) {
    const row = bySlug.get(fb.id);
    if (!row) {
      out.push(fb);
      continue;
    }
    const st = readStats(row.stats) ?? fb.stats;
    const rawImg = row.image_url?.trim() ? row.image_url.trim() : "";
    const img =
      rawImg && rawImg.startsWith("/")
        ? `${apiBase}${rawImg}`
        : rawImg || fb.imageUrl;
    out.push({
      id: fb.id,
      name: row.name_mn,
      title: row.title_mn,
      nameMn: row.name_mn,
      nameEn: row.name_en,
      titleMn: row.title_mn,
      titleEn: row.title_en,
      imageUrl: img,
      modelPath: row.model_path?.trim() ? row.model_path : fb.modelPath,
      available: row.is_available,
      color: row.color?.trim() ? row.color : fb.color,
      emissive: row.emissive?.trim() ? row.emissive : fb.emissive,
      stats: st,
      bioMn: row.bio_mn?.trim() ?? "",
      bioEn: row.bio_en?.trim() ?? "",
    });
  }

  return out;
}
