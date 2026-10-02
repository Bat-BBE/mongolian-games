export interface UrtuuStation {
  id: string;
  name: string;
  region?: string;
  /** Энэ өртөөнд холбогдсон бүх тоглоом — popup-д харуулна. */
  games?: { slug: string; name: string; desc: string; reward: string }[];
  gameSlug?: string;
  gameName: string;
  gameDesc: string;
  reward: string;
  available: boolean;
  /** position on the pseudo-3D map as % */
  pos: { left: string; top: string };
  /** is this the current player location? */
  isCurrent?: boolean;
  /** already completed? */
  isDone?: boolean;
  icon?: string;
  /** API/admin map marker image (resolved absolute URL) */
  imageUrl?: string;
  distance?: string;
  /** Өртөөний товч түүх (API quest_hint / quest_desc) */
  questHint?: string | null;
  questDesc?: string | null;
}

