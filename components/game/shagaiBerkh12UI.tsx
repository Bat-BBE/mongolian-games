"use client";

import { useState, type CSSProperties } from "react";
import { useApp } from "@/components/AppContext";
import {
  BERKH12_MAX_TURNS,
  BERKH12_PIECE_COUNT,
  BERKH12_START_STACK,
} from "./shagaiBerkh12Type";
import type { ShagaiSide } from "./shagai";
import { SHAgAI_SIDES } from "./shagai";
import type {
  Berkh12Mode,
  Berkh12Phase,
  LocalPlayerCount,
} from "./shagaiBerkh12Type";
import {
  SHAGAI_GAME_PANEL_BASE,
  gamePanelLeftDesktop,
  gamePanelPlayNarrowBottom,
} from "./gamePanelLayout";
import { useGameUiNarrow } from "./useGameUiNarrow";
import GameRulesFab from "./GameRulesFab";
import GameRulesSheet from "./GameRulesSheet";
import { playButtonClick } from "@/lib/uiSounds";
import {
  GAME_CALLOUT_AMBER,
  GAME_CALLOUT_ERROR,
  GAME_CTA_PRIMARY,
  GAME_CTA_SECONDARY,
  GAME_PANEL_HEADING_CLASS,
  GAME_RULES_OL_CLASS,
  GAME_TEXT_BODY,
  GAME_TEXT_LEAD,
  GAME_TEXT_META,
  GAME_TEXT_SUBTITLE,
} from "./gameUiTheme";

type Props = {
  phase: Berkh12Phase;
  mode: Berkh12Mode;
  playerCount: LocalPlayerCount;
  turn: number;
  mories: number[];
  center: number;
  active: boolean[];
  canThrow: boolean;
  onThrow: () => void;
  onReset: () => void;
  onModeChange: (m: Berkh12Mode) => void;
  onPlayerCountChange: (c: LocalPlayerCount) => void;
  lastSides: (ShagaiSide | null)[];
  lastHorses: number;
  lastCamels: number;
  showElimToast?: string | null;
  winner: number | null;
  nameLabels: string[];
  lockMode?: boolean;
  hideModeToggle?: boolean;
};

type TRules = {
  r1: string;
  r2: string;
  r3: string;
  r4: string;
  r5: string;
  r6: string;
  r7online: string;
};

function berkhRulesList(t: TRules, lockMode: boolean) {
  return (
    <ol className={GAME_RULES_OL_CLASS}>
      <li>{t.r1}</li>
      <li>{t.r2}</li>
      <li>{t.r3}</li>
      <li>{t.r4}</li>
      <li>{t.r5}</li>
      <li>{t.r6}</li>
      {lockMode ? <li className="text-amber-200/90">{t.r7online}</li> : null}
    </ol>
  );
}

