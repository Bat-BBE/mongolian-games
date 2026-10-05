/** Shared between ArcheryDuelHUD (writer, while charging) and ArcheryDuelScene
 * (reader, for the live bow-string pull animation) — mirrors the
 * heroKinematic ref pattern used for LocalHero/MapCameraRig. Not state: this
 * updates every animation frame while held, far above React re-render cadence. */
export type DuelDrawState = {
  power: number;
  angle: number;
  charging: boolean;
};

export function createDuelDrawState(): DuelDrawState {
  return { power: 0, angle: 0, charging: false };
}
