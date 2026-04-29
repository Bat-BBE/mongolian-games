"use client";

import type { CSSProperties } from "react";
import { useApp } from "@/components/AppContext";
import type { ShagaiSide } from "./shagai";
import { SHAgAI_SIDES } from "./shagai";
import type {
  Berkh12Mode,
  Berkh12Phase,
  Berkh12TransferSummary,
  LocalPlayerCount,
} from "./shagaiBerkh12Type";
import {
  SHAGAI_GAME_PANEL_BASE,
  gamePanelLeftDesktop,
  gamePanelPlayNarrowBottom,
} from "./gamePanelLayout";
import { useGameUiNarrow } from "./useGameUiNarrow";
import {
  GAME_CALLOUT_AMBER,
  GAME_CALLOUT_ERROR,
  GAME_CTA_PRIMARY,
  GAME_CTA_SECONDARY,
  GAME_TEXT_BODY,
  GAME_TEXT_LEAD,
  GAME_TEXT_META,
} from "./gameUiTheme";

type Props = {
  phase: Berkh12Phase;
  mode: Berkh12Mode;
  playerCount: LocalPlayerCount;
  turn: number;
  mories: number[];
  active: boolean[];
  canThrow: boolean;
  onThrow: () => void;
  onReset: () => void;
  onModeChange: (m: Berkh12Mode) => void;
  onPlayerCountChange: (c: LocalPlayerCount) => void;
  lastSides: (ShagaiSide | null)[];
  lastHorses: number;
  lastCamels: number;
  lastTransfer?: Berkh12TransferSummary | null;
  showElimToast?: string | null;
  winner: number | null;
  nameLabels: string[];
  /** Харагчийн суудал (онлайн/роботод win/lose ялгах). */
  mySeat?: number | null;
  lockMode?: boolean;
  hideModeToggle?: boolean;
};

