/**
 * Express API (server/). User sync uses /simple-sync — no Bearer token (demo / local only).
 */

export type ApiHealth = {
  ok: boolean;
  db: boolean;
  firebaseAdmin: boolean;
};

export type AppUserRow = {
  id: string;
  firebase_uid: string;
  email: string;
  display_name: string | null;
  hero_id: string | null;
  profile: Record<string, unknown> | null;
  progress: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export function getApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim();
  const base = raw || "http://localhost:4000";
  return base.replace(/\/$/, "");
}

export async function apiFetch(
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  const p = path.startsWith("/") ? path : `/${path}`;
  return fetch(`${getApiBaseUrl()}${p}`, init);
}

export async function getApiHealth(): Promise<ApiHealth> {
  const res = await apiFetch("/health");
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API health failed (${res.status}): ${text}`);
  }
  return res.json() as Promise<ApiHealth>;
}

/** Upsert user in PostgreSQL by email (no auth). */
export async function syncAppUserSimple(body: {
  email: string;
  displayName?: string;
  heroId?: string;
  profile?: Record<string, unknown>;
  progress?: Record<string, unknown>;
}): Promise<{ user: AppUserRow }> {
  const res = await apiFetch("/api/users/simple-sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    user?: AppUserRow;
  };
  if (!res.ok) {
    throw new Error(data.error ?? `simple-sync failed (${res.status})`);
  }
  if (!data.user) {
    throw new Error("simple-sync: missing user in response");
  }
  return { user: data.user };
}

/** Full game row for dashboard — PostgreSQL is source of truth when populated. */
export async function getGameProfileByEmail(
  email: string
): Promise<{ user: AppUserRow } | null> {
  const q = encodeURIComponent(email.trim());
  const res = await apiFetch(`/api/users/game-profile?email=${q}`);
  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    user?: AppUserRow;
  };
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(data.error ?? `game-profile failed (${res.status})`);
  }
  if (!data.user) {
    throw new Error("game-profile: missing user in response");
  }
  return { user: data.user };
}

/** Game catalog row (PostgreSQL `games` table). */
export type GameRow = {
  id: string;
  slug: string;
  name_mn: string;
  name_en: string;
  description_mn: string;
  description_en: string;
  image_url: string | null;
  is_available: boolean;
  show_on_home: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

/** Public list — no auth. */
export async function getGames(): Promise<{ games: GameRow[] }> {
  const res = await apiFetch("/api/games");
  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    games?: GameRow[];
  };
  if (!res.ok) {
    throw new Error(data.error ?? `games list failed (${res.status})`);
  }
  if (!data.games) {
    throw new Error("games: missing list");
  }
  return { games: data.games };
}

/** Өртөө бүр дээрх тоглоомын товч мэдээлэл (газрын зураг / popup). */
export type MapStationGamePreview = {
  slug: string;
  name: string;
  desc: string;
  reward: string;
};

export type MapStationApiRow = {
  id: string;
  name: string;
  region?: string;
  icon?: string;
  pos?: { left?: string; top?: string };
  available?: boolean;
  /** Бүх холбогдсон тоглоом (admin-аас). */
  games?: MapStationGamePreview[];
  /** Эхний тоглоом (хуучин клиентийн нийцлийн тулд). */
  game?: { slug?: string; name: string; desc: string; reward: string };
};

export type StationGameBundleRow = {
  id: string;
  slug: string;
  name_mn: string;
  name_en: string;
  description_mn: string;
  description_en: string;
  is_available: boolean;
  station_sort: number;
  reward_hint_mn: string;
  reward_hint_en: string;
};

export type DashboardBundle = {
  user: {
    id: string;
    email: string;
    display_name: string | null;
    hero_id: string | null;
    profile: Record<string, unknown>;
    progress: Record<string, unknown>;
    created_at: string;
  };
  hero: Record<string, unknown> | null;
  currentStation: Record<string, unknown> | null;
  stationGames: StationGameBundleRow[];
  strings: Record<string, string>;
  mapStations?: MapStationApiRow[];
  computed: {
    currentStationSlug?: string;
    journeyDay: number;
    questTitle: string;
    questDesc: string;
    bonusMultiplier: string;
    bonusTitle: string;
    tier: string;
    currentStationLabel: string;
    stationIndexOneBased: number;
    totalStations: number;
    displayHeroName: string;
    displayHeroTitle: string;
  };
};

export async function getDashboardBundle(
  email: string,
  lang: "mn" | "en"
): Promise<DashboardBundle> {
  const q = encodeURIComponent(email.trim());
  const res = await apiFetch(
    `/api/content/dashboard-bundle?email=${q}&lang=${lang}`
  );
  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
  } & Partial<DashboardBundle>;
  if (!res.ok) {
    throw new Error(data.error ?? `dashboard-bundle failed (${res.status})`);
  }
  if (!data.user || !data.computed) {
    throw new Error("dashboard-bundle: incomplete response");
  }
  if (!data.strings) {
    (data as DashboardBundle).strings = {};
  }
  const out = data as DashboardBundle;
  if (!out.stationGames) out.stationGames = [];
  return out;
}

export type LeaderboardEntry = {
  rank: number;
  name: string;
  xp: number;
  hero_id: string | null;
  meta?: {
    rawXp?: number;
    kp?: number;
    livestock?: unknown;
    ger?: unknown;
  };
};

export async function getLeaderboard(): Promise<{ entries: LeaderboardEntry[] }> {
  const res = await apiFetch("/api/leaderboard");
  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    entries?: LeaderboardEntry[];
  };
  if (!res.ok) {
    throw new Error(data.error ?? `leaderboard failed (${res.status})`);
  }
  if (!data.entries) throw new Error("leaderboard: missing entries");
  return { entries: data.entries };
}

export async function completeGame(body: {
  email: string;
  stationSlug: string;
  gameSlug: string;
  result: "win" | "lose";
  progressPct?: number;
}): Promise<{ user: AppUserRow }> {
  const res = await apiFetch("/api/game/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    user?: AppUserRow;
  };
  if (!res.ok) {
    throw new Error(data.error ?? `game complete failed (${res.status})`);
  }
  if (!data.user) throw new Error("game complete: missing user");
  return { user: data.user };
}

export async function homeUpgradeGer(body: {
  email: string;
}): Promise<{ user: AppUserRow }> {
  const res = await apiFetch("/api/game/home/upgrade", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    user?: AppUserRow;
  };
  if (!res.ok) throw new Error(data.error ?? `home upgrade failed (${res.status})`);
  if (!data.user) throw new Error("home upgrade: missing user");
  return { user: data.user };
}

export async function homeBuyLivestock(body: {
  email: string;
  kind: "sheep" | "horse" | "camel";
  qty: number;
}): Promise<{ user: AppUserRow }> {
  const res = await apiFetch("/api/game/home/buy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    user?: AppUserRow;
  };
  if (!res.ok) throw new Error(data.error ?? `home buy failed (${res.status})`);
  if (!data.user) throw new Error("home buy: missing user");
  return { user: data.user };
}

export type LinkedStationGameRow = {
  id: string;
  slug: string;
  name_mn: string;
  name_en: string;
  description_mn: string;
  description_en: string;
  is_available: boolean;
  sort_order: number;
  reward_hint_mn: string;
  reward_hint_en: string;
};

export type HeroRow = {
  id: string;
  slug: string;
  name_mn: string;
  name_en: string;
  title_mn: string;
  title_en: string;
  stats: Record<string, unknown>;
  color: string;
  emissive: string | null;
  image_url: string;
  model_path: string | null;
  bio_mn?: string | null;
  bio_en?: string | null;
  sort_order: number;
  is_available: boolean;
  created_at: string;
  updated_at: string;
};

/** Public — админ самбарын тоо хэмжээнд. */
export async function getContentHeroes(): Promise<{ heroes: HeroRow[] }> {
  const res = await apiFetch("/api/content/heroes");
  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    heroes?: HeroRow[];
  };
  if (!res.ok) {
    throw new Error(data.error ?? `content heroes failed (${res.status})`);
  }
  if (!data.heroes) throw new Error("content heroes: missing list");
  return { heroes: data.heroes };
}

// Backward compat for accidental misspelling in older code.
export const getContentHer24oes = getContentHeroes;

export type ContentStationListRow = {
  slug: string;
  name_mn: string;
  name_en: string;
  journey_index: number;
};

export async function getContentStations(): Promise<{
  stations: ContentStationListRow[];
}> {
  const res = await apiFetch("/api/content/stations");
  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    stations?: ContentStationListRow[];
  };
  if (!res.ok) {
    throw new Error(data.error ?? `content stations failed (${res.status})`);
  }
  if (!data.stations) throw new Error("content stations: missing list");
  return { stations: data.stations };
}

export type MapStationRow = {
  slug: string;
  name_mn: string;
  name_en: string;
  region_mn: string;
  region_en: string;
  icon: string;
  pos: Record<string, unknown>;
  journey_index: number;
  quest_hint_mn: string | null;
  quest_hint_en: string | null;
  quest_desc_mn?: string | null;
  quest_desc_en?: string | null;
  created_at: string;
  updated_at: string;
};

export type UiStringRow = {
  id: number;
  key: string;
  locale: string;
  value: string;
};

/** sessionStorage key — must match AdminAuthContext */
export const ADMIN_TOKEN_STORAGE_KEY = "mtga_admin_token";

export async function adminLogin(
  username: string,
  password: string
): Promise<{ token: string }> {
  const res = await apiFetch("/api/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    token?: string;
  };
  if (!res.ok) {
    throw new Error(data.error ?? `login failed (${res.status})`);
  }
  if (!data.token) throw new Error("missing token");
  return { token: data.token };
}

function adminBearerHeaders(token: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  } as const;
}

export async function adminListGames(token: string): Promise<{ games: GameRow[] }> {
  const res = await apiFetch("/api/admin/games", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    games?: GameRow[];
  };
  if (!res.ok) {
    throw new Error(data.error ?? `admin list failed (${res.status})`);
  }
  if (!data.games) throw new Error("missing games");
  return { games: data.games };
}

export async function adminListUsers(token: string): Promise<{ users: AppUserRow[] }> {
  const res = await apiFetch("/api/admin/users", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    users?: AppUserRow[];
  };
  if (!res.ok) {
    throw new Error(data.error ?? `admin users failed (${res.status})`);
  }
  if (!data.users) throw new Error("missing users");
  return { users: data.users };
}

export async function adminListUsersV2(
  token: string,
  opts?: { includeLocal?: boolean }
): Promise<{ users: AppUserRow[] }> {
  const q = opts?.includeLocal ? "?includeLocal=true" : "";
  const res = await apiFetch(`/api/admin/users${q}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    users?: AppUserRow[];
  };
  if (!res.ok) {
    throw new Error(data.error ?? `admin users failed (${res.status})`);
  }
  if (!data.users) throw new Error("missing users");
  return { users: data.users };
}

