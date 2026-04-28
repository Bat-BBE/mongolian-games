/** Нийтлэг match-өрөө — тоглоом нээгдэхэд өрөө нээгдэн, энд л хүлээнэ. */
export const ONLINE_LOBBY_INTRO = {
  mn: "Өрөөнд олон хүнтэй хамт тоглож болно. Өөр хүн ирэхийг эндээс хүлээнэ — зөвхөн таных бол удалгүй автоматаар эхэлнэ (робот эсвэл solo).",
  en: "This is your online room — wait here for others to join. If you stay alone, the game will start on its own shortly (bots or solo, per game).",
} as const;

/** Газрын өртөө: нэвтэрсэн ч Postgres-т бүртэлгүй үед. */
export const LOBBY_POSTGRES_ACCOUNT_REQUIRED = {
  mn: "Олон тоглогчийн өрөө ашиглахын тулд нэвтэрч, профайлаа сервертэй уялдуулна уу (нүүрээс «Тоглох» биш — /home).",
  en: "To use the shared online room, sign in and sync your profile with the server (open games from /home, not the marketing page).",
} as const;

export type LobbyIntroLang = "mn" | "en";

export function getMatchLobbyIntroText(opts: {
  stationSlug: string;
  appUserInPostgres: boolean;
  authConfigured: boolean;
  lang: LobbyIntroLang;
}): string {
  /** Нүүр / freeplay: нэвтэрээгүй зочид — лобби тайлбар харуулахгүй. */
  if (opts.stationSlug === "freeplay") {
    return "";
  }
  if (!opts.authConfigured) {
    return opts.lang === "mn" ? ONLINE_LOBBY_INTRO.mn : ONLINE_LOBBY_INTRO.en;
  }
  if (opts.appUserInPostgres) {
    return opts.lang === "mn" ? ONLINE_LOBBY_INTRO.mn : ONLINE_LOBBY_INTRO.en;
  }
  return opts.lang === "mn"
    ? LOBBY_POSTGRES_ACCOUNT_REQUIRED.mn
    : LOBBY_POSTGRES_ACCOUNT_REQUIRED.en;
}
