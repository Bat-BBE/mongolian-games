"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "@/components/AppContext";
import {
  MAX_ENERGY,
  makeInitialRoundState,
  POWER_SPECS,
  resolveRoundWithEffects,
  suggestMovesForSeat,
  WIN_SCORE,
  firstWinner,
  mulberry32,
  pickBotPower,
  powerLabel,
  type RoundState,
  type Seat4,
  type PowerId,
} from "./fourPowersType";
import { FourPowersHowItWorks } from "./fourPowersRulesUI";
import { useInventoryGrant } from "./useInventoryGrant";
import { STONE_ROUND_COINS } from "./gameRewardConstants";
import {
  GAME_TEXT_META,
  GAME_TEXT_MONO_META,
  GAME_TEXT_SECTION_LABEL,
} from "./gameUiTheme";

const ACCENT = ["#38bdf8", "#a3e635", "#fbbf24", "#f472b6"] as const;

export type FourPowersGameProps = {
  onComplete?: (result: "win" | "lose", progressPct?: number) => void;
};

export default function FourPowersGame({ onComplete }: FourPowersGameProps) {
  const { language } = useApp();
  const lang = language === "en" ? "en" : "mn";
  const { grant } = useInventoryGrant();

  const [state, setState] = useState<RoundState>(() => makeInitialRoundState());
  const [phase, setPhase] = useState<"pick" | "reveal">("pick");
  const [lastChoices, setLastChoices] = useState<Seat4 | null>(null);
  const [lastDelta, setLastDelta] = useState<Seat4 | null>(null);
  const [lastNotes, setLastNotes] = useState<string[]>([]);
  const [picked, setPicked] = useState<PowerId | null>(null);
  const [done, setDone] = useState(false);
  const [seed] = useState(() => Math.floor(Math.random() * 0x7fffffff));
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const rng = useMemo(() => mulberry32(seed), [seed]);

  const names = useMemo(
    () => [0, 1, 2, 3].map((i) => powerLabel(i, lang)),
    [lang],
  );

  const finish = useCallback(
    (won: boolean, finalScores: Seat4) => {
      setDone(true);
      if (won) grant({ coins: STONE_ROUND_COINS });
      const progressPct = Math.round(
        (finalScores[0] / Math.max(WIN_SCORE, 1)) * 100,
      );
      onComplete?.(won ? "win" : "lose", Math.min(100, progressPct));
    },
    [grant, onComplete],
  );

  const commit = useCallback(
    (humanPick: PowerId) => {
      if (phase !== "pick" || done) return;
      const current = stateRef.current;
      const choices: Seat4 = [
        humanPick,
        pickBotPower(rng, humanPick) as PowerId,
        pickBotPower(rng, humanPick) as PowerId,
        pickBotPower(rng, humanPick) as PowerId,
      ];
      const resolved = resolveRoundWithEffects(current, choices);
      const next = resolved.nextState;
      stateRef.current = next;
      setState(next);
      setPicked(humanPick);
      setLastChoices(resolved.appliedChoices);
      setLastDelta(resolved.deltas);
      setLastNotes(resolved.notes);
      setPhase("reveal");
      window.setTimeout(() => {
        const w = firstWinner(next.totals);
        if (w === 0) {
          finish(true, next.totals);
          return;
        }
        if (w > 0) {
          finish(false, next.totals);
          return;
        }
        setPhase("pick");
        setLastChoices(null);
        setLastDelta(null);
        setLastNotes([]);
        setPicked(null);
      }, 2000);
    },
    [done, finish, phase, rng],
  );

  const hints = useMemo(() => suggestMovesForSeat(state, 0), [state]);

  return (
    <div
      className="flex h-full min-h-0 w-full flex-col overflow-hidden px-2 pb-3 pt-1 sm:px-4"
      style={{
        background:
          "radial-gradient(circle at 50% 20%, #1a2332 0%, #0a0806 55%)",
        color: "rgba(255,255,255,0.92)",
      }}
    >
      <div className="shrink-0 text-center">
        <h2
          className="font-display text-base font-bold tracking-wide text-amber-100/95 sm:text-lg"
          style={{ textShadow: "0 0 20px rgba(200,160,48,0.25)" }}
        >
          {lang === "mn" ? "Дөрвөн эрхэ" : "Clash of Four Powers"}
        </h2>
        <div className="mt-1.5">
          <FourPowersHowItWorks lang={lang} variant="solo" />
        </div>
        <p className={`mt-1 ${GAME_TEXT_MONO_META}`}>
          {lang === "mn" ? "Өнгө" : "Round"} {state.round} ·{" "}
          {lang === "mn" ? "зорилго" : "goal"} {WIN_SCORE}
        </p>
      </div>

      <div className="mt-2 grid min-h-0 flex-1 grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        {names.map((n, i) => (
          <div
            key={i}
            className="flex min-h-0 flex-col rounded-xl border border-white/10 p-2 sm:p-3"
            style={{
              background: "rgba(12,10,8,0.85)",
              boxShadow:
                i === 0
                  ? "0 0 0 1px rgba(34,197,94,0.4), inset 0 0 20px rgba(34,197,94,0.08)"
                  : undefined,
            }}
          >
            <div
              className={`${GAME_TEXT_SECTION_LABEL} !font-bold tracking-wider`}
              style={{ color: ACCENT[i] }}
            >
              {i === 0
                ? lang === "mn"
                  ? "Та"
                  : "You"
                : `${lang === "mn" ? "Бот" : "Bot"} ${i}`}
            </div>
            <div className="mt-0.5 text-sm font-semibold leading-tight text-white">
              {n.name}
            </div>
            <div className={`line-clamp-2 ${GAME_TEXT_META} text-slate-500 flex items-center justify-between gap-2`}>
              <span>{n.sub}</span>
              <span className="rounded border border-white/15 px-1 text-[10px] text-slate-300">
                E{state.energy[i]}/{MAX_ENERGY}
              </span>
            </div>
            <div className="mt-auto pt-2 text-2xl font-bold tabular-nums text-amber-200">
              {state.totals[i]}
            </div>
            {lastDelta && (
              <div
                className="text-xs font-semibold"
                style={{
                  color: lastDelta[i] > 0 ? "#4ade80" : "rgba(255,255,255,0.2)",
                }}
              >
                {lastDelta[i] > 0 ? `+${lastDelta[i]}` : ""}
              </div>
            )}
          </div>
        ))}
      </div>

      <p className="mt-2 text-center text-xs text-zinc-300">
        {lang === "mn"
          ? `Санал: Шилдэг ${powerLabel(hints.best, lang).name} · Аюулгүй ${powerLabel(hints.safe, lang).name} · Эрсдэлтэй ${powerLabel(hints.risk, lang).name}`
          : `Hint: Best ${powerLabel(hints.best, lang).name} · Safe ${powerLabel(hints.safe, lang).name} · Risk ${powerLabel(hints.risk, lang).name}`}
      </p>

      {phase === "reveal" && lastChoices && (
        <p className="mt-2 text-center text-xs text-sky-200/90">
          {lang === "mn" ? "Сонголт:" : "Picks:"}{" "}
          {lastChoices.map((c) => powerLabel(c, lang).name).join(" · ")}
          {lastNotes.length > 0 ? ` · ${lastNotes.join(", ")}` : ""}
        </p>
      )}

      <div className="mt-3 flex min-h-0 flex-wrap justify-center gap-2">
        {phase === "pick" && !done
          ? [0, 1, 2, 3].map((i) => {
              const L = powerLabel(i, lang);
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => void commit(i as PowerId)}
                  className="min-h-[3rem] min-w-[5.5rem] rounded-lg border px-3 py-2 text-left text-sm font-semibold transition hover:brightness-110 sm:min-w-[6.5rem]"
                  style={{
                    borderColor: `${ACCENT[i]}55`,
                    background: `linear-gradient(145deg, ${ACCENT[i]}18, #0c0a08)`,
                    color: "#fff",
                    opacity: POWER_SPECS[i].cost > state.energy[0] ? 0.45 : 1,
                  }}
                >
                  <div>{L.name}</div>
                  <div className="text-[10px] text-zinc-300">Cost {POWER_SPECS[i].cost}</div>
                </button>
              );
            })
          : null}
      </div>
      {picked != null && phase === "reveal" ? (
        <p className="mt-1 text-center text-[11px] text-amber-200/80">
          {lang === "mn"
            ? `Таны сонголт: ${powerLabel(picked, lang).name}`
            : `You picked: ${powerLabel(picked, lang).name}`}
        </p>
      ) : null}
      {done && (
        <p className="mt-2 text-center text-sm text-amber-200/90">
          {lang === "mn" ? "Тоглоом дууссан." : "Match over."}
        </p>
      )}
    </div>
  );
}
