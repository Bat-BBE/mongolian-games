"use client";

import {
  MAX_ENERGY,
  POWER_SPECS,
  ROUND_REGEN,
  WIN_SCORE,
} from "./fourPowersType";
import {
  GAME_TEXT_BODY,
  GAME_TEXT_META,
  GAME_TEXT_SECTION_LABEL,
} from "./gameUiTheme";

const ACCENT = ["#38bdf8", "#a3e635", "#fbbf24", "#f472b6"] as const;

type Lang = "mn" | "en";

type Props = {
  lang: Lang;
  variant: "solo" | "online";
  /** `compact` — зөвхөн тоглоомын панел дээр; бүрэн дүрэм «?» модалд */
  density?: "full" | "compact";
};

export function FourPowersHowItWorks({
  lang,
  variant,
  density = "full",
}: Props) {
  const isMn = lang === "mn";
  const names = isMn
    ? (["Морь", "Тэмээ", "Үхэр", "Хонь"] as const)
    : (["Horse", "Camel", "Ox", "Sheep"] as const);

  const modeShort =
    variant === "solo"
      ? isMn
        ? "Ганцаараа: та + 3 робот."
        : "Solo: you + 3 bots."
      : isMn
        ? "Өрөө: 2–4 хүн, суудал дутвал робот."
        : "Room: 2–4 humans; bots fill empty seats.";

  const coreMn = [
    "Бүх суудал нэгэн зэрэг нэг эрхэ сонгоно. Доорх циклын дагуу хэнийг дийлснэ, тэр хэмжээгээрээ +1 оноо (хоёр хүнийг дийлбэл +2).",
    `Энерги хүрэхгүй сонголт автоматаар хямд эрхэ рүү бууна. ${modeShort} Эхний ганцаархан ${WIN_SCORE} оноо — ялалт (тэнцвэл үргэлжилнэ).`,
  ] as const;

  const coreEn = [
    "Everyone picks one power at the same time. For each opponent your pick beats in the cycle below, you score +1 (beat two → +2).",
    `Can't afford your pick? It falls back to a cheaper one. ${modeShort} First sole leader at ${WIN_SCORE} wins (ties keep going).`,
  ] as const;

  const core = isMn ? coreMn : coreEn;

  const fxTitle = isMn ? "Энерги · нэмэлт" : "Energy · extras";
  const fxLead = isMn
    ? `Раунд бүрт +${ROUND_REGEN} энерги (хамгийн их ${MAX_ENERGY}). Тоо — сонголтонд зарцуулах энерги.`
    : `+${ROUND_REGEN} energy each round (max ${MAX_ENERGY}). The number is what each pick spends.`;

  const fxGameplay = isMn
    ? [
        "Ялсан бол нэмэлт +1 оноо.",
        "Ялсан бол дараагийн суудал −1 энерги.",
        "Оноо авсан бол соролтоос хамгаална.",
        "Энэ раунд +1 энерги.",
      ]
    : [
        "If you score: +1 pt.",
        "If you score: next seat −1 energy.",
        "If you score: blocks drain.",
        "This round: +1 energy.",
      ];

  if (density === "compact") {
    const cycleHint = `${names[0]} → ${names[1]} → ${names[2]} → ${names[3]} → ↺`;
    const panelBlurb =
      variant === "solo"
        ? isMn
          ? `Зэрэг сонгоно · циклын дагуу дийлснээр +1 · зорилго ${WIN_SCORE}. Энерги, зардал — дээд «?». ${modeShort}`
          : `Pick together · +1 per opponent you beat in the cycle · goal ${WIN_SCORE}. Energy & costs: tap “?”. ${modeShort}`
        : isMn
          ? `Зэрэг сонгоно · дийлснээр +1 · зорилго ${WIN_SCORE}. Энерги, зардал — «?». ${modeShort}`
          : `Pick together · +1 per beat in the cycle · goal ${WIN_SCORE}. Energy & costs: “?”. ${modeShort}`;

    return (
      <div className="mx-auto max-w-lg space-y-1 px-1 text-center">
        <p
          className={`text-balance ${GAME_TEXT_META} leading-snug text-zinc-400 sm:text-xs`}
        >
          {panelBlurb}
        </p>
        <p
          className="font-[family-name:var(--font-inter)] text-[0.625rem] font-medium tracking-tight text-zinc-500 sm:text-[0.6875rem]"
          aria-label={
            isMn
              ? "Морь тэмээг, тэмээ үхрийг, үхэр хонийг, хонь морийг дийлнэ"
              : "Horse beats camel, camel ox, ox sheep, sheep horse"
          }
        >
          {cycleHint}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-lg space-y-3 text-left">
      <div className="space-y-2 text-center">
        <p className={`text-balance ${GAME_TEXT_BODY} text-zinc-200/95`}>
          {core[0]}
        </p>
        <p className={`text-balance ${GAME_TEXT_META} text-zinc-400`}>
          {core[1]}
        </p>
      </div>

      <div
        className="rounded-xl border border-amber-500/20 bg-black/35 px-2 py-2 sm:px-3"
        role="img"
        aria-label={
          isMn
            ? "Морь тэмээг, тэмээ үхрийг, үхэр хонийг, хонь морийг дийлнэ"
            : "Horse beats camel, camel ox, ox sheep, sheep horse"
        }
      >
        <p
          className={`${GAME_TEXT_SECTION_LABEL} text-center tracking-[0.12em] text-amber-200/80`}
        >
          {isMn ? "Хэн хэнийгээ дийлдэг" : "Who beats whom"}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center justify-center gap-y-1 text-xs font-semibold text-zinc-100 sm:text-[0.8125rem]">
          {names.map((label, i) => (
            <span key={label} className="inline-flex items-center">
              <span
                className="rounded-md border px-1.5 py-0.5 sm:px-2 sm:py-1"
                style={{
                  borderColor: `${ACCENT[i]}66`,
                  background: `linear-gradient(160deg, ${ACCENT[i]}22, rgba(8,6,4,0.9))`,
                  color: "rgba(255,255,255,0.95)",
                  boxShadow: `inset 0 0 12px ${ACCENT[i]}14`,
                }}
              >
                {label}
              </span>
              <span className="mx-0.5 text-amber-400/85 sm:mx-1" aria-hidden>
                →
              </span>
            </span>
          ))}
          <span
            className="inline-flex items-center rounded-md border border-amber-500/35 bg-amber-950/40 px-1.5 py-0.5 font-[family-name:var(--font-inter)] text-xs font-bold text-amber-200/90 sm:text-[0.8125rem]"
            title={isMn ? "Дахин мориноос эхэлнэ" : "Loops back to Horse"}
          >
            ↺ {names[0]}
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-600/30 bg-zinc-950/50 px-2.5 py-2 sm:px-3">
        <p
          className={`${GAME_TEXT_SECTION_LABEL} text-center tracking-[0.12em] text-zinc-400`}
        >
          {fxTitle}
        </p>
        <p
          className={`mt-1.5 text-center text-balance ${GAME_TEXT_META} text-zinc-500`}
        >
          {fxLead}
        </p>
        <ul className="mt-2.5 space-y-1.5">
          {POWER_SPECS.map((spec, i) => (
            <li
              key={spec.id}
              className="flex flex-col gap-0.5 rounded-lg border border-white/[0.07] bg-black/35 px-2 py-1.5 sm:flex-row sm:items-center sm:gap-2"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="inline-flex min-w-[3.5rem] justify-center rounded-md border px-2 py-0.5 text-xs font-semibold text-zinc-100 sm:min-w-[4.25rem] sm:text-[0.8125rem]"
                  style={{
                    borderColor: `${ACCENT[i]}55`,
                    background: `linear-gradient(165deg, ${ACCENT[i]}20, rgba(0,0,0,0.4))`,
                  }}
                >
                  {isMn ? spec.nameMn : spec.nameEn}
                </span>
                <span
                  className="inline-flex h-6 min-w-[1.75rem] items-center justify-center rounded-md bg-amber-950/55 px-1.5 font-mono text-xs font-bold tabular-nums text-amber-200/95"
                  title={isMn ? "Зардал" : "Cost"}
                >
                  {spec.cost}
                </span>
                <span
                  className={`hidden sm:inline ${GAME_TEXT_META} !text-zinc-500`}
                  aria-hidden
                >
                  ·
                </span>
                <span
                  className={`text-[0.6875rem] italic leading-snug text-zinc-500 sm:text-xs`}
                >
                  {isMn ? spec.subMn : spec.subEn}
                </span>
              </div>
              <p
                className={`sm:ml-auto sm:max-w-[55%] sm:text-right ${GAME_TEXT_BODY} !text-[0.6875rem] leading-snug text-zinc-300/95 sm:!text-xs`}
              >
                {fxGameplay[i]}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