export async function adminGetTreasury(
  token: string,
): Promise<{
  summary: {
    users: number;
    kp_total: number;
    coins_total: number;
    gems_total: number;
    sheep_total: number;
    horse_total: number;
    camel_total: number;
    ger_level_avg: number;
  };
  top: Array<{
    id: string;
    display_name: string | null;
    email: string;
    hero_id: string | null;
    score: number;
    ger_level: number;
    kp: number;
    coins: number;
    gems: number;
    sheep: number;
    horse: number;
    camel: number;
    visited_stations: number;
  }>;
  users: Array<{
    id: string;
    display_name: string | null;
    email: string;
    hero_id: string | null;
    score: number;
    ger_level: number;
    kp: number;
    coins: number;
    gems: number;
    sheep: number;
    horse: number;
    camel: number;
    visited_stations: number;
  }>;
}> {
  const res = await apiFetch("/api/admin/treasury", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    summary?: unknown;
    top?: unknown;
    users?: unknown;
  };
  if (!res.ok) throw new Error(data.error ?? `admin treasury failed (${res.status})`);
  if (!data.summary || !data.top || !data.users) {
    throw new Error("admin treasury: incomplete response");
  }
  return data as any;
}

export async function adminCreateGame(
  token: string,
  body: Omit<GameRow, "id" | "created_at" | "updated_at">
): Promise<{ game: GameRow }> {
  const res = await apiFetch("/api/admin/games", {
    method: "POST",
    headers: adminBearerHeaders(token),
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    game?: GameRow;
  };
  if (!res.ok) throw new Error(data.error ?? `create failed (${res.status})`);
  if (!data.game) throw new Error("missing game");
  return { game: data.game };
}

export async function adminUpdateGame(
  token: string,
  id: string,
  body: Partial<
    Pick<
      GameRow,
      | "slug"
      | "name_mn"
      | "name_en"
      | "description_mn"
      | "description_en"
      | "image_url"
      | "is_available"
      | "show_on_home"
      | "sort_order"
    >
  >
): Promise<{ game: GameRow }> {
  const res = await apiFetch(`/api/admin/games/${id}`, {
    method: "PUT",
    headers: adminBearerHeaders(token),
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    game?: GameRow;
  };
  if (!res.ok) throw new Error(data.error ?? `update failed (${res.status})`);
  if (!data.game) throw new Error("missing game");
  return { game: data.game };
}

export async function adminDeleteGame(token: string, id: string): Promise<void> {
  const res = await apiFetch(`/api/admin/games/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? `delete failed (${res.status})`);
  }
}

export async function adminUploadGameImage(
  token: string,
  gameId: string,
  file: File,
): Promise<{ game: Pick<GameRow, "id" | "image_url"> }> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await apiFetch(`/api/admin/games/${encodeURIComponent(gameId)}/image`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: fd,
  });
  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    game?: { id: string; image_url: string | null };
  };
  if (!res.ok) throw new Error(data.error ?? `upload failed (${res.status})`);
  if (!data.game) throw new Error("upload: missing game");
  return { game: data.game };
}

export async function adminListHeroes(token: string): Promise<{ heroes: HeroRow[] }> {
  const res = await apiFetch("/api/admin/heroes", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    heroes?: HeroRow[];
  };
  if (!res.ok) throw new Error(data.error ?? `heroes list failed (${res.status})`);
  if (!data.heroes) throw new Error("missing heroes");
  return { heroes: data.heroes };
}

export async function adminUpdateHero(
  token: string,
  slug: string,
  body: Partial<
    Pick<
      HeroRow,
      | "name_mn"
      | "name_en"
      | "title_mn"
      | "title_en"
      | "stats"
      | "color"
      | "emissive"
      | "image_url"
      | "model_path"
      | "bio_mn"
      | "bio_en"
      | "sort_order"
      | "is_available"
    >
  >
): Promise<{ hero: HeroRow }> {
  const res = await apiFetch(`/api/admin/heroes/${encodeURIComponent(slug)}`, {
    method: "PUT",
    headers: adminBearerHeaders(token),
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    hero?: HeroRow;
  };
  if (!res.ok) throw new Error(data.error ?? `hero update failed (${res.status})`);
  if (!data.hero) throw new Error("missing hero");
  return { hero: data.hero };
}

export async function adminListStations(token: string): Promise<{
  stations: MapStationRow[];
}> {
  const res = await apiFetch("/api/admin/stations", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    stations?: MapStationRow[];
  };
  if (!res.ok) throw new Error(data.error ?? `stations failed (${res.status})`);
  if (!data.stations) throw new Error("missing stations");
  return { stations: data.stations };
}

export async function adminUpdateStation(
  token: string,
  slug: string,
  body: Partial<
    Pick<
      MapStationRow,
      | "name_mn"
      | "name_en"
      | "region_mn"
      | "region_en"
      | "icon"
      | "pos"
      | "journey_index"
      | "quest_hint_mn"
      | "quest_hint_en"
      | "quest_desc_mn"
      | "quest_desc_en"
    >
  >
): Promise<{ station: MapStationRow }> {
  const res = await apiFetch(`/api/admin/stations/${encodeURIComponent(slug)}`, {
    method: "PUT",
    headers: adminBearerHeaders(token),
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    station?: MapStationRow;
  };
  if (!res.ok) throw new Error(data.error ?? `station update failed (${res.status})`);
  if (!data.station) throw new Error("missing station");
  return { station: data.station };
}

export async function adminDeleteUser(token: string, userId: string): Promise<void> {
  const res = await apiFetch(`/api/admin/users/${encodeURIComponent(userId)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 204) return;
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) throw new Error(data.error ?? `user delete failed (${res.status})`);
}

export async function adminGetStationGames(
  token: string,
  stationSlug: string
): Promise<{ games: LinkedStationGameRow[] }> {
  const res = await apiFetch(
    `/api/admin/stations/${encodeURIComponent(stationSlug)}/games`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    games?: LinkedStationGameRow[];
  };
  if (!res.ok) throw new Error(data.error ?? `station games failed (${res.status})`);
  return { games: data.games ?? [] };
}

export async function adminPutStationGames(
  token: string,
  stationSlug: string,
  gameIds: string[]
): Promise<{ ok: boolean; games: { id: string; slug: string; name_mn: string; name_en: string; sort_order: number }[] }> {
  const res = await apiFetch(
    `/api/admin/stations/${encodeURIComponent(stationSlug)}/games`,
    {
      method: "PUT",
      headers: adminBearerHeaders(token),
      body: JSON.stringify({ gameIds }),
    }
  );
  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    ok?: boolean;
    games?: { id: string; slug: string; name_mn: string; name_en: string; sort_order: number }[];
  };
  if (!res.ok) throw new Error(data.error ?? `station games put failed (${res.status})`);
  return { ok: !!data.ok, games: data.games ?? [] };
}

export async function adminListUiStrings(
  token: string,
  locale?: "mn" | "en"
): Promise<{ strings: UiStringRow[] }> {
  const q = locale ? `?locale=${locale}` : "";
  const res = await apiFetch(`/api/admin/ui-strings${q}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    strings?: UiStringRow[];
  };
  if (!res.ok) throw new Error(data.error ?? `ui-strings failed (${res.status})`);
  if (!data.strings) throw new Error("missing strings");
  return { strings: data.strings };
}

export async function adminPutUiString(
  token: string,
  body: { key: string; locale: "mn" | "en"; value: string }
): Promise<{ string: UiStringRow }> {
  const res = await apiFetch("/api/admin/ui-strings", {
    method: "PUT",
    headers: adminBearerHeaders(token),
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    string?: UiStringRow;
  };
  if (!res.ok) throw new Error(data.error ?? `ui-string put failed (${res.status})`);
  if (!data.string) throw new Error("missing string");
  return { string: data.string };
}

export async function adminPatchUserDisplayName(
  token: string,
  userId: string,
  displayName: string
): Promise<{ user: AppUserRow }> {
  const res = await apiFetch(`/api/admin/users/${encodeURIComponent(userId)}`, {
    method: "PATCH",
    headers: adminBearerHeaders(token),
    body: JSON.stringify({ displayName }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    user?: AppUserRow;
  };
  if (!res.ok) throw new Error(data.error ?? `user patch failed (${res.status})`);
  if (!data.user) throw new Error("missing user");
  return { user: data.user };
}

export async function getAppUserByEmail(
  email: string
): Promise<{ user: AppUserRow }> {
  const q = encodeURIComponent(email.trim());
  const res = await apiFetch(`/api/users/simple-me?email=${q}`);
  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    user?: AppUserRow;
  };
  if (!res.ok) {
    throw new Error(data.error ?? `simple-me failed (${res.status})`);
  }
  if (!data.user) {
    throw new Error("simple-me: missing user in response");
  }
  return { user: data.user };
}
