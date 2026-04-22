"use client";

import {
  GameState,
  SHAGAI_INFO,
  ShagaiSide,
  TARGET_SCORE,
  sideName,
  ScoreLabelKey,
} from "./shagaiTargetType";
import { ShagaiSideImage } from "./shagaiUI";
import { useApp } from "@/components/AppContext";
import { playButtonClick } from "@/lib/uiSounds";
import {
  gamePanelLeftDesktop,
  gamePanelPlayNarrowBottom,
  gamePanelRightDesktop,
} from "./gamePanelLayout";
import { useGameUiNarrow } from "./useGameUiNarrow";
import GameRulesSheet from "./GameRulesSheet";
import GameRulesFab from "./GameRulesFab";
import { useState } from "react";

interface Props {
  state: GameState;
  onThrow: () => void;
  onReset: () => void;
  settledSides: (ShagaiSide | null)[];
  rewardEvents?: { id: string; text: string; kind: "coins" | "gems" }[];
  sessionGain?: { coins: number; gems: number };
  /** Whose turn the current physical throw belongs to. */
  currentTurn?: "player" | "robot";
}

type UiStrings = {
  title: string;
  subtitle: string;
  overline: string;
  rollingHint: string;
  robotRolling: string;
  throwButton: string;
  throwingButton: string;
  waitingRobot: string;
  yourTurn: (remaining: number) => string;
  youBusted: string;
  robotBusted: string;
  robotThinking: string;
  youWon: string;
  youWonFourHorses: string;
  robotWon: string;
  robotWonFourHorses: string;
  score: string;
  target: string;
  you: string;
  robot: string;
  playerGot: (pts: number) => string;
  playerZero: string;
  robotGot: (pts: number) => string;
  rulesTitle: string;
  howToPlay: string;
  rules: { n: string; t: string; d: string }[];
  scoringTitle: string;
  scoring: { label: string; pts: string }[];
  statistic: string;
  stats: {
    label: string;
    valueKey:
      | "playerScore"
      | "robotScore"
      | "totalThrows"
      | "streak"
      | "bestStreak";
  }[];
  historyTitle: string;
  historyEmpty: string;
  resetBtn: string;
  shagaiSidesLabel: string;
  rewardLabel: string;
  playerTag: string;
  robotTag: string;
  tapHint: string;
  labels: Record<ScoreLabelKey, string>;
};

