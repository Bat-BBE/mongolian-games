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

let sfxCtx: AudioContext | null = null;
function getSfxCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!sfxCtx) {
    const Ctx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    sfxCtx = new Ctx();
  }
  if (sfxCtx.state === "suspended") {
    void sfxCtx.resume().catch(() => {});
  }
  return sfxCtx;
}

function playTone(
  freq: number,
  durationSec: number,
  gain = 0.05,
  type: OscillatorType = "sine",
  detune = 0,
) {
  const ctx = getSfxCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  osc.detune.setValueAtTime(detune, now);
  amp.gain.setValueAtTime(0.0001, now);
  amp.gain.exponentialRampToValueAtTime(Math.max(0.0001, gain), now + 0.015);
  amp.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);
  osc.connect(amp);
  amp.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + durationSec + 0.02);
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

export function playChatSendMicro(volume = 0.22) {
  playTone(860, 0.09, Math.max(0.02, volume * 0.11), "triangle");
  setTimeout(() => {
    playTone(1120, 0.07, Math.max(0.015, volume * 0.08), "triangle");
  }, 36);
}

export function playChatReceiveMicro(volume = 0.2) {
  playTone(740, 0.08, Math.max(0.02, volume * 0.1), "sine");
}

export function playStationApproachSfx(stationId: string, volume = 0.26) {
  const sid = stationId.trim().toLowerCase();
  const monastery = new Set(["zuunmod", "kharakhorum", "erdenet", "sainshand"]);
  const camel = new Set(["mandalgovi", "dalanzadgad", "zamiin_uud", "baruun_urt"]);
  const mountain = new Set(["uliastai", "altai", "moron", "ondorhaan"]);
  const horse = new Set(["terelj", "arvaikheer", "kherlenbayan", "choibalsan"]);

  if (sid === "ulaanbaatar") {
    playTone(440, 0.16, volume * 0.12, "triangle");
    setTimeout(() => playTone(660, 0.18, volume * 0.1, "triangle"), 72);
    return;
  }
  if (monastery.has(sid)) {
    playTone(520, 0.22, volume * 0.12, "sine");
    setTimeout(() => playTone(780, 0.2, volume * 0.08, "sine"), 110);
    return;
  }
  if (camel.has(sid)) {
    playTone(180, 0.14, volume * 0.11, "sawtooth");
    return;
  }
  if (mountain.has(sid)) {
    playTone(320, 0.12, volume * 0.1, "triangle");
    setTimeout(() => playTone(410, 0.1, volume * 0.08, "triangle"), 40);
    return;
  }
  if (horse.has(sid)) {
    playTone(260, 0.06, volume * 0.12, "square");
    setTimeout(() => playTone(220, 0.06, volume * 0.1, "square"), 70);
    return;
  }
  playTone(560, 0.1, volume * 0.09, "triangle");
}
