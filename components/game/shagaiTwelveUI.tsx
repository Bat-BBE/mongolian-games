"use client";

import { useState, type CSSProperties } from "react";
import { useApp } from "@/components/AppContext";
import {
  TWELVE_TARGET,
  TWELVE_TIER1_THROWS,
  TWELVE_TIER2_THROWS,
  getRequiredPickAfterThrows,
  type TwelveMode,
  type TwelvePhase,
  type TurnSlot,
  type TwelvePick,
} from "./shagaiTwelveType";
import type { ShagaiSide } from "./shagai";
import { SHAgAI_SIDES } from "./shagai";
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
  GAME_CALLOUT_EMERALD_COMPACT,
  GAME_CALLOUT_SKY,
  GAME_CTA_PRIMARY,
  GAME_CTA_SECONDARY,
  GAME_PANEL_HEADING_CLASS,
  GAME_RULES_OL_CLASS,
  GAME_TEXT_LEAD,
  GAME_TEXT_META,
  GAME_TEXT_SECTION_LABEL,
  GAME_TEXT_SUBTITLE,
} from "./gameUiTheme";
import { TwelveShagaiRulesStrip } from "./shagaiStationRulesUI";

type Props = {
  phase: TwelvePhase;
  mode: TwelveMode;
  turn: TurnSlot;
  pick: TwelvePick;
  onPick: (n: TwelvePick) => void;
  scores: [number, number];
  canThrow: boolean;
  onThrow: () => void;
  onReset: () => void;
  lastSides: (ShagaiSide | null)[];
  lastHorses: number;
  winner: 0 | 1 | null;
  name0?: string;
  name1?: string;
  lockMode?: boolean;
  /** Соло өрөө: өөр тоглогчгүй үед. */
  showSoloOnlineNote?: boolean;
  /** Дууссан шидэлтийн тоо (лимит шат). Gанц+робот. */
  matchCompletedThrows?: number;
};

function rulesList(
  t: {
    r1: string;
    r2: string;
    r3: string;
    r4: string;
    r5: string;
  },
  lockMode: boolean,
) {
  return (
    <ol className={GAME_RULES_OL_CLASS}>
      <li>{t.r1}</li>
      <li>{t.r2}</li>
      <li>{t.r3}</li>
      <li>{t.r4}</li>
      {lockMode ? <li className="text-amber-200/90">{t.r5}</li> : null}
    </ol>
  );
}

