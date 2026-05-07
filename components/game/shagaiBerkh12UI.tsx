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
  GAME_PANEL_CHROME_GLASS,
  GAME_TEXT_BODY,
  GAME_TEXT_LEAD,
  GAME_TEXT_LEAD_MUTED,
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
    ? {
        ...SHAGAI_GAME_PANEL_BASE,
        ...GAME_PANEL_CHROME_GLASS,
        ...gamePanelPlayNarrowBottom(),
      }
    : {
        ...SHAGAI_GAME_PANEL_BASE,
        ...GAME_PANEL_CHROME_GLASS,
        ...gamePanelLeftDesktop(292),
      };
  const mainPad: CSSProperties = narrowUi
    ? { padding: "12px 14px 14px" }
    : { padding: "18px 17px 16px" };
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
            <div className="flex flex-wrap items-center gap-2 text-[0.6875rem] text-zinc-500">
              <button
                type="button"
                className={`rounded-lg border px-2.5 py-1 transition ${
                  mode === "local"
                    ? "border-white/18 bg-white/[0.08] text-zinc-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                    : "border-white/[0.06] bg-black/20 text-zinc-500 hover:border-white/10 hover:text-zinc-400"
                }`}
                onClick={() => onModeChange("local")}
              >
                {t.local}
              </button>
              <button
                type="button"
                className={`rounded-lg border px-2.5 py-1 transition ${
                  mode === "vsCpu"
                    ? "border-white/18 bg-white/[0.08] text-zinc-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                    : "border-white/[0.06] bg-black/20 text-zinc-500 hover:border-white/10 hover:text-zinc-400"
                }`}
                onClick={() => onModeChange("vsCpu")}
              >
                {t.cpu}
              </button>
            </div>
          ) : null}
        </div>
      )}

      <div className="mt-2 grid grid-cols-1 gap-2 rounded-2xl border border-white/[0.06] bg-black/20 px-3 py-2.5 text-[0.6875rem] leading-snug text-zinc-400 sm:grid-cols-2">
        <p className="flex items-center gap-2">
          <span className="opacity-80 grayscale">🐴</span>
          <span>
            {isEn ? "Take from previous seat" : "Өмнөх хүнээсээ авна"}
          </span>
          <span className="font-medium text-zinc-500">←</span>
        </p>
        <p className="flex items-center gap-2">
          <span className="opacity-80 grayscale">🐫</span>
          <span>{isEn ? "Give to next seat" : "Дараагийн хүнд өгнө"}</span>
          <span className="font-medium text-zinc-500">→</span>
        </p>
      </div>

      <div className="mt-2 rounded-2xl border border-white/[0.06] bg-black/[0.14] px-3 py-2.5">
        <p className={`${GAME_TEXT_META} text-center text-zinc-500`}>
          {isEn ? "Seat flow diagram" : "Тоглогчдын тойрог"}
        </p>
        <div className="mt-2 flex items-center justify-center gap-2 sm:gap-2.5">
          {ringSeats.map((seat, idx) => {
            const current = seat === turn && active[seat];
            return (
              <div
                key={`seat-${seat}`}
                className="flex items-center gap-2 sm:gap-2.5"
              >
                <div
                  className={`relative flex h-7 min-w-7 items-center justify-center rounded-full border px-2 text-[10px] font-medium transition ${
                    current
                      ? "border-emerald-400/55 bg-emerald-500/15 text-emerald-100 shadow-[0_0_16px_rgba(16,185,129,0.22)]"
                      : !active[seat]
                        ? "border-zinc-700/50 bg-zinc-950/40 text-zinc-600"
                        : "border-white/[0.08] bg-white/[0.04] text-zinc-400"
                  }`}
                >
                  {nameLabels[seat] ?? `${t.p}${seat + 1}`}
                  {current ? (
                    <span className="absolute -top-0.5 -right-0.5 inline-flex h-2 w-2 rounded-full bg-emerald-400/90" />
                  ) : null}
                </div>
                {idx < ringSeats.length - 1 ? (
                  <span className="text-xs text-zinc-600">→</span>
                ) : (
                  <span className="text-xs text-zinc-600">↺</span>
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
              className={`rounded-lg border px-2.5 py-1 text-[0.6875rem] font-semibold transition ${
                playerCount === c
                  ? "border-white/18 bg-white/[0.08] text-zinc-100"
                  : "border-white/[0.06] bg-black/20 text-zinc-500 hover:border-white/10"
              } ${!(phase === "idle" || phase === "result") ? "opacity-40" : ""}`}
            >
              {c}
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap items-end justify-end gap-2">
        <div className="grid w-full max-w-none grid-cols-2 gap-2 sm:grid-cols-4">
          {mories.slice(0, playerCount).map((m, i) => {
            const isCurrent = i === turn && active[i];
            return (
              <div
                key={i}
                className={`rounded-xl border px-2.5 py-1.5 text-right ${
                  isCurrent
                    ? "border-emerald-500/35 bg-emerald-500/[0.08]"
                    : "border-white/[0.06] bg-black/15"
                } ${!active[i] ? "opacity-45" : ""}`}
              >
                <div className={`${GAME_TEXT_META} uppercase text-zinc-500`}>
                  {nameLabels[i] ?? `${t.p}${i + 1}`}
                  {!active[i] ? ` · ${t.out}` : ""}
                </div>
                <span
                  className={`text-base font-semibold tabular-nums ${
                    isCurrent ? "text-zinc-100" : "text-zinc-500"
                  }`}
                >
                  {m}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        {showFinalMessage ? (
            <div
              className={`w-full rounded-2xl border px-3 py-2.5 text-center ${
                myResult === "win"
                  ? "border-emerald-400/30 bg-emerald-950/20"
                  : myResult === "lose"
                    ? "border-rose-400/30 bg-rose-950/18"
                    : "border-white/[0.08] bg-black/20"
              }`}
            >
            <p
              className={`${GAME_TEXT_LEAD} ${
                myResult === "win"
                  ? "text-emerald-200"
                  : myResult === "lose"
                    ? "text-rose-200"
                    : "text-zinc-200"
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
        <p
          className={
            showFinalMessage
              ? GAME_TEXT_LEAD_MUTED
              : canThrow
                ? "font-[family-name:var(--font-inter)] text-xs font-medium leading-snug text-emerald-200/95 sm:text-[0.8125rem]"
                : GAME_TEXT_LEAD_MUTED
          }
        >
          {showFinalMessage
            ? `${t.over}: ${winnerLabel}`
            : canThrow
              ? `${t.yourTurn}: ${nameLabels[turn] ?? t.p + (turn + 1)}`
              : t.wait}
        </p>
        <div className="flex shrink-0 gap-2">
          {phase === "matchOver" && !lockMode ? (
            <button
              type="button"
              onClick={onReset}
              className={`${GAME_CTA_SECONDARY} !min-h-0 min-h-[40px] !border-zinc-600/50 !bg-zinc-900/40 px-4 py-2 !font-semibold !normal-case !tracking-normal !text-zinc-300 !shadow-none hover:!border-zinc-500/55 hover:!bg-zinc-800/45`}
            >
              {t.reset}
            </button>
          ) : phase === "matchOver" && lockMode ? null : (
            <button
              type="button"
              disabled={!canThrow}
              onClick={onThrow}
              className={`${GAME_CTA_PRIMARY} !min-h-0 min-h-[40px] px-5 py-2 !font-semibold !normal-case !tracking-normal`}
            >
              {t.throw}
            </button>
          )}
        </div>
      </div>

      {lastSides.some((s) => s) && phase !== "throwing" && (
        <div className="mt-3 space-y-2.5 border-t border-white/[0.06] pt-3">
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <div className="flex min-w-[4.5rem] flex-col items-center gap-0.5">
              <span className="text-sm font-semibold tabular-nums text-zinc-200">
                {lastHorses}
              </span>
              <span className={`${GAME_TEXT_META} text-zinc-500`}>
                {isEn ? "Horse" : "Морь"} <span className="opacity-70">🐴</span>
              </span>
            </div>
            <div className="hidden h-8 w-px bg-white/[0.08] sm:block" aria-hidden />
            <div className="flex min-w-[4.5rem] flex-col items-center gap-0.5">
              <span className="text-sm font-semibold tabular-nums text-zinc-200">
                {lastCamels}
              </span>
              <span className={`${GAME_TEXT_META} text-zinc-500`}>
                {isEn ? "Camel" : "Тэмээ"}{" "}
                <span className="opacity-70">🐫</span>
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
        .shagai-b12-main-panel::-webkit-scrollbar { width: 5px; }
        .shagai-b12-main-panel::-webkit-scrollbar-thumb {
          background: rgba(113, 113, 122, 0.35);
          border-radius: 5px;
        }
      `}</style>
    </>
  );
}
