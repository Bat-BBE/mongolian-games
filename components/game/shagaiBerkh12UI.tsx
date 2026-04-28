"use client";

import { useState, type CSSProperties } from "react";
import { useApp } from "@/components/AppContext";
import {
  BERKH12_MAX_TURNS,
  BERKH12_PIECE_COUNT,
  BERKH12_TOTAL_MORIES,
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
  GAME_CALLOUT_SKY,
  GAME_CTA_PRIMARY,
  GAME_CTA_SECONDARY,
  GAME_PANEL_HEADING_CLASS,
  GAME_RULES_OL_CLASS,
  GAME_TEXT_BODY,
  GAME_TEXT_LEAD,
  GAME_TEXT_META,
  GAME_TEXT_SUBTITLE,
} from "./gameUiTheme";
import { Berkh12RulesStrip } from "./shagaiStationRulesUI";

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
    title: isEn ? "12 Berkh (shagai party)" : "12 бэрх (шагайн наадгай)",
    subtitle: isEn
      ? "One throw each · pot in the middle · pay camels from your pile"
      : "Нэг удаа шидэлт · төвийн сан · тэмээг өөрийн овооноос төлнө",
    lead: isEn
      ? `Everyone throws all ${BERKH12_PIECE_COUNT} bones together. Horses pull mories from the pot; camels force you to pay other players.`
      : `Бүгд ${BERKH12_PIECE_COUNT} шагайгаа зэрэг шиднэ. Морь төвөөс авна, тэмээ бусдад төлнө.`,
    rules: isEn ? "Rules" : "Дүрэм",
    r1: isEn
      ? "Everyone starts with 0; all mories sit in the pot in the middle at first."
      : "Эхлээд бүгд 0, бүх морь төвд (хоорондын сан).",
    r2: isEn
      ? "On your turn, all 12 bones are thrown. Count how many are horse, how many camel; sheep/goat are neutral in this table."
      : "Ээлжтэй: 12 шагайг зэрэг. Морь, тэмээг нэгт — хонь/ямаа энэ дүрмэнд тооцохгүй.",
    r3: isEn
      ? "Horses: take that many mories from the pot into your pile, up to what the pot has."
      : "Морь: тэр олоноороо төвөөс өөрт нэмж авах (төвд элсэх дээд хязгаар).",
    r4: isEn
      ? "Camels: from your own pile, pay 1 mory to each other player in counter-sun order—previous seat first, and so on."
      : "Тэмээ: өөрийнхөөс 1, 1-аар бусад сөрөгдүүдэд, эсрэг нарын дараалалаар төлнө.",
    r5: isEn
      ? "If you cannot pay all required camel mories, you are eliminated; your mories return to the pot."
      : "Төлбөр хүрэлцэхгүй бол тоглогч хасагдна, морь нь төвд очиж нийлүүлнэ.",
    r6: isEn
      ? `Win: hold all ${BERKH12_TOTAL_MORIES} mories, be last active, or after a long run (turn cap ${BERKH12_MAX_TURNS}), the largest pile wins per the in-panel rule.`
      : `Хожих: ${BERKH12_TOTAL_MORIES}-ыг нэгт, эсвэл сүүлд идэвхтэй, эсвэл олон ээлж (${BERKH12_MAX_TURNS}) — хамгийн олонтой (доорх нөхцөл).`,
    r7online: isEn
      ? "Online: top bar → room → Ready, host starts. Seat order in the list = play order, same as Homboroi (Shagai Shooting) online."
      : "Онлайн: дээд баганаар «Online» → өрөө, бэлэн, эзэн эхлүүлнэ. Нэрийн дараалал=суудлын нар, Хомборойтой ижилхэн.",
    throw: isEn ? "Throw" : "Орхих",
    yourTurn: isEn ? "Your turn" : "Таны ээлж",
    p: isEn ? "P" : "Т",
    reset: isEn ? "Again" : "Дахин",
    wait: isEn ? "Not your turn" : "Таны ээлж биш",
    over: isEn ? "Winner" : "Хожигч",
    last: isEn ? "Horses / camels" : "Морь / тэмээ",
    center: isEn ? "Pot" : "Төв (хооронд)",
    out: isEn ? "Out" : "Хасагдсан",
    local: isEn ? "2–4 local" : "2–4 нэг дэлгэц",
    cpu: isEn ? "vs computer" : "Роботтой",
    soloRoomNote: isEn
      ? "No other person in the online room — you play vs the computer (like Homboroi when alone)."
      : "Онлайн өрөөнд өөр тоглогчгүй — Хомборойтой ижил роботтой тоглоно.",
  };

  const mainChrome = narrowUi
    ? { ...SHAGAI_GAME_PANEL_BASE, ...gamePanelPlayNarrowBottom() }
    : { ...SHAGAI_GAME_PANEL_BASE, ...gamePanelLeftDesktop(300) };
  const mainPad: CSSProperties = narrowUi
    ? { padding: "10px 12px 12px" }
    : { padding: "16px" };
  const rulesFabLabel = isEn ? "Rules" : "Дүрэм";

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
      <Berkh12RulesStrip isEn={isEn} />
      {hideModeToggle && !lockMode ? (
        <p className={`mb-1.5 !mt-0 ${GAME_CALLOUT_SKY}`}>{t.soloRoomNote}</p>
      ) : null}
      {lockMode ? (
        <p className={GAME_CALLOUT_AMBER}>{t.r7online}</p>
      ) : null}
      <p className={`mt-1.5 ${GAME_TEXT_LEAD}`}>{t.lead}</p>

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
          <div className={GAME_TEXT_META}>{t.center}</div>
          <div className="text-2xl font-bold tabular-nums text-amber-100 sm:text-3xl">
            {center}
            <span className="ml-0.5 text-sm font-normal text-zinc-500">🐴</span>
          </div>
          <p className={`mt-0.5 ${GAME_TEXT_SUBTITLE}`}>
            {isEn
              ? "Pot = shared bank. Your number = mories left to pay camel costs."
              : "Төв = нийтийн сан. Тоо = тэмээнд зарцуулах үлдсэн морь."}
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