export default function ShagaiBerkh12UI({
  phase,
  mode,
  playerCount,
  turn,
  mories,
  active,
  canThrow,
  onThrow,
  onReset,
  onModeChange,
  onPlayerCountChange,
  lastSides,
  lastHorses,
  lastCamels,
  lastTransfer = null,
  showElimToast,
  winner,
  nameLabels,
  mySeat = null,
  lockMode = false,
  hideModeToggle = false,
}: Props) {
  const { language } = useApp();
  const isEn = language === "en";
  const narrowUi = useGameUiNarrow();

  const t = {
    r7online: isEn
      ? "Online: Seat order in the list = play order."
      : "Онлайн: жагсаалтын дараалал = тоглох дараалал.",
    throw: isEn ? "Throw" : "Орхих",
    yourTurn: isEn ? "Your turn" : "Таны ээлж",
    p: isEn ? "P" : "Т",
    reset: isEn ? "Again" : "Дахин",
    wait: isEn ? "Not your turn" : "Таны ээлж биш",
    over: isEn ? "Winner" : "Хожигч",
    out: isEn ? "Out" : "Хасагдсан",
    local: isEn ? "2–4 local" : "2–4 нэг дэлгэц",
    cpu: isEn ? "vs computer" : "Роботтой",
    youWin: isEn ? "You won!" : "Та яллаа!",
    youLose: isEn ? "You lost." : "Та ялагдлаа.",
    winHint: isEn ? "Great throw flow. Press Again for rematch." : "Сайхан тоглолт боллоо. Дахин дарж ахин тоглоорой.",
    loseHint: isEn ? "No worries, try again and take the chain." : "Зүгээр ээ, дахиад үзээд гинжийг аваарай.",
  };

  const winnerLabel = winner != null ? (nameLabels[winner] ?? `${t.p}${winner + 1}`) : "";
  const showFinalMessage = phase === "matchOver" && winner != null;
  const myResult =
    showFinalMessage && mySeat != null
      ? winner === mySeat
        ? "win"
        : "lose"
      : null;

  const mainChrome = narrowUi
    ? { ...SHAGAI_GAME_PANEL_BASE, ...gamePanelPlayNarrowBottom() }
    : { ...SHAGAI_GAME_PANEL_BASE, ...gamePanelLeftDesktop(300) };
  const mainPad: CSSProperties = narrowUi
    ? { padding: "10px 12px 12px" }
    : { padding: "16px" };
  const ringSeats = Array.from({ length: playerCount }, (_, i) => i);

  const playBlock = (
    <>
      {showElimToast ? (
        <p className={GAME_CALLOUT_ERROR}>{showElimToast}</p>
      ) : null}
      {(lockMode || !hideModeToggle) && (
        <div className="mb-1 flex flex-wrap items-center justify-end gap-2">
          {lockMode ? (
            <p className={`${GAME_CALLOUT_AMBER} w-full text-center sm:text-left`}>
              {t.r7online}
            </p>
          ) : null}
          {!lockMode && !hideModeToggle ? (
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-300">
              <button
                type="button"
                className={`rounded border px-1.5 py-0.5 ${
                  mode === "local"
                    ? "border-amber-500/50 bg-amber-950/60"
                    : "border-zinc-600"
                }`}
                onClick={() => onModeChange("local")}
              >
                {t.local}
              </button>
              <button
                type="button"
                className={`rounded border px-1.5 py-0.5 ${
                  mode === "vsCpu"
                    ? "border-amber-500/50 bg-amber-950/60"
                    : "border-zinc-600"
                }`}
                onClick={() => onModeChange("vsCpu")}
              >
                {t.cpu}
              </button>
            </div>
          ) : null}
        </div>
      )}

      <div className="mt-1.5 grid grid-cols-1 gap-1.5 rounded-lg border border-zinc-700/70 bg-zinc-950/55 px-2.5 py-2 text-xs text-zinc-200 sm:grid-cols-2">
        <p className="flex items-center gap-1.5">
          <span className="text-amber-300">🐴</span>
          <span>
            {isEn ? "Take from previous seat" : "Өмнөх хүнээсээ авна"}
          </span>
          <span className="font-semibold text-amber-200">←</span>
        </p>
        <p className="flex items-center gap-1.5">
          <span className="text-orange-300">🐫</span>
          <span>{isEn ? "Give to next seat" : "Дараагийн хүнд өгнө"}</span>
          <span className="font-semibold text-orange-200">→</span>
        </p>
      </div>

      <div className="mt-1.5 rounded-xl border border-amber-500/25 bg-gradient-to-b from-amber-950/20 to-zinc-950/35 px-2.5 py-2">
        <p className={`${GAME_TEXT_META} text-center`}>
          {isEn ? "Seat flow diagram" : "Тоглогчдын тойрог"}
        </p>
        <div className="mt-1.5 flex items-center justify-center gap-1.5 sm:gap-2">
          {ringSeats.map((seat, idx) => {
            const current = seat === turn && active[seat];
            return (
              <div
                key={`seat-${seat}`}
                className="flex items-center gap-1.5 sm:gap-2"
              >
                <div
                  className={`relative flex h-8 min-w-8 items-center justify-center rounded-full border px-2 text-[11px] font-semibold transition ${
                    current
                      ? "border-emerald-400/70 bg-emerald-600/25 text-emerald-100 shadow-[0_0_12px_rgba(16,185,129,0.35)]"
                      : !active[seat]
                        ? "border-zinc-700/70 bg-zinc-900/45 text-zinc-500"
                        : "border-amber-500/40 bg-amber-900/25 text-amber-100"
                  }`}
                >
                  {nameLabels[seat] ?? `${t.p}${seat + 1}`}
                  {current ? (
                    <span className="absolute -top-1 -right-1 inline-flex h-2.5 w-2.5 rounded-full bg-emerald-300 animate-pulse" />
                  ) : null}
                </div>
                {idx < ringSeats.length - 1 ? (
                  <span className="text-amber-300/85 text-sm animate-[pulse_2.2s_ease-in-out_infinite]">
                    →
                  </span>
                ) : (
                  <span className="text-amber-300/70 text-sm animate-[pulse_2.2s_ease-in-out_infinite]">
                    ↺
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {!lockMode && !hideModeToggle && mode === "local" ? (
        <div className={`mt-1.5 flex flex-wrap gap-1.5 ${GAME_TEXT_BODY}`}>
          <span className="text-zinc-500">{isEn ? "Players" : "Тоглогч"}:</span>
          {([2, 3, 4] as const).map((c) => (
            <button
              key={c}
              type="button"
              disabled={!(phase === "idle" || phase === "result")}
              onClick={() => onPlayerCountChange(c)}
              className={`rounded border px-1.5 font-bold ${
                playerCount === c
                  ? "border-amber-400/70 bg-amber-950/60"
                  : "border-zinc-600"
              } ${!(phase === "idle" || phase === "result") ? "opacity-40" : ""}`}
            >
              {c}
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-2 flex flex-wrap items-end justify-end gap-2">
        <div className="grid w-full max-w-none grid-cols-2 gap-1.5 sm:grid-cols-4">
          {mories.slice(0, playerCount).map((m, i) => {
            return (
              <div
                key={i}
                className={`rounded border px-2 py-0.5 text-right text-sm ${
                  i === turn && active[i]
                    ? "border-emerald-500/50 bg-emerald-950/25"
                    : "border-zinc-700/80"
                } ${!active[i] ? "opacity-45" : ""}`}
              >
                <div className={`${GAME_TEXT_META} uppercase`}>
                  {nameLabels[i] ?? `${t.p}${i + 1}`}
                  {!active[i] ? ` · ${t.out}` : ""}
                </div>
                <span className="text-lg font-bold text-amber-200">{m}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        {showFinalMessage ? (
          <div
            className={`w-full rounded-xl border px-3 py-2 text-center ${
              myResult === "win"
                ? "border-emerald-400/45 bg-emerald-950/35"
                : myResult === "lose"
                  ? "border-rose-400/45 bg-rose-950/30"
                  : "border-amber-400/35 bg-amber-950/25"
            }`}
          >
            <p
              className={`${GAME_TEXT_LEAD} ${
                myResult === "win"
                  ? "text-emerald-200"
                  : myResult === "lose"
                    ? "text-rose-200"
                    : "text-amber-100"
              }`}
            >
              {myResult === "win"
                ? `🎉 ${t.youWin}`
                : myResult === "lose"
                  ? `🫡 ${t.youLose}`
                  : `${t.over}: ${winnerLabel}`}
            </p>
            <p className={`${GAME_TEXT_META} mt-0.5 text-zinc-300`}>
              {myResult === "win"
                ? t.winHint
                : myResult === "lose"
                  ? `${t.over}: ${winnerLabel}. ${t.loseHint}`
                  : `${t.over}: ${winnerLabel}`}
            </p>
          </div>
        ) : null}
        <p className={GAME_TEXT_LEAD}>
          {showFinalMessage
            ? `${t.over}: ${winnerLabel}`
            : canThrow
              ? `${t.yourTurn}: ${nameLabels[turn] ?? t.p + (turn + 1)}`
              : t.wait}
        </p>
        <div className="flex gap-2">
          {phase === "matchOver" && !lockMode ? (
            <button
              type="button"
              onClick={onReset}
              className={`${GAME_CTA_SECONDARY} !min-h-0 py-1.5 normal-case tracking-normal`}
            >
              {t.reset}
            </button>
          ) : phase === "matchOver" && lockMode ? null : (
            <button
              type="button"
              disabled={!canThrow}
              onClick={onThrow}
              className={`${GAME_CTA_PRIMARY} !min-h-0 py-2 normal-case tracking-normal`}
            >
              {t.throw}
            </button>
          )}
        </div>
      </div>

      {lastSides.some((s) => s) && phase !== "throwing" && (
        <div className="mt-2 space-y-2 border-t border-zinc-800/80 pt-2">
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <div className="flex min-w-[5.5rem] flex-col items-center rounded-lg border border-amber-500/35 bg-amber-950/35 px-3 py-1.5">
              <span className="text-lg font-bold tabular-nums text-amber-100">
                {lastHorses}
              </span>
              <span className={GAME_TEXT_META}>
                {isEn ? "Horse" : "Морь"} 🐴
              </span>
            </div>
            <div className="flex min-w-[5.5rem] flex-col items-center rounded-lg border border-orange-500/35 bg-orange-950/25 px-3 py-1.5">
              <span className="text-lg font-bold tabular-nums text-orange-100">
                {lastCamels}
              </span>
              <span className={GAME_TEXT_META}>
                {isEn ? "Camel" : "Тэмээ"} 🐫
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {lastSides.map((s, i) =>
              s ? (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-zinc-900/90 px-1.5 py-0.5 text-xs font-semibold"
                >
                  <span className="font-mono text-[0.65rem] text-zinc-500">
                    {i + 1}
                  </span>
                  <span style={{ color: SHAgAI_SIDES[s].color }}>
                    {SHAgAI_SIDES[s].symbol}
                  </span>
                </span>
              ) : null,
            )}
          </div>
          <p className={`text-center ${GAME_TEXT_META} text-zinc-500`}>
            {isEn
              ? "1–4 = each bone’s slot (same order as the four pieces in this throw)."
              : "1–4 = энэ шидэлтийн дөрвөн шагайн байр (физик дээрх id дараалал)."}
          </p>
          {lastTransfer &&
          (lastTransfer.horsesTaken > 0 || lastTransfer.camelsGiven > 0) ? (
            <div
              className={`rounded-lg border border-emerald-500/25 bg-emerald-950/20 px-2 py-1.5 ${GAME_TEXT_BODY} text-center text-balance leading-snug text-emerald-100/95`}
            >
              {lastTransfer.horsesTaken > 0 ? (
                <p>
                  {isEn
                    ? `Took ${lastTransfer.horsesTaken} from ${lastTransfer.horseFromSeat != null ? (nameLabels[lastTransfer.horseFromSeat] ?? "—") : "—"}.`
                    : `${lastTransfer.horseFromSeat != null ? (nameLabels[lastTransfer.horseFromSeat] ?? "—") : "—"}-аас ${lastTransfer.horsesTaken} морь авлаа.`}
                </p>
              ) : null}
              {lastTransfer.camelsGiven > 0 ? (
                <p className={lastTransfer.horsesTaken > 0 ? "mt-0.5" : ""}>
                  {isEn
                    ? `Paid ${lastTransfer.camelsGiven} to ${lastTransfer.camelToSeat != null ? (nameLabels[lastTransfer.camelToSeat] ?? "—") : "—"}.`
                    : `${lastTransfer.camelToSeat != null ? (nameLabels[lastTransfer.camelToSeat] ?? "—") : "—"}-д ${lastTransfer.camelsGiven} тэмээ өглөө.`}
                </p>
              ) : null}
            </div>
          ) : lastTransfer &&
            lastHorses + lastCamels > 0 &&
            lastTransfer.horsesTaken === 0 &&
            lastTransfer.camelsGiven === 0 ? (
            <p
              className={`rounded-lg border border-zinc-600/40 bg-zinc-900/40 px-2 py-1 text-center ${GAME_TEXT_META} text-zinc-400`}
            >
              {isEn
                ? "Horse/camel sides did not move mories this round (e.g. only you in the chain)."
                : "Энэ удаад морь/тэмээгээр овоо шилжээгүй (жишээ нь өмнөх нь та өөрөө)."}
            </p>
          ) : null}
        </div>
      )}
    </>
  );

  return (
    <>
      <div
        className="shagai-b12-main-panel"
        style={{ ...mainChrome, ...mainPad }}
      >
        {playBlock}
      </div>

      <style>{`
        .shagai-b12-main-panel::-webkit-scrollbar { width: 6px; }
        .shagai-b12-main-panel::-webkit-scrollbar-thumb {
          background: rgba(200,160,48,0.35);
          border-radius: 3px;
        }
      `}</style>
    </>
  );
}
