"use client";

import { fourBonesRulesStrings } from "./fourBonesRulesCopy";
import {
  GAME_TEXT_BODY,
  GAME_TEXT_META,
  GAME_TEXT_SECTION_LABEL,
} from "./gameUiTheme";

export function FourBonesRulesForModal({ isMn }: { isMn: boolean }) {
  const s = fourBonesRulesStrings(isMn ? "mn" : "en");
  return (
    <div className="space-y-4">
      <div>
        <p className={GAME_TEXT_BODY}>{s.intro}</p>
      </div>
      <ul className="space-y-2.5">
        {s.steps.map((r) => (
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
      <div>
        <p
          className={`mb-2 border-t border-white/10 pt-3 ${GAME_TEXT_SECTION_LABEL} !text-[#c8a030]`}
        >
          {s.scoringTitle}
        </p>
        <ul className="space-y-1.5 rounded-lg border border-white/10 bg-black/20 px-2 py-2">
          {s.scoringRows.map((row) => (
            <li
              key={row.label}
              className="flex items-center justify-between gap-2 text-xs leading-snug text-zinc-300 sm:text-[0.8125rem]"
            >
              <span className="min-w-0 flex-1 text-balance">{row.label}</span>
              <span className="shrink-0 font-bold text-amber-300">
                {row.pts}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