export default function ShagaiTwelveUI({
  phase,
  mode,
  turn,
  pick,
  onPick,
  scores,
  canThrow,
  onThrow,
  onReset,
  lastSides,
  lastHorses,
  winner,
  name0 = "1",
  name1 = "2",
  lockMode = false,
  showSoloOnlineNote = false,
  matchCompletedThrows = 0,
}: Props) {
  const { language } = useApp();
  const isEn = language === "en";
  const narrowUi = useGameUiNarrow();
  const [rulesOpen, setRulesOpen] = useState(false);
  const requiredN =
    phase === "matchOver"
      ? null
      : getRequiredPickAfterThrows(matchCompletedThrows);
  const tier1Left = Math.max(0, TWELVE_TIER1_THROWS - matchCompletedThrows);
  const inTier1 = matchCompletedThrows < TWELVE_TIER1_THROWS;
  const inTier2 =
    !inTier1 &&
    matchCompletedThrows < TWELVE_TIER1_THROWS + TWELVE_TIER2_THROWS;
  const tier2Left = inTier1
    ? 0
    : Math.max(
        0,
        TWELVE_TIER1_THROWS + TWELVE_TIER2_THROWS - matchCompletedThrows,
      );
  const tierLine = isEn
    ? inTier1
      ? `Tier 1 — ${tier1Left} throw(s) left (4 bones each).`
      : inTier2
        ? `Tier 2 — ${tier2Left} throw(s) left (3 bones each).`
        : "Tier 3 — only 2 bones; unlimited throws."
    : inTier1
      ? `1-р шат — ${tier1Left} удаа үлдсэн (4).`
      : inTier2
        ? `2-р шат — ${tier2Left} удаа үлдсэн (3).`
        : "3-р шат — 2-оор л, хэд удаа ч.";

  const t = {
    title: isEn ? "12 years (shagai)" : "12 жил (шагай)",
    subtitle: isEn
      ? "Race to 12 horse points · throw sizes follow the strip below."
      : "12 морины оноо хүртэл түрүүл · шатны шидэлтийг доорх хайрцгаас хар.",
    lead: isEn
      ? "Pick the bone count for this tier, throw, then score: each 🐴 on top adds +1 for this turn only."
      : "Энэ шатандаа шагайн тоогоо сонгоод шид. Дээрээ морь тутамд энэ удаад +1.",
    pick: isEn ? "Shagai per throw" : "Нэг удаад шагай",
    rules: isEn ? "How to play" : "Дүрэм",
    r1: isEn
      ? "Solo: you vs the computer. Online with a friend, use 2P room (separate view)."
      : "Ганцаараа: энэ панелд роботтой. 2 тоглогч онлайнаар «Online»-оор.",
    r2: isEn
      ? "First 4 throws: exactly 4 bones each. Next 3 throws: exactly 3. After that, only 2 (no cap on how many 2-bone throws)."
      : "Эхний 4 шидэлт: тус бүр 4 шагай. Дараагийн 3: тус бүр 3. Дараа нь 2-оор л, хэд удаа ч.",
    r3: isEn
      ? "Count only horse faces (🐴) on top after they settle. That is your turn score—no horses = 0."
      : "Буусны дараа дээрх тал нь морь (🐴) бол тус бүр 1. Нэгт хэд нэмэгдэнэ — морьгүй 0.",
    r4: isEn
      ? `Scoreboard = horse-points, not how many times you pressed throw. First to ${TWELVE_TARGET} wins.`
      : "Табло = морины нийт оноо, шидэлтийн «удаа» биш. Анхы 12-ыг хүргэгч — ялна.",
    r5: isEn
      ? "Online: top bar → room → Ready, then the host starts. Left = host, right = guest in this match."
      : "Онлайн: дээд талын «Online»-оор өрөө, бэлэн, эзэн тоглолт эхлүүлнэ — тоглолтонд зүүн=эзэн, баруун=зочин.",
    soloRoomNote: isEn
      ? "No other person in the online room — you play vs the computer (like Homboroi when alone)."
      : "Онлайн өрөөнд өөр тоглогчгүй / зөвхөн таных — Хомборойтой ижил роботтой тоглоно.",
    throw: isEn ? "Throw" : "Шидэх",
    yourTurn: isEn ? "Your turn" : "Таны ээлж",
    cpu: isEn ? "vs computer" : "Роботтой",
    local2: isEn ? "2 on one screen" : "2 нэг дэлгэц дээр",
    wait: isEn ? "Opponent's turn…" : "Өрсөлдөгчийн ээлж…",
    reset: isEn ? "Again" : "Дахин",
    last: isEn ? "Horses this throw" : "Энэ удаад морь",
    over: isEn ? "Winner" : "Хожигч",
  };

  const canPick = phase === "idle" || phase === "result";
  const showSides = lastSides.some((s) => s != null);
  const rulesFabLabel = isEn ? "Rules" : "Дүрэм";

  const mainChrome = narrowUi
    ? { ...SHAGAI_GAME_PANEL_BASE, ...gamePanelPlayNarrowBottom() }
    : { ...SHAGAI_GAME_PANEL_BASE, ...gamePanelLeftDesktop(300) };
  const mainPad: CSSProperties = narrowUi
    ? { padding: "10px 12px 12px" }
    : { padding: "16px" };

  const playBlock = (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className={GAME_PANEL_HEADING_CLASS}>{t.title}</h2>
          <p className={GAME_TEXT_SUBTITLE}>{t.subtitle}</p>
        </div>
      </div>

      <TwelveShagaiRulesStrip isEn={isEn} />

      {showSoloOnlineNote && !lockMode ? (
        <p className={GAME_CALLOUT_SKY}>{t.soloRoomNote}</p>
      ) : null}

      {lockMode ? (
        <p className={GAME_CALLOUT_AMBER}>{t.r5}</p>
      ) : null}

      <p className={`mt-1.5 ${GAME_TEXT_LEAD}`}>{t.lead}</p>
      {phase !== "matchOver" ? (
        <p className={GAME_CALLOUT_EMERALD_COMPACT}>{tierLine}</p>
      ) : null}

      {phase === "matchOver" && winner != null ? (
        <div
          className="mt-3 w-full overflow-hidden rounded-xl border border-amber-400/40 p-3 text-center shadow-[0_0_32px_rgba(200,150,50,0.2)]"
          style={{
            background:
              "linear-gradient(180deg, rgba(80,50,20,0.5) 0%, rgba(20,12,8,0.95) 100%)",
          }}
        >
          <p className="font-display text-sm font-bold uppercase tracking-[0.2em] text-amber-200/90">
            {isEn ? "Match over" : "Тоглолт дууссан"}
          </p>
          <p
            className="mt-2 text-lg font-bold sm:text-2xl"
            style={{
              color: winner === 0 ? "rgb(134 239 172)" : "rgb(248 180 150)",
            }}
          >
            {mode === "vsCpu"
              ? winner === 0
                ? isEn
                  ? "You won — 12 horse points first."
                  : "Та яллаа — анх 12 оноо!"
                : isEn
                  ? "The computer won. Try again."
                  : "Робот яллаа. Дахиад нэг."
              : isEn
                ? `${winner === 0 ? name0 : name1} — victory!`
                : `${winner === 0 ? name0 : name1} — хожлоо!`}
          </p>
        </div>
      ) : null}

      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className={GAME_TEXT_SECTION_LABEL}>
            {t.pick}
            {requiredN != null ? (
              <span className="ml-1.5 text-emerald-200/80">
                ({isEn ? "now" : "одоо"}: {requiredN})
              </span>
            ) : null}
          </div>
          <div className="mt-1 flex gap-1">
            {([2, 3, 4] as const).map((n) => {
              const disallowed = requiredN != null && n !== requiredN;
              return (
                <button
                  key={n}
                  type="button"
                  disabled={!canPick || disallowed}
                  onClick={() => onPick(n)}
                  className={`min-w-9 rounded border px-2 py-1 text-xs font-bold ${
                    pick === n
                      ? "border-amber-400/70 bg-amber-950/70 text-amber-100"
                      : "border-zinc-600 text-zinc-300"
                  } ${!canPick || disallowed ? "pointer-events-none opacity-35" : ""}`}
                >
                  {n}
                </button>
              );
            })}
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold tabular-nums text-amber-100 sm:text-3xl">
            <span className={turn === 0 ? "text-emerald-300" : "text-zinc-500"}>
              {scores[0]}
            </span>
            <span className="mx-1.5 text-zinc-500">:</span>
            <span className={turn === 1 ? "text-emerald-300" : "text-zinc-500"}>
              {scores[1]}
            </span>
          </div>
          <div className={GAME_TEXT_META}>
            {name0} / {name1} · {isEn ? "target" : "зорилт"} {TWELVE_TARGET}
          </div>
          <p className={`mt-0.5 ${GAME_TEXT_SUBTITLE} text-amber-200/70`}>
            {isEn
              ? "🐴 on top = +1; no 🐴 = 0 for this throw."
              : "Дээрх тал морь бол +1, үгүй бол энэ удаа 0."}
          </p>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <p className={`min-h-[1.1rem] ${GAME_TEXT_LEAD}`}>
          {phase === "matchOver" && winner != null
            ? null
            : mode === "vsCpu" && turn === 1
              ? isEn
                ? "Computer is throwing…"
                : "Робот шидаж байна…"
              : canThrow
                ? `${t.yourTurn} — ${turn === 0 ? name0 : name1}`
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

      {showSides && phase !== "throwing" && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-zinc-800/80 pt-2">
          <span className={`${GAME_TEXT_META} inline`}>{t.last}:</span>
          {lastSides.map(
            (s, i) =>
              s && (
                <span
                  key={i}
                  className="inline-flex items-center gap-0.5 rounded bg-zinc-900/80 px-1.5 py-0.5 text-sm"
                  style={{ color: SHAgAI_SIDES[s].color }}
                >
                  {SHAgAI_SIDES[s].symbol}
                </span>
              ),
          )}
          <span className="ml-1 text-xs font-bold text-amber-200">
            +{lastHorses} 🐴
          </span>
        </div>
      )}
    </>
  );

  return (
    <>
      <div
        className="shagai-t12-main-panel"
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
        {rulesList(t, lockMode)}
      </GameRulesSheet>

      <style>{`
        .shagai-t12-main-panel::-webkit-scrollbar { width: 6px; }
        .shagai-t12-main-panel::-webkit-scrollbar-thumb {
          background: rgba(200,160,48,0.35);
          border-radius: 3px;
        }
      `}</style>
    </>
  );
}
