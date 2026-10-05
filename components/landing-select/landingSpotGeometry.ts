import {
  STATION_CONFIGS,
  TERRAIN_W,
  TERRAIN_D,
  stationWorldXZ,
  isPlayerHomeClearOfStations,
} from "@/components/dashboard/mapConstants";

export type WorldPoint = { x: number; z: number };
/** Normalized screen-space point, 0..1 in both axes (origin top-left). */
export type NormPoint = { u: number; v: number };

/** Small inset so a chosen edge point never lands exactly on the terrain clamp boundary
 * LocalHero/useThreeScene use (±5600/±4700) — keep the pickable area comfortably inside it. */
const PICK_MARGIN = 400;
const PICK_HALF_W = TERRAIN_W / 2 - PICK_MARGIN;
const PICK_HALF_D = TERRAIN_D / 2 - PICK_MARGIN;

export function worldToNorm({ x, z }: WorldPoint): NormPoint {
  return {
    u: (x + TERRAIN_W / 2) / TERRAIN_W,
    v: (z + TERRAIN_D / 2) / TERRAIN_D,
  };
}

export function normToWorld({ u, v }: NormPoint): WorldPoint {
  return {
    x: u * TERRAIN_W - TERRAIN_W / 2,
    z: v * TERRAIN_D - TERRAIN_D / 2,
  };
}

/** Clamps a candidate world point to the pickable area (inset from the hard terrain edge). */
export function clampToPickableArea({ x, z }: WorldPoint): WorldPoint {
  return {
    x: Math.max(-PICK_HALF_W, Math.min(PICK_HALF_W, x)),
    z: Math.max(-PICK_HALF_D, Math.min(PICK_HALF_D, z)),
  };
}

/** Same 112-unit clearance `playerHomeWorldAnchor` enforces around home-ger placement —
 * reused here so a chosen landing point never drops a player inside a station's building cluster. */
export function isLandingSpotValid(pt: WorldPoint): boolean {
  return isPlayerHomeClearOfStations(pt.x, pt.z);
}

export type StationMarker = { id: string; icon: string; norm: NormPoint };

export function listStationMarkers(): StationMarker[] {
  return Object.entries(STATION_CONFIGS).map(([id, cfg]) => ({
    id,
    icon: cfg.icon,
    norm: worldToNorm(stationWorldXZ(cfg.wx, cfg.wz)),
  }));
}