export default function ShagaiBerkh12UI({
  phase,
  mode,
  playerCount,
  turn,
  mories,
  center,
  active,
  canThrow,
  onThrow,
  onReset,
  onModeChange,
  onPlayerCountChange,
  lastSides,
  lastHorses,
  lastCamels,
  showElimToast,
  winner,
  nameLabels,
  lockMode = false,
  hideModeToggle = false,
}: Props) {
  const { language } = useApp();
  const isEn = language === "en";
  const narrowUi = useGameUiNarrow();
  const [rulesOpen, setRulesOpen] = useState(false);

  const t = {
    title: isEn ? "12 Berkh" : "12 бэрх",
    subtitle: isEn ? "Board · round turn flow" : "Самбар · тойрог урсгал",
    lead: isEn
      ? `Throw ${BERKH12_PIECE_COUNT} bones each turn. Last active player wins.`
      : `Ээлж бүрт ${BERKH12_PIECE_COUNT} шагай шиднэ. Сүүлд үлдсэн хүн нь ялна.`,
    rules: isEn ? "Rules" : "Дүрэм",
    r1: isEn
      ? `Everyone starts with ${BERKH12_START_STACK} mories.`
      : `Хүн бүр эхэндээ ${BERKH12_START_STACK} морьтой эхэлнэ.`,
    r2: isEn
      ? "On your turn, all 12 bones are thrown. Count how many are horse, how many camel; sheep/goat are neutral in this table."
      : "Ээлжтэй: 4 шагайг зэрэг. Морь, тэмээг нэгт — хонь/ямаа хамаарахгүй.",
    r3: isEn
      ? "Horse: take that many mories from the previous active player."
      : "Морь: өмнөх идэвхтэй тоглогчоос тэр тоогоор авна.",
    r4: isEn
      ? "Camel: give that many mories from your pile to the next active player."
      : "Тэмээ: өөрийн шагайнаас тоогоор дараагийн идэвхтэй тоглогчид өгнө.",
    r5: isEn
      ? "If your pile becomes 0, you are eliminated."
      : "Шагай 0 болсон тоглогч хасагдана.",
    r6: isEn
      ? `Win: hold all table mories, be last active, or after turn cap ${BERKH12_MAX_TURNS}, the largest active pile wins.`
      : `Хожих: бүх шагайг нэгтгэх, эсвэл сүүлд идэвхтэй үлдэх, эсвэл ${BERKH12_MAX_TURNS} хүрвэл хамгийн олон үлдэгдэлтэй нь.`,
    r7online: isEn
      ? "Online: Seat order in the list = play order."
      : "Онлайн: Нэрийн дараалал=суудлын нэр.",
    throw: isEn ? "Throw" : "Орхих",
    yourTurn: isEn ? "Your turn" : "Таны ээлж",
    p: isEn ? "P" : "Т",
    reset: isEn ? "Again" : "Дахин",
    wait: isEn ? "Not your turn" : "Таны ээлж биш",
    over: isEn ? "Winner" : "Хожигч",
    last: isEn ? "Horses / camels" : "Морь / тэмээ",
    center: isEn ? "Pot" : "Төв",
    out: isEn ? "Out" : "Хасагдсан",
    local: isEn ? "2–4 local" : "2–4 нэг дэлгэц",
    cpu: isEn ? "vs computer" : "Роботтой",
    soloRoomNote: isEn
      ? "No other person in the online room — you play vs the computer."
      : "Онлайн өрөөнд өөр тоглогчгүй — Роботтой тоглоно.",
  };

  const mainChrome = narrowUi
    ? { ...SHAGAI_GAME_PANEL_BASE, ...gamePanelPlayNarrowBottom() }
    : { ...SHAGAI_GAME_PANEL_BASE, ...gamePanelLeftDesktop(300) };
  const mainPad: CSSProperties = narrowUi
    ? { padding: "10px 12px 12px" }
    : { padding: "16px" };
  const rulesFabLabel = isEn ? "Rules" : "Дүрэм";
  const ringSeats = Array.from({ length: playerCount }, (_, i) => i);

  const playBlock = (
    <>
      {showElimToast ? (
        <p className={GAME_CALLOUT_ERROR}>{showElimToast}</p>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className={GAME_PANEL_HEADING_CLASS}>{t.title}</h2>
          <p className={GAME_TEXT_SUBTITLE}>{t.subtitle}</p>
        </div>
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
      {lockMode ? <p className={GAME_CALLOUT_AMBER}>{t.r7online}</p> : null}
      {hideModeToggle && !lockMode ? (
        <p className={`mb-1.5 !mt-0 ${GAME_TEXT_META}`}>{t.soloRoomNote}</p>
      ) : null}
      <p className={`mt-1 ${GAME_TEXT_LEAD}`}>{t.lead}</p>

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

      <div className="mt-2 flex flex-wrap items-end justify-between gap-2">
        <div>
          <div className={GAME_TEXT_META}>{isEn ? "Center" : "Төв"}</div>
          <div className="text-2xl font-bold tabular-nums text-amber-100 sm:text-3xl">
            {center}
            <span className="ml-0.5 text-sm font-normal text-zinc-500">🐴</span>
          </div>
          <p className={`mt-0.5 ${GAME_TEXT_META}`}>
            {isEn
              ? "Player cards show remaining mories."
              : "Тоглогчийн карт дээр үлдсэн морь харагдана."}
          </p>
        </div>
        <div className="grid max-w-[12rem] grid-cols-2 gap-1.5 sm:max-w-none sm:grid-cols-4">
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
                <span className="ml-0.5 text-amber-300/60">🐴</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <p className={GAME_TEXT_LEAD}>
          {phase === "matchOver" && winner != null
            ? `${t.over}: ${nameLabels[winner] ?? t.p + (winner + 1)}`
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
        <div className="mt-1.5 flex flex-wrap items-center gap-1 border-t border-zinc-800/80 pt-1.5">
          <span className={GAME_TEXT_META}>
            {t.last}: {lastHorses} 🐴 / {lastCamels} 🐫
          </span>
          {lastSides.map(
            (s, i) =>
              s && (
                <span
                  key={i}
                  className="inline-flex rounded bg-zinc-900/80 px-1 text-xs"
                  style={{ color: SHAgAI_SIDES[s].color }}
                >
                  {SHAgAI_SIDES[s].symbol}
                </span>
              ),
          )}
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

      <GameRulesFab
        label={rulesFabLabel}
        onClick={() => {
          playButtonClick();
          setRulesOpen(true);
        }}
      />
      <GameRulesSheet
        open={rulesOpen}
        onClose={() => setRulesOpen(false)}
        title={t.rules}
      >
        {berkhRulesList(t, lockMode)}
      </GameRulesSheet>

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
