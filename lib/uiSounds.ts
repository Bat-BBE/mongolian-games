const BUTTON_CLICK_SRC = "/sounds/button-click.wav";
const HAND_PUSH_SRC = "/sounds/hand_push.wav";

export function playButtonClick(volume = 0.42) {
  if (typeof window === "undefined") return;
  const audio = new Audio(BUTTON_CLICK_SRC);
  audio.volume = Math.min(1, Math.max(0, volume));
  void audio.play().catch(() => {});
}

/** Чулуу атгах зэрэг «гараар» үйлдэл (StoneGame pick гэх мэт). */
export function playHandPush(volume = 0.44) {
  if (typeof window === "undefined") return;
  const audio = new Audio(HAND_PUSH_SRC);
  audio.volume = Math.min(1, Math.max(0, volume));
  void audio.play().catch(() => {});
}