function useI18n(): UiStrings & { language: "mn" | "en" } {
  const { language } = useApp();
  const en: UiStrings = {
    title: "Homboroi",
    subtitle: "4 SHAGAI · RACE TO EXACTLY 32 · VS ROBOT",
    overline: "ᠳᠥᠷᠪᠡᠨ ᠪᠡᠷᠬᠡ",
    rollingHint: "⏳ Shagai falling...",
    robotRolling: "🤖 Robot is throwing...",
    throwButton: "Throw Shagai",
    throwingButton: "Rolling...",
    waitingRobot: "🤖 Robot's turn...",
    yourTurn: (left) =>
      left > 0
        ? `Your turn — need ${left} more pts (overshoot resets to 0)`
        : "You hit 32!",
    youBusted: "💥 You overshot — score resets to 0",
    robotBusted: "💥 Robot overshot — robot back to 0",
    robotThinking: "🤖 Robot is thinking...",
    youWon: "🏆 YOU HIT 32!",
    youWonFourHorses: "🏆 FOUR HORSES — INSTANT WIN!",
    robotWon: "🤖 ROBOT HIT 32",
    robotWonFourHorses: "🤖 ROBOT: FOUR HORSES — INSTANT WIN",
    score: "Score",
    target: `Land exactly on ${TARGET_SCORE} to win`,
    you: "YOU",
    robot: "ROBOT",
    playerGot: (pts) => `+${pts} pts for you`,
    playerZero: "0 pts — no scoring combo",
    robotGot: (pts) => `+${pts} pts for robot`,
    rulesTitle: "HOW TO PLAY",
    howToPlay:
      "Throw 4 shagai each turn. Land exactly on 32 to win. If you pass 32, your score resets to 0 and you keep going.",
    rules: [
      { n: "①", t: "Throw 4 shagai", d: "Every turn" },
      { n: "②", t: "Score combos", d: "See scoring table" },
      { n: "③", t: "Robot answers", d: "Auto throw" },
      { n: "④", t: "Win", d: "Be the first to hit exactly 32" },
      { n: "⑤", t: "Overshoot", d: "Score resets to 0 — game continues" },
    ],
    scoringTitle: "SCORING",
    scoring: [
      { label: "4 horse (all sides)", pts: "Win" },
      { label: "4 different sides (Dörvön berkh)", pts: "+8" },
      { label: "4 identical (not 4 horse)", pts: "+4" },
      { label: "Any two pairs (2+2 of two sides)", pts: "+2" },
      { label: "Everything else", pts: "0" },
    ],
    statistic: "STATISTICS",
    stats: [
      { label: "Your score", valueKey: "playerScore" },
      { label: "Robot score", valueKey: "robotScore" },
      { label: "Total throws", valueKey: "totalThrows" },
      { label: "Streak", valueKey: "streak" },
    ],
    historyTitle: "RECENT ROLLS",
    historyEmpty: "No history yet",
    resetBtn: "Restart",
    shagaiSidesLabel: "SHAGAI SIDES",
    rewardLabel: "REWARD (SESSION)",
    playerTag: "YOU",
    robotTag: "ROBOT",
    tapHint: "You can also click a shagai to throw",
    labels: {
      "": "",
      berkh: "Dörvön berkh (4 unique)",
      ijil: "Four of a kind",
      hoyorHoyor: "Two pairs (2+2)",
      durvenMori: "Four horses — instant win",
    },
  };
  const mn: UiStrings = {
    title: "Хомборой",
    subtitle: "4 ШАГАЙ · ЯГ 32 ОНООНД ХҮРЭХ · РОБОТТОЙ",
    overline: "ᠳᠥᠷᠪᠡᠨ ᠪᠡᠷᠬᠡ",
    rollingHint: "⏳ Шагайнууд бууж байна...",
    robotRolling: "🤖 Робот орхиж байна...",
    throwButton: "💢 Шагай орхих",
    throwingButton: "💢 Бууж байна...",
    waitingRobot: "🤖 Роботын ээлж...",
    yourTurn: (left) =>
      left > 0
        ? `Таны ээлж — ${left} оноо дутуу (хэтэрвэл 0-с эхэлнэ)`
        : "Та яг 32-т хүрлээ!",
    youBusted: "💥 Хэтэрлээ — оноо 0-c эхэлнэ",
    robotBusted: "💥 Робот хэтэрлээ — роботын оноо 0 боллоо",
    robotThinking: "🤖 Робот орхиж байна...",
    youWon: "ТА 32 ОНОО ЯГ АВЛАА!",
    youWonFourHorses: "🏆 ДӨРВӨН МОРЬ — ШУУД ЯЛАЛТ!",
    robotWon: "Робот 32 оноо авлаа",
    robotWonFourHorses: "🤖 РОБОТ: ДӨРВӨН МОРЬ — ШУУД ЯЛАЛТ",
    score: "Оноо",
    target: `Яг ${TARGET_SCORE} оноонд хүрвэл ялна`,
    you: "ТА",
    robot: "РОБОТ",
    playerGot: (pts) => `+${pts} оноо танд`,
    playerZero: "0 оноо — тохирол байхгүй",
    robotGot: (pts) => `+${pts} оноо роботонд`,
    rulesTitle: "ТОГЛООМЫН ДҮРЭМ",
    howToPlay:
      "4 шагай орхиод тохирсон талаар оноо хуримтлуулна. Яг 32 оноонд хүрвэл ялна. 32-оос давбал оноо 0-с дахин эхэлнэ.",
    rules: [
      { n: "①", t: "4 шагай орхих", d: "Ээлж бүрд" },
      { n: "②", t: "Онооны тохирол", d: "Онооны хүснэгтийг харна уу" },
      { n: "③", t: "Роботын ээлж", d: "Автоматаар шидэнэ" },
      { n: "④", t: "Ялалт", d: "Түрүүлж яг 32 оноонд хүр" },
      { n: "⑤", t: "Хэтэрвэл", d: "Оноо 0-с эхэлнэ, тоглоом үргэлжилнэ" },
    ],
    scoringTitle: "ОНООНЫ ХҮСНЭГТ",
    scoring: [
      { label: "4 морь (бүгд морины тал)", pts: "Ялна" },
      { label: "4 өөр тал (Дөрвөн бэрх)", pts: "+8" },
      { label: "4 ижил (4 морь биш)", pts: "+4" },
      { label: "Ямар ч 2+2 хос (хоёр төрөл тус бүр 2)", pts: "+2" },
      { label: "Бусад тохиолдол", pts: "0" },
    ],
    statistic: "СТАТИСТИК",
    stats: [
      { label: "Таны оноо", valueKey: "playerScore" },
      { label: "Роботын оноо", valueKey: "robotScore" },
      { label: "Нийт шидэлт", valueKey: "totalThrows" },
      { label: "Дараалсан", valueKey: "streak" },
    ],
    historyTitle: "СҮҮЛИЙН ШИДЭЛТҮҮД",
    historyEmpty: "Түүх хоосон",
    resetBtn: "Шинээр эхлэх",
    shagaiSidesLabel: "ШАГАЙН ТАЛУУД",
    rewardLabel: "ШАГНАЛ (SESSION)",
    playerTag: "ТА",
    robotTag: "РОБОТ",
    tapHint: "Шагай дээр дарж ч шидэж болно",
    labels: {
      "": "",
      berkh: "Дөрвөн бэрх (4 өөр)",
      ijil: "Дөрвөн ижил",
      hoyorHoyor: "Хоёр хос (2+2)",
      durvenMori: "Дөрвөн морь — шууд ялалт",
    },
  };
  return { ...(language === "en" ? en : mn), language };
}

