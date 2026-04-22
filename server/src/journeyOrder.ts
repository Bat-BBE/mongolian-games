/**
 * Keep in sync with `components/dashboard/mapConstants.ts` → `JOURNEY_ORDER`.
 * Used for journey totals in the content bundle (independent of extra map pins in DB).
 */
export const JOURNEY_ORDER_SLUGS = [
  "choibalsan",
  "kherlenbayan",
  "ondorhaan",
  "terelj",
  "nalaikh",
  "ulaanbaatar",
  "zuunmod",
  "mandalgovi",
  "darkhan",
  "erdenet",
  "kharakhorum",
  "moron",
  "khatgal",
  "altai",
  "khovd",
] as const;

export const JOURNEY_STATION_COUNT = JOURNEY_ORDER_SLUGS.length;
