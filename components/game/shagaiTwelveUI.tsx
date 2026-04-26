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
  gamePanelRightDesktop,
} from "./gamePanelLayout";
import { useGameUiNarrow } from "./useGameUiNarrow";
import GameRulesFab from "./GameRulesFab";
import GameRulesSheet from "./GameRulesSheet";
import { playButtonClick } from "@/lib/uiSounds";

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
    <ol className="list-decimal space-y-1.5 pl-4 text-[10px] leading-relaxed text-zinc-300">
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
      ? "Tiers: 4×4 → 3×3 → 2s · 🐴 to 12"
      : "Шат: 4×4 → 3×3 → 2-ууд · 🐴 12 хүртэл",
    lead: isEn
      ? "Horse face on top = 1 pt per bone. To 12 horse points first. Throw count is tiered: four throws of 4, then three of 3, then 2 with no cap."
      : "Одоогийн шат: шаардлагатай тооны шагай. Морь дээр +1. Эхнээс 4 удаа 4, 3 удаа 3, дараа 2-оор хязгааргүй.",
    pick: isEn ? "Shagai per throw" : "Нэг удаад шагай",
    rules: isEn ? "How to play" : "Дүрэм",
    rulesAside: isEn ? "Rules" : "Дүрэм",
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

  const rightChrome = {
    ...SHAGAI_GAME_PANEL_BASE,
    ...gamePanelRightDesktop(272),
  };

  const playBlock = (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2
            className="font-display text-sm font-bold tracking-wide text-amber-200"
            style={{ textShadow: "0 0 12px rgba(200,160,48,0.2)" }}
          >
            {t.title}
          </h2>
          <p className="text-[8px] text-zinc-500">{t.subtitle}</p>
        </div>
      </div>

      {showSoloOnlineNote && !lockMode ? (
        <p className="mt-1.5 rounded border border-sky-500/20 bg-sky-950/20 px-2 py-1 text-[9px] leading-snug text-sky-100/90">
          {t.soloRoomNote}
        </p>
      ) : null}

      {lockMode ? (
        <p className="mt-1.5 rounded border border-amber-500/20 bg-amber-950/25 px-2 py-1 text-[9px] leading-snug text-amber-100/95">
          {t.r5}
        </p>
      ) : null}

      <p className="mt-1.5 text-[10px] leading-snug text-amber-100/90">
        {t.lead}
      </p>
      {phase !== "matchOver" ? (
        <p className="mt-1.5 rounded border border-emerald-500/20 bg-emerald-950/25 px-2 py-0.5 text-[9px] text-emerald-100/90">
          {tierLine}
        </p>
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
          <div className="text-[10px] font-semibold uppercase text-zinc-500">
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
          <div className="text-[9px] text-zinc-500">
            {name0} / {name1} · {isEn ? "target" : "зорилт"} {TWELVE_TARGET}
          </div>
          <p className="mt-0.5 text-[8px] leading-tight text-amber-200/60">
            {isEn
              ? "🐴 on top = +1; no 🐴 = 0 for this throw."
              : "Дээрх тал морь бол +1, үгүй бол энэ удаа 0."}
          </p>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <p className="min-h-[1.1rem] text-xs text-amber-100/90">
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
              className="rounded-lg border border-amber-500/50 bg-amber-950/50 px-3 py-1.5 text-xs font-semibold"
            >
              {t.reset}
            </button>
          ) : phase === "matchOver" && lockMode ? null : (
            <button
              type="button"
              disabled={!canThrow}
              onClick={onThrow}
              className="rounded-lg border border-amber-400/60 bg-amber-800/50 px-4 py-1.5 text-sm font-bold text-amber-50 disabled:opacity-35"
            >
              {t.throw}
            </button>
          )}
        </div>
      </div>

      {showSides && phase !== "throwing" && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-zinc-800/80 pt-2">
          <span className="text-[10px] text-zinc-500">{t.last}:</span>
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

      {!narrowUi ? (
        <div
          className="shagai-t12-right-panel"
          style={{ ...rightChrome, padding: "14px 14px 12px" }}
        >
          <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-amber-400/95">
            {t.rulesAside}
          </p>
          <div className="mt-2 border-t border-amber-500/15 pt-2">
            {rulesList(t, lockMode)}
          </div>
        </div>
      ) : null}

      {narrowUi ? (
        <>
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
        </>
      ) : null}

      <style>{`
        .shagai-t12-main-panel::-webkit-scrollbar,
        .shagai-t12-right-panel::-webkit-scrollbar { width: 6px; }
        .shagai-t12-main-panel::-webkit-scrollbar-thumb,
        .shagai-t12-right-panel::-webkit-scrollbar-thumb {
          background: rgba(200,160,48,0.35);
          border-radius: 3px;
        }
      `}</style>
    </>
  );
}
