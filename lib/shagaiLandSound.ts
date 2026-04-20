/**
 * Шагай газарт буух үеийн SFX (`public/sounds/shagai-throw.mp3.wav`).
 * Нэг шидэлтэнд олон шагай дараалан буухад давхцалгүйн тулд debounce.
 */
const LAND_SOUND_SRC = "/sounds/shagai-throw.mp3.wav";

let lastLandAt = 0;
/** Олон шагай дараалан буухад давхцуулах — хэт урт байвал 2-р чимээ хоцорно. */
const DEBOUNCE_MS = 420;

const DEFAULT_PLAYBACK_RATE = 1;

export function playShagaiLandSound(
  volume = 0.48,
  playbackRate = DEFAULT_PLAYBACK_RATE,
) {
  if (typeof window === "undefined") return;
  const now = Date.now();
  if (now - lastLandAt < DEBOUNCE_MS) return;
  lastLandAt = now;

  const audio = new Audio(LAND_SOUND_SRC);
  audio.volume = Math.min(1, Math.max(0, volume));
  audio.playbackRate = playbackRate;
  void audio.play().catch(() => {});
}
