"use client";

import {
  GAME_CALLOUT_EMERALD_COMPACT,
  GAME_TEXT_BODY,
  GAME_TEXT_META,
  GAME_TEXT_SECTION_LABEL,
} from "./gameUiTheme";
import { WIN_LEVEL } from "./stoneCairnType";

export function StoneCairnRulesForModal({ isMn }: { isMn: boolean }) {
  const steps = isMn
    ? [
        {
          n: "1",
          t: "Харагдах",
          d: "Чулуунууд дараалан гялалзана — дарааллыг сана.",
        },
        {
          n: "2",
          t: "Оруулах",
          d: "1–5 товчийг яг тэр дарааллаар дар.",
        },
        {
          n: "3",
          t: "Алхам",
          d: "Зөв дарах бүрт нэг шинэ чулуу нэмэгдэнэ; нэг алдаа = тоглолт дуусна.",
        },
        {
          n: "4",
          t: "Ялалт",
          d: `${WIN_LEVEL} алхамын дарааллыг алдаагүй давбал ялна.`,
        },
      ]
    : [
        {
          n: "1",
          t: "Show",
          d: "Stones flash in order — memorize the sequence.",
        },
        {
          n: "2",
          t: "Input",
          d: "Tap buttons 1–5 in the same order.",
        },
        {
          n: "3",
          t: "Steps",
          d: "Each perfect round adds a new stone; one wrong tap ends the run.",
        },
        {
          n: "4",
          t: "Win",
          d: `Clear a ${WIN_LEVEL}-step sequence with no mistakes to win.`,
        },
      ];

  return (
    <div className="space-y-4">
      <div>
        <p className={`mb-2 ${GAME_TEXT_SECTION_LABEL} !text-[#c8a030]`}>
          {isMn ? "ХЭРХЭН ТОГЛОХ" : "HOW TO PLAY"}
        </p>
        <p className={GAME_TEXT_BODY}>
          {isMn
            ? "Таван чулуун дээрх дарааллыг давтах санах ойн тоглоом — эхлээд ажигла, дараа нь ижил дарааллаар дар."
            : "A memory game on five stones — watch the pattern, then replay it in order."}
        </p>
      </div>

      <div
        className="rounded-xl border border-sky-500/25 bg-sky-950/20 px-2.5 py-2 sm:px-3"
        role="img"
        aria-label={isMn ? "Үе: харагдах, оруулах" : "Phases: show, input"}
      >
        <p
          className={`${GAME_TEXT_SECTION_LABEL} text-center tracking-[0.12em] text-sky-200/85`}
        >
          {isMn ? "Үеийн урсгал" : "Round flow"}
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5 text-xs font-semibold text-sky-100/95 sm:text-[0.8125rem]">
          <span className="rounded-lg border border-sky-400/35 bg-sky-950/45 px-2 py-1 tabular-nums">
            {isMn ? "Харагдах" : "Show"}
          </span>
          <span className="text-sky-400/80" aria-hidden>
            →
          </span>
          <span className="rounded-lg border border-sky-400/35 bg-sky-950/45 px-2 py-1 tabular-nums">
            {isMn ? "Оруулах" : "Input"}
          </span>
          <span className="text-sky-400/80" aria-hidden>
            →
          </span>
          <span className="rounded-lg border border-sky-400/35 bg-sky-950/45 px-2 py-1 tabular-nums">
            {isMn ? "Дахин алхам" : "Next step"}
          </span>
        </div>
      </div>

      <ul className="space-y-2.5">
        {steps.map((r) => (
          <li
            key={r.n}
            className="flex gap-3 border-b border-white/5 pb-2 last:border-b-0 last:pb-0"
          >
            <span className="shrink-0 font-semibold text-amber-400/95">
              {r.n}
            </span>
            <div className="min-w-0">
              <div className="font-[family-name:var(--font-inter)] text-xs font-semibold text-zinc-200 sm:text-[0.8125rem]">
                {r.t}
              </div>
              <div className={`mt-0.5 ${GAME_TEXT_META}`}>{r.d}</div>
            </div>
          </li>
        ))}
      </ul>

      <p className={GAME_CALLOUT_EMERALD_COMPACT}>
        {isMn
          ? "Олон тоглогчийн горимд оноо, эзэн тал — тоглоомын самбар дээрх заавраар."
          : "In multiplayer, scoring and host side follow the in-game match panel."}
      </p>
    </div>
  );
}