function GoldDivider() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        margin: "6px 0",
      }}
    >
      <div
        style={{
          flex: 1,
          height: 1,
          background: "linear-gradient(to right, transparent, #c8a030)",
        }}
      />
      <span style={{ color: "#c8a030", fontSize: 10 }}>❖</span>
      <div
        style={{
          flex: 1,
          height: 1,
          background: "linear-gradient(to left, transparent, #c8a030)",
        }}
      />
    </div>
  );
}

function CurrentResult({
  sides,
  highlight,
  language,
}: {
  sides: (ShagaiSide | null)[];
  highlight: boolean;
  language: "mn" | "en";
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        justifyContent: "center",
        margin: "10px 0",
      }}
    >
      {sides.map((side, i) => {
        const info = side ? SHAGAI_INFO[side] : null;
        return (
          <div
            key={i}
            style={{
              width: 62,
              height: 78,
              borderRadius: 12,
              border: `2px solid ${info ? info.color + "88" : "rgba(255,255,255,0.1)"}`,
              background: info
                ? `rgba(${hexToRgb(info.color)},0.12)`
                : "rgba(255,255,255,0.03)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              padding: 4,
              transition: "all 0.4s cubic-bezier(0.34,1.56,0.64,1)",
              transform: info && highlight ? "scale(1.1)" : "scale(1)",
              boxShadow: info && highlight ? `0 0 16px ${info.glow}` : "none",
            }}
          >
            {side ? (
              <ShagaiSideImage side={side} size={40} highlight={highlight} />
            ) : (
              <span style={{ fontSize: 18, lineHeight: 1 }}>❓</span>
            )}
            <span
              style={{
                fontSize: 10,
                color: info ? info.color : "#555",
                letterSpacing: 0.5,
                fontFamily:
                  "var(--font-inter), -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
              }}
            >
              {side ? sideName(side, language) : "—"}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function RobotPanel({
  sides,
  revealed,
  thinking,
  points,
  label,
  t,
  language,
}: {
  sides: ShagaiSide[] | null;
  revealed: boolean;
  thinking: boolean;
  points: number;
  label: string;
  t: UiStrings;
  language: "mn" | "en";
}) {
  return (
    <div
      style={{
        background: "rgba(224,96,80,0.08)",
        border: "1px solid rgba(224,96,80,0.28)",
        borderRadius: 12,
        padding: "10px 12px",
        marginTop: 10,
        textAlign: "center",
      }}
    >
      <div
        style={{
          color: "#e06050",
          fontSize: 11,
          letterSpacing: 3,
          marginBottom: 6,
          fontWeight: "bold",
        }}
      >
        🤖 {t.robotTag}
      </div>
      {thinking && !revealed ? (
        <div
          style={{
            color: "#ccc",
            fontSize: 12,
            padding: "10px 0",
            animation: "pulse 1.2s infinite",
          }}
        >
          {t.robotThinking}
        </div>
      ) : sides && revealed ? (
        <>
          <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
            {sides.map((s, i) => {
              const info = SHAGAI_INFO[s];
              return (
                <div
                  key={i}
                  style={{
                    width: 46,
                    height: 58,
                    borderRadius: 10,
                    border: `2px solid ${info.color}88`,
                    background: `rgba(${hexToRgb(info.color)},0.12)`,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 2,
                  }}
                >
                  <ShagaiSideImage side={s} size={28} />
                  <span
                    style={{
                      fontSize: 9,
                      color: info.color,
                      letterSpacing: 0.3,
                    }}
                  >
                    {sideName(s, language)}
                  </span>
                </div>
              );
            })}
          </div>
          <div
            style={{
              color: "#f0c040",
              fontSize: 13,
              fontWeight: "bold",
              marginTop: 6,
            }}
          >
            {t.robotGot(points)}
          </div>
          {label ? (
            <div style={{ color: "#c8a030", fontSize: 10, marginTop: 2 }}>
              {label}
            </div>
          ) : null}
        </>
      ) : (
        <div style={{ color: "#555", fontSize: 11, padding: "10px 0" }}>—</div>
      )}
    </div>
  );
}

function HistoryList({
  history,
  t,
  language,
}: {
  history: GameState["history"];
  t: UiStrings;
  language: "mn" | "en";
}) {
  if (history.length === 0)
    return (
      <div
        style={{
          color: "#444",
          fontSize: 11,
          textAlign: "center",
          padding: "8px 0",
        }}
      >
        {t.historyEmpty}
      </div>
    );
  const recent = [...history].reverse().slice(0, 6);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {recent.map((r, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "5px 8px",
            background: r.instantMatchWin
              ? "rgba(200,160,48,0.22)"
              : r.exactWin
                ? "rgba(200,160,48,0.18)"
                : r.bust
                  ? "rgba(224,96,80,0.18)"
                  : r.turn === "robot"
                    ? "rgba(224,96,80,0.06)"
                    : "rgba(96,192,96,0.05)",
            borderRadius: 8,
            border:
              r.instantMatchWin || r.exactWin
                ? "1px solid rgba(200,160,48,0.45)"
                : r.bust
                  ? "1px solid rgba(224,96,80,0.45)"
                  : "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                fontSize: 9,
                color: r.turn === "robot" ? "#e06050" : "#60c060",
                letterSpacing: 1,
                minWidth: 30,
              }}
            >
              {r.turn === "robot" ? t.robotTag : t.playerTag}
            </span>
            <div style={{ display: "flex", gap: 3 }}>
              {r.sides.map((s, j) => (
                <span
                  key={j}
                  title={sideName(s, language)}
                  style={{ fontSize: 14 }}
                >
                  {SHAGAI_INFO[s].symbol}
                </span>
              ))}
            </div>
          </div>
          <span
            style={{
              color: r.bust ? "#e06050" : "#f0c040",
              fontSize: 11,
              fontWeight: "bold",
            }}
          >
            {r.bust ? "💥" : r.instantMatchWin ? "🏆" : `+${r.points}`}
          </span>
        </div>
      ))}
    </div>
  );
}

function TargetRulesAsideBody({
  showRulesHeading,
  t,
  state,
  settledSides,
  language,
  sessionGain,
  matchOver,
  onReset,
}: {
  showRulesHeading: boolean;
  t: UiStrings;
  state: GameState;
  settledSides: (ShagaiSide | null)[];
  language: "mn" | "en";
  sessionGain?: { coins: number; gems: number };
  matchOver: boolean;
  onReset: () => void;
}) {
  return (
    <>
      {showRulesHeading ? (
        <div
          style={{
            color: "#c8a030",
            fontSize: 11,
            letterSpacing: 3,
            marginBottom: 8,
          }}
        >
          {t.rulesTitle}
        </div>
      ) : null}
      <div
        style={{
          color: "#888",
          fontSize: 11,
          marginBottom: 8,
          lineHeight: 1.5,
        }}
      >
        {t.howToPlay}
      </div>
      {t.rules.map((r) => (
        <div
          key={r.n}
          style={{
            display: "flex",
            gap: 10,
            marginBottom: 6,
            alignItems: "flex-start",
          }}
        >
          <span style={{ color: "#c8a030", fontSize: 13, minWidth: 16 }}>
            {r.n}
          </span>
          <div>
            <div style={{ color: "#ddd", fontSize: 12 }}>{r.t}</div>
            <div style={{ color: "#666", fontSize: 11 }}>{r.d}</div>
          </div>
        </div>
      ))}

      <GoldDivider />

      <div
        style={{
          color: "#c8a030",
          fontSize: 11,
          letterSpacing: 3,
          marginBottom: 6,
        }}
      >
        {t.scoringTitle}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {t.scoring.map((s) => (
          <div
            key={s.label}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: 11,
              color: "#bbb",
              padding: "3px 6px",
              background: "rgba(255,255,255,0.03)",
              borderRadius: 6,
            }}
          >
            <span>{s.label}</span>
            <span
              style={{
                color: s.pts === "0" ? "#666" : "#f0c040",
                fontWeight: "bold",
              }}
            >
              {s.pts}
            </span>
          </div>
        ))}
      </div>

      <GoldDivider />

      <div
        style={{
          color: "#c8a030",
          fontSize: 11,
          letterSpacing: 3,
          marginBottom: 6,
        }}
      >
        {t.statistic}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 6,
          marginBottom: 8,
        }}
      >
        {t.stats.map(({ label, valueKey }) => (
          <div
            key={label}
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 8,
              padding: "6px 8px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                color:
                  valueKey === "playerScore"
                    ? "#60c060"
                    : valueKey === "robotScore"
                      ? "#e06050"
                      : "#f0c040",
                fontSize: 16,
                fontWeight: "bold",
              }}
            >
              {String(state[valueKey] ?? 0)}
            </div>
            <div style={{ color: "#666", fontSize: 9, marginTop: 2 }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      <GoldDivider />

      <div
        style={{
          color: "#666",
          fontSize: 10,
          letterSpacing: 2,
          marginBottom: 6,
        }}
      >
        {t.shagaiSidesLabel}
      </div>
      {(["horse", "sheep", "goat", "camel"] as ShagaiSide[]).map((side) => {
        const info = SHAGAI_INFO[side];
        const isSettled = settledSides.includes(side);
        return (
          <div
            key={side}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "3px 6px",
              borderRadius: 6,
              marginBottom: 2,
              background: isSettled
                ? `rgba(${hexToRgb(info.color)},0.12)`
                : "transparent",
              border: isSettled
                ? `1px solid ${info.color}44`
                : "1px solid transparent",
              transition: "all 0.3s",
            }}
          >
            <span style={{ fontSize: 15 }}>{info.symbol}</span>
            <span
              style={{
                color: isSettled ? info.color : "#666",
                fontSize: 12,
                flex: 1,
              }}
            >
              {sideName(side, language)}
            </span>
            {isSettled && (
              <span style={{ color: info.color, fontSize: 14 }}>✓</span>
            )}
          </div>
        );
      })}

      <GoldDivider />

      <div
        style={{
          color: "#666",
          fontSize: 10,
          letterSpacing: 2,
          marginBottom: 6,
        }}
      >
        {t.historyTitle}
      </div>
      <HistoryList history={state.history} t={t} language={language} />

      {sessionGain && (sessionGain.coins > 0 || sessionGain.gems > 0) ? (
        <>
          <GoldDivider />
          <div
            style={{
              color: "#c8a030",
              fontSize: 10,
              letterSpacing: 3,
              marginBottom: 4,
            }}
          >
            {t.rewardLabel}
          </div>
          <div
            style={{
              display: "flex",
              gap: 10,
              fontSize: 12,
              color: "#ddd",
            }}
          >
            <span style={{ color: "#f0c040", fontWeight: "bold" }}>
              🪙 +{sessionGain.coins}
            </span>
            <span style={{ color: "#bfe6ff", fontWeight: "bold" }}>
              💎 +{sessionGain.gems}
            </span>
          </div>
        </>
      ) : null}

      {state.totalThrows > 0 && !matchOver && (
        <button
          type="button"
          onClick={() => {
            playButtonClick();
            onReset();
          }}
          style={{
            width: "100%",
            marginTop: 10,
            padding: "7px 0",
            fontSize: 11,
            letterSpacing: 1,
            background: "rgba(255,255,255,0.04)",
            color: "#666",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 8,
            cursor: "pointer",
            fontFamily:
              "var(--font-inter), -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            const b = e.currentTarget as HTMLButtonElement;
            b.style.color = "#c8a030";
            b.style.borderColor = "rgba(200,160,48,0.3)";
          }}
          onMouseLeave={(e) => {
            const b = e.currentTarget as HTMLButtonElement;
            b.style.color = "#666";
            b.style.borderColor = "rgba(255,255,255,0.08)";
          }}
        >
          {t.resetBtn}
        </button>
      )}
    </>
  );
}

