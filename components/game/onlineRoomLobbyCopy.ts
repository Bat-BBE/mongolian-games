export const ONLINE_LOBBY_INTRO = {
  mn: "Өрөөнд олон хүнтэй хамт тоглож болно. Өөр хүн ирэхийг эндээс хүлээнэ — зөвхөн та бол удахгүй автоматаар эхэлнэ (робот эсвэл ганцаараа).",
  en: "This is your online room — wait here for others to join. If you stay alone, the game will start on its own shortly (bots or solo, per game).",
} as const;

export const LOBBY_POSTGRES_ACCOUNT_REQUIRED = {
  mn: "Олон тоглогчтой холбогдож тоголохын тулд нэвтэрнэ үү.",
  en: "To use the shared online room sign in.",
} as const;

export type LobbyIntroLang = "mn" | "en";

export function getMatchLobbyIntroText(opts: {
  stationSlug: string;
  appUserInPostgres: boolean;
  authConfigured: boolean;
  lang: LobbyIntroLang;
}): string {
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
