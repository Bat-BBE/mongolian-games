const BUTTON_CLICK_SRC = "/sounds/button-click.wav";
const HAND_PUSH_SRC = "/sounds/hand_push.wav";

/**
 * public/sounds/-д `cairn-stone-tap.wav`, `wooden-dice-roll.mp3` гэх мэт
 * нэмсэн бол `tryPlaySfx` эхлүүлнэ, алгүй бол `fallback` ажиллана.
 */
const OPTIONAL_SFX = {
  cairnTap: "/sounds/cairn-stone-tap.wav",
  cairnShow: "/sounds/cairn-sequence-blink.wav",
  woodenDice: "/sounds/wooden-dice-roll.mp3",
} as const;

function playSrc(
  path: string,
  volume: number,
  options?: { playbackRate?: number },
) {
  if (typeof window === "undefined") return;
  const audio = new Audio(path);
  audio.volume = Math.min(1, Math.max(0, volume));
  if (options?.playbackRate != null) {
    audio.playbackRate = options.playbackRate;
  }
  void audio.play().catch(() => {});
}

function tryPlaySfx(
  which: keyof typeof OPTIONAL_SFX,
  volume: number,
  options: { playbackRate?: number },
  fallback: () => void,
) {
  if (typeof window === "undefined") return;
  const src = OPTIONAL_SFX[which];
  const a = new Audio();
  let settled = false;
  const once = () => {
    if (settled) return;
    settled = true;
    fallback();
  };
  a.addEventListener("error", once, { once: true });
  a.src = src;
  a.volume = Math.min(1, Math.max(0, volume));
  if (options.playbackRate != null) a.playbackRate = options.playbackRate;
  void a
    .play()
    .then(() => a.removeEventListener("error", once))
    .catch(once);
}

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

/** «Харагдах» үе — чимэг чулуунууд: жижиг, өндөр. Файл алгүй `button` өөрчлөгдөн. */
export function playCairnShowStoneBlink(volume = 0.11) {
  tryPlaySfx("cairnShow", volume, { playbackRate: 1.55 }, () =>
    playSrc(BUTTON_CLICK_SRC, Math.max(0.22, volume * 2), { playbackRate: 1.65 }),
  );
}

/** 1–5 дарах (овоглох) — `cairn-stone-tap.wav` эсвэл товчны дуутай ойролцоо. */
export function playCairnInputTap(volume = 0.4) {
  tryPlaySfx("cairnTap", volume, { playbackRate: 1.05 }, () => playButtonClick(0.38));
}

export function playCairnInputMiss(volume = 0.44) {
  playSrc(HAND_PUSH_SRC, volume, { playbackRate: 0.55 });
}

export function playCairnGameStart() {
  playButtonClick(0.36);
}

/** Модон 3D шоо гүйлгэх. Файл алгүй: hand_push, удаан. */
export function playWoodenDiceRoll(volume = 0.46) {
  tryPlaySfx("woodenDice", volume, { playbackRate: 1 }, () =>
    playSrc(HAND_PUSH_SRC, volume, { playbackRate: 0.75 }),
  );
}
