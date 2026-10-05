/**
 * Mirrors SceneBuilder.buildStationGers()'s station-id → landmark-type dispatch
 * table exactly, so the baked .glb lands on the same stations the procedural
 * version did. Stations not listed here get only a standard ger camp.
 */
export const LANDMARK_BY_STATION: Record<string, string> = {
  // palace
  ulaanbaatar: "palace",
  // monastery
  zuunmod: "monastery",
  kharakhorum: "monastery",
  erdenet: "monastery",
  mandalgovi: "monastery",
  sainshand: "monastery",
  // mountain shrine
  uliastai: "mountain_shrine",
  altai: "mountain_shrine",
  ondorhaan: "mountain_shrine",
  moron: "mountain_shrine",
  // lake station
  khatgal: "lake_station",
  ulaangom: "lake_station",
  bayankhongor: "lake_station",
  // sand dunes
  dalanzadgad: "sand_dunes",
  // rock site
  nalaikh: "rock_site",
  zamiin_uud: "rock_site",
  // national park
  darkhan: "nat_park",
  terelj: "nat_park",
};

/** Stations whose unique landmark bake already includes its own ger-camp-style
 * layout (palace/monastery use layoutSacredSiteCamp, not the standard one). */
export const SACRED_SITE_STATIONS = new Set(["ulaanbaatar", "zuunmod", "kharakhorum", "erdenet", "mandalgovi", "sainshand"]);