export default function ShagaiTargetUI({
  state,
  onThrow,
  onReset,
  settledSides,
  rewardEvents = [],
  sessionGain,
  currentTurn = "player",
}: Props) {
  const t = useI18n();
  const language = t.language;
  const narrowUi = useGameUiNarrow();
  const [rulesOpen, setRulesOpen] = useState(false);
  const rulesFabLabel = language === "mn" ? "Дүрэм" : "Rules";
  const mainPanelChrome = narrowUi
    ? gamePanelPlayNarrowBottom()
    : gamePanelLeftDesktop(300);
  const mainPanelPad: React.CSSProperties = narrowUi
    ? { padding: "10px 12px 12px" }
    : {};
  const canThrow = state.phase === "idle" || state.phase === "robotResult";
  const matchOver = state.phase === "matchOver";
  const playerWon = matchOver && state.winner === "player";
  const robotWon = matchOver && state.winner === "robot";
  const lastRound = state.history[state.history.length - 1];
  const playerExactThisRound =
    state.phase === "playerResult" && !!lastRound?.exactWin;

  const statusLine = (() => {
    if (matchOver) {
      const last = state.history[state.history.length - 1];
      if (playerWon) {
        return last?.instantMatchWin ? t.youWonFourHorses : t.youWon;
      }
      if (robotWon) {
        return last?.instantMatchWin ? t.robotWonFourHorses : t.robotWon;
      }
      return "";
    }
    if (state.phase === "throwing" || state.phase === "settling") {
      return currentTurn === "robot" ? t.robotRolling : t.rollingHint;
    }
    if (state.phase === "playerResult") {
      if (playerExactThisRound) return t.youWon;
      if (lastRound?.bust) return t.youBusted;
      if (state.lastPlayerPoints === 0) return t.playerZero;
      return t.playerGot(state.lastPlayerPoints);
    }
    if (state.phase === "robotThinking") {
      return t.robotThinking;
    }
    if (state.phase === "robotResult") {
      if (lastRound?.bust && lastRound.turn === "robot") return t.robotBusted;
      const left = Math.max(0, TARGET_SCORE - state.playerScore);
      return t.yourTurn(left);
    }
    return t.yourTurn(TARGET_SCORE);
  })();

  const panel: React.CSSProperties = {
    position: "absolute",
    background: "rgba(6,4,2,0.90)",
    border: "1px solid rgba(200,160,48,0.28)",
    borderRadius: 16,
    padding: "16px 16px 14px",
    backdropFilter: "blur(16px)",
    boxShadow: "0 8px 40px rgba(0,0,0,0.7)",
    fontFamily:
      "var(--font-inter), -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
    color: "white",
    zIndex: 10,
    maxHeight: "calc(100% - 40px)",
    overflowY: "auto",
    overflowX: "hidden",
    scrollbarWidth: "thin",
    scrollbarColor: "rgba(200,160,48,0.35) transparent",
  } as React.CSSProperties;

  const pctPlayer = Math.min(100, (state.playerScore / TARGET_SCORE) * 100);
  const pctRobot = Math.min(100, (state.robotScore / TARGET_SCORE) * 100);
  // Score now resets to 0 on overshoot, so flag the busting turn by looking
  // at the most recent round's `bust` flag while its result is still on screen.
  const playerBust =
    state.phase === "playerResult" &&
    !!lastRound?.bust &&
    lastRound?.turn === "player";
  const robotBust =
    (state.phase === "robotResult" || state.phase === "robotThinking") &&
    !!lastRound?.bust &&
    lastRound?.turn === "robot";

  return (
    <>
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 20,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 18,
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          {rewardEvents.map((e) => (
            <div
              key={e.id}
              style={{
                marginBottom: 8,
                display: "flex",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  padding: "8px 12px",
                  borderRadius: 999,
                  border:
                    e.kind === "coins"
                      ? "1px solid rgba(240,192,64,0.55)"
                      : "1px solid rgba(96,192,255,0.55)",
                  background:
                    e.kind === "coins"
                      ? "linear-gradient(135deg, rgba(200,160,48,0.26), rgba(240,192,64,0.12))"
                      : "linear-gradient(135deg, rgba(96,192,255,0.22), rgba(180,220,255,0.10))",
                  color: e.kind === "coins" ? "#f0c040" : "#bfe6ff",
                  fontSize: 13,
                  fontWeight: 900,
                  letterSpacing: 1.2,
                  fontFamily:
                    "var(--font-inter), -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
                  boxShadow:
                    e.kind === "coins"
                      ? "0 10px 40px rgba(200,160,48,0.18)"
                      : "0 10px 40px rgba(96,192,255,0.14)",
                  animation: "rewardFloat 1.25s ease forwards",
                }}
              >
                {e.text}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        className="shagai-target-panel"
        style={{ ...panel, ...mainPanelPad, ...mainPanelChrome }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              color: "#f0c040",
              fontSize: narrowUi ? 16 : 20,
              fontWeight: "bold",
              letterSpacing: narrowUi ? 2 : 3,
              textShadow: "0 0 20px rgba(240,192,64,0.4)",
            }}
          >
            {t.title}
          </div>
          {!narrowUi ? (
            <div style={{ color: "#666", fontSize: 8, letterSpacing: 2 }}>
              {t.subtitle}
            </div>
          ) : null}
        </div>

        <GoldDivider />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
            marginBottom: 6,
          }}
        >
          <ScoreCell
            label={t.you}
            value={state.playerScore}
            color={playerBust ? "#e06050" : "#60c060"}
            pct={pctPlayer}
            bust={playerBust}
          />
          <ScoreCell
            label={t.robot}
            value={state.robotScore}
            color={robotBust ? "#e06050" : "#e08040"}
            pct={pctRobot}
            bust={robotBust}
          />
        </div>
        <div
          style={{
            color: "#666",
            fontSize: 8,
            textAlign: "center",
            letterSpacing: 1,
          }}
        >
          {t.target}
        </div>

        <GoldDivider />

        <div
          style={{
            color:
              matchOver && playerWon
                ? "#f0c040"
                : matchOver && !playerWon
                  ? "#e06050"
                  : playerExactThisRound
                    ? "#f0c040"
                    : "#888",
            fontSize: 12,
            textAlign: "center",
            marginBottom: 6,
            letterSpacing: 1,
            fontWeight: playerExactThisRound || matchOver ? "bold" : "normal",
            textShadow:
              playerExactThisRound || matchOver
                ? "0 0 10px rgba(240,192,64,0.5)"
                : "none",
          }}
        >
          {statusLine}
        </div>

        <CurrentResult
          sides={settledSides}
          highlight={playerExactThisRound}
          language={language}
        />

        {state.lastPlayerLabel && state.phase === "playerResult" ? (
          <div
            style={{
              textAlign: "center",
              color: "#c8a030",
              fontSize: 11,
              marginTop: -4,
              marginBottom: 6,
            }}
          >
            {t.labels[state.lastPlayerLabel as ScoreLabelKey] ?? ""}
          </div>
        ) : null}

        {(state.phase === "robotThinking" ||
          state.phase === "robotResult" ||
          (state.phase === "matchOver" && state.robotSides)) && (
          <RobotPanel
            sides={state.robotSides}
            revealed={
              state.phase === "robotResult" || state.phase === "matchOver"
            }
            thinking={state.phase === "robotThinking"}
            points={state.robotPoints}
            label={t.labels[state.robotLabel as ScoreLabelKey] ?? ""}
            t={t}
            language={language}
          />
        )}

        {matchOver && (
          <div
            style={{
              background: playerWon
                ? "rgba(200,160,48,0.15)"
                : "rgba(224,96,80,0.12)",
              border: playerWon
                ? "1px solid rgba(200,160,48,0.5)"
                : "1px solid rgba(224,96,80,0.35)",
              borderRadius: 10,
              padding: "10px 12px",
              margin: "10px 0",
              textAlign: "center",
              animation: playerWon
                ? "glow 1.5s ease-in-out infinite alternate"
                : undefined,
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 4 }}>
              {playerWon ? "🏆" : "🤖"}
            </div>
            <div
              style={{
                color: playerWon ? "#f0c040" : "#e06050",
                fontSize: 15,
                fontWeight: "bold",
                letterSpacing: 2,
              }}
            >
              {playerWon ? t.youWon : t.robotWon}
            </div>
            <div style={{ color: "#aaa", fontSize: 11, marginTop: 4 }}>
              {state.playerScore} : {state.robotScore}
            </div>
          </div>
        )}

        <GoldDivider />

        <button
          onClick={() => {
            playButtonClick();
            (matchOver ? onReset : onThrow)();
          }}
          disabled={!matchOver && !canThrow}
          style={{
            width: "100%",
            padding: "8px 0",
            fontSize: 15,
            fontWeight: "bold",
            letterSpacing: 2,
            fontFamily:
              "var(--font-inter), -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
            background:
              matchOver || canThrow
                ? "linear-gradient(135deg, #c8a030, #f0c040 50%, #c8a030)"
                : "rgba(60,50,20,0.5)",
            color: matchOver || canThrow ? "#1a0e00" : "#555",
            border: "none",
            borderRadius: 10,
            cursor: matchOver || canThrow ? "pointer" : "not-allowed",
            transition: "all 0.2s",
            boxShadow:
              matchOver || canThrow
                ? "0 4px 20px rgba(200,160,48,0.4)"
                : "none",
          }}
          onMouseEnter={(e) => {
            if (matchOver || canThrow)
              (e.currentTarget as HTMLButtonElement).style.transform =
                "scale(1.02)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
          }}
        >
          {matchOver
            ? t.resetBtn
            : state.phase === "throwing" || state.phase === "settling"
              ? t.throwingButton
              : state.phase === "robotThinking" ||
                  state.phase === "playerResult"
                ? t.waitingRobot
                : t.throwButton}
        </button>

        <div
          style={{
            color: "#444",
            fontSize: 8,
            textAlign: "center",
            marginTop: 4,
          }}
        >
          {t.tapHint}
        </div>
      </div>

      {!narrowUi ? (
        <div
          className="shagai-target-panel"
          style={{ ...panel, ...gamePanelRightDesktop(260) }}
        >
          <TargetRulesAsideBody
            showRulesHeading
            t={t}
            state={state}
            settledSides={settledSides}
            language={language}
            sessionGain={sessionGain}
            matchOver={matchOver}
            onReset={onReset}
          />
        </div>
      ) : (
        <>
          <GameRulesFab
            onClick={() => {
              playButtonClick();
              setRulesOpen(true);
            }}
            label={rulesFabLabel}
          />
          <GameRulesSheet
            open={rulesOpen}
            onClose={() => setRulesOpen(false)}
            title={t.rulesTitle}
          >
            <TargetRulesAsideBody
              showRulesHeading={false}
              t={t}
              state={state}
              settledSides={settledSides}
              language={language}
              sessionGain={sessionGain}
              matchOver={matchOver}
              onReset={onReset}
            />
          </GameRulesSheet>
        </>
      )}

      <style>{`
        @keyframes glow {
          from { box-shadow: 0 0 10px rgba(200,160,48,0.3); }
          to   { box-shadow: 0 0 30px rgba(200,160,48,0.7); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.4; }
        }
        @keyframes rewardFloat {
          0%   { opacity: 0; transform: translateY(10px) scale(0.98); }
          15%  { opacity: 1; transform: translateY(0px)  scale(1); }
          70%  { opacity: 1; transform: translateY(-18px) scale(1.02); }
          100% { opacity: 0; transform: translateY(-32px) scale(1.03); }
        }
        .shagai-target-panel::-webkit-scrollbar { width: 6px; }
        .shagai-target-panel::-webkit-scrollbar-track { background: transparent; }
        .shagai-target-panel::-webkit-scrollbar-thumb {
          background: rgba(200,160,48,0.35);
          border-radius: 3px;
        }
        .shagai-target-panel::-webkit-scrollbar-thumb:hover {
          background: rgba(200,160,48,0.55);
        }
      `}</style>
    </>
  );
}

function ScoreCell({
  label,
  value,
  color,
  pct,
  bust,
}: {
  label: string;
  value: number;
  color: string;
  pct: number;
  bust?: boolean;
}) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.03)",
        border: `1px solid ${color}33`,
        borderRadius: 10,
        padding: "6px 8px",
        position: "relative",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 4,
        }}
      >
        <span style={{ color: "#aaa", fontSize: 10, letterSpacing: 2 }}>
          {label}
        </span>
        <span
          style={{
            color,
            fontSize: 18,
            fontWeight: "bold",
            fontFamily:
              "var(--font-inter), -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
          }}
        >
          {value}
          {bust ? " 💥" : ""}
        </span>
      </div>
      <div
        style={{
          height: 5,
          width: "100%",
          borderRadius: 4,
          background: "rgba(255,255,255,0.06)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: color,
            transition: "width 0.5s ease",
          }}
        />
      </div>
    </div>
  );
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}
