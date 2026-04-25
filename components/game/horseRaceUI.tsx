"use client";

import { RaceState, Racer, TRACK_LENGTH } from "./horseRaceType";
import type { ShagaiSide } from "./shagai";
import { SHAGAI_INFO, sideName } from "./fourBonusType";
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

export const HORSE_MP_COLORS = [
  "#60c060",
  "#5ab0ff",
  "#e88a5a",
  "#c86fe8",
];

interface Props {
  state: RaceState;
  onThrow: () => void;
  onReset: () => void;
  settledSides: (ShagaiSide | null)[];
  currentTurn: Racer;
  rewardEvents?: { id: string; text: string; kind: "coins" | "gems" }[];
  sessionGain?: { coins: number; gems: number };
  uiMode?: "robot" | "mp";
  mp?: {
    myId: string;
    nameById: Record<string, string>;
    order: string[];
    turnPlayerId: string;
    positions: Record<string, number>;
  };
  mpToastText?: string | null;
  mpWinnerId?: string | null;
}

type RaceI18n = {
  title: string;
  subtitle: string;
  overline: string;
  rollingHint: string;
  throwButton: string;
  throwingButton: string;
  waitingRobot: string;
  playerTurn: (needed: number) => string;
  robotTurn: string;
  robotThinking: string;
  playerAdvanced: (horses: number) => string;
  robotAdvanced: (horses: number) => string;
  noMoveThisTurn: string;
  youWonMatch: string;
  robotWonMatch: string;
  you: string;
  robot: string;
  target: string;
  position: string;
  rulesTitle: string;
  howToPlay: string;
  rules: { n: string; t: string; d: string }[];
  scoringTitle: string;
  scoring: { label: string; pts: string }[];
  statistic: string;
  stats: {
    label: string;
    valueKey: "playerPosition" | "robotPosition" | "totalThrows";
  }[];
  historyTitle: string;
  historyEmpty: string;
  resetBtn: string;
  rewardLabel: string;
  playerTag: string;
  robotTag: string;
  horsesCount: (n: number) => string;
};

function useRaceI18n(): RaceI18n & { language: "mn" | "en" } {
  const { language } = useApp();
  const en: RaceI18n = {
    title: "HORSE RACE",
    subtitle: "MORIN URALDAAN · VS ROBOT",
    overline: "ᠮᠣᠷᠢ ᠤᠷᠤᠯᠳᠤᠭᠠᠨ",
    rollingHint: "Shagai are falling…",
    throwButton: "Throw Shagai",
    throwingButton: "Throwing…",
    waitingRobot: "Robot's turn…",
    playerTurn: (needed) => `Your turn — ${needed} squares to go`,
    robotTurn: "Robot's turn",
    robotThinking: "Robot is thinking…",
    playerAdvanced: (h) => `+${h} forward (${h} horse${h === 1 ? "" : "s"})`,
    robotAdvanced: (h) => `Robot +${h} (${h} horse${h === 1 ? "" : "s"})`,
    noMoveThisTurn: "No horses landed — skip this turn.",
    youWonMatch: "YOU WIN THE RACE!",
    robotWonMatch: "Robot wins the race",
    you: "YOU",
    robot: "ROBOT",
    target: `First to square ${TRACK_LENGTH} wins`,
    position: "Square",
    rulesTitle: "HOW TO PLAY",
    howToPlay:
      "Throw 4 shagai. Every horse side you roll moves your racer one square along the 20-shagai track.",
    rules: [
      { n: "1.", t: "Your turn", d: "Throw 4 shagai" },
      { n: "2.", t: "Count horses", d: "Each horse = 1 forward step" },
      { n: "3.", t: "Robot throws", d: "Robot rolls automatically" },
      { n: "4.", t: "Win", d: `First to square ${TRACK_LENGTH}` },
    ],
    scoringTitle: "MOVEMENT",
    scoring: [
      { label: "1 horse", pts: "+1 step" },
      { label: "2 horses", pts: "+2 steps" },
      { label: "3 horses", pts: "+3 steps" },
      { label: "4 horses", pts: "+4 steps" },
    ],
    statistic: "STATISTICS",
    stats: [
      { label: "Your square", valueKey: "playerPosition" },
      { label: "Robot square", valueKey: "robotPosition" },
      { label: "Total throws", valueKey: "totalThrows" },
    ],
    historyTitle: "RECENT ROLLS",
    historyEmpty: "No history yet",
    resetBtn: "Restart",
    rewardLabel: "REWARD (SESSION)",
    playerTag: "YOU",
    robotTag: "ROBOT",
    horsesCount: (n) => `${n} horse${n === 1 ? "" : "s"}`,
  };
  const mn: RaceI18n = {
    title: "МОРЬ УРАЛДАХ",
    subtitle: "МОРЬ УРАЛДУУЛАХ · VS РОБОТ",
    overline: "ᠮᠣᠷᠢ ᠤᠷᠤᠯᠳᠤᠭᠠᠨ",
    rollingHint: "Шагайнууд бууж байна...",
    throwButton: "Шагай орхих",
    throwingButton: "Бууж байна…",
    waitingRobot: "Роботын ээлж…",
    playerTurn: (needed) => `Таны ээлж — ${needed} шагай үлдлээ`,
    robotTurn: "Роботын ээлж",
    robotThinking: "Робот орхиж байна...",
    playerAdvanced: (h) => `+${h} урагш (${h} морь)`,
    robotAdvanced: (h) => `Робот +${h} (${h} морь)`,
    noMoveThisTurn: "Морь буугаагүй — ээлжээ алдлаа.",
    youWonMatch: "ТА УРАЛДААНД ТҮРҮҮЛЛЭЭ!",
    robotWonMatch: "Робот уралдаанд түрүүллээ",
    you: "ТА",
    robot: "РОБОТ",
    target: `Хэн түрүүлж ${TRACK_LENGTH}-р шагайнд хүрвэл ялна`,
    position: "Шагай",
    rulesTitle: "ТОГЛООМЫН ДҮРЭМ",
    howToPlay:
      "4 шагай орхиод, буусан морь бүрээр өөрийн морийг 20 шагайн замаар 1 алхам урагш ахиулна.",
    rules: [
      { n: "1.", t: "Таны ээлж", d: "4 шагай орхих" },
      { n: "2.", t: "Морь явуулах", d: "1 морь = 1 алхам урагш" },
      { n: "3.", t: "Робот шидэх", d: "Робот автоматаар шидэнэ" },
      { n: "4.", t: "Ялалт", d: `Түрүүлж ${TRACK_LENGTH}-р шагайнд хүрвэл` },
    ],
    scoringTitle: "ХӨДӨЛГӨӨН",
    scoring: [
      { label: "1 морь", pts: "+1 алхам" },
      { label: "2 морь", pts: "+2 алхам" },
      { label: "3 морь", pts: "+3 алхам" },
      { label: "4 морь", pts: "+4 алхам" },
    ],
    statistic: "СТАТИСТИК",
    stats: [
      { label: "Таны шагай", valueKey: "playerPosition" },
      { label: "Роботын шагай", valueKey: "robotPosition" },
      { label: "Нийт шидэлт", valueKey: "totalThrows" },
    ],
    historyTitle: "СҮҮЛИЙН ШИДЭЛТҮҮД",
    historyEmpty: "Түүх хоосон",
    resetBtn: "Шинээр эхлэх",
    rewardLabel: "ШАГНАЛ",
    playerTag: "ТА",
    robotTag: "РОБОТ",
    horsesCount: (n) => `${n} морь`,
  };
  return { ...(language === "en" ? en : mn), language };
}

function hexToRgb(hex: string): string {
  const h = hex.replace("#", "");
  const n =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  const r = parseInt(n.substring(0, 2), 16);
  const g = parseInt(n.substring(2, 4), 16);
  const b = parseInt(n.substring(4, 6), 16);
  return `${r},${g},${b}`;
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

function TrackBarMulti({
  order,
  positions,
  nameById,
}: {
  order: string[];
  positions: Record<string, number>;
  nameById: Record<string, string>;
}) {
  const squares = Array.from({ length: TRACK_LENGTH }, (_, i) => i + 1);
  return (
    <div style={{ marginTop: 6 }}>
      <div
        style={{
          position: "relative",
          minHeight: 32,
          borderRadius: 10,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(200,160,48,0.22)",
          padding: "6px 6px 8px",
        }}
      >
        <div style={{ display: "flex", gap: 1 }}>
          {squares.map((sq) => {
            const by = order
              .map((id) => (positions[id] ?? 0) >= sq)
              .filter(Boolean).length;
            return (
              <div
                key={sq}
                style={{
                  flex: 1,
                  height: 14,
                  background:
                    by === 0
                      ? "rgba(255,255,255,0.1)"
                      : "rgba(200,180,100,0.25)",
                  borderRadius: 2,
                }}
                title={String(sq)}
              />
            );
          })}
        </div>
        <div
          style={{
            display: "grid",
            marginTop: 8,
            gap: 6,
            gridTemplateColumns: `repeat(${Math.min(2, order.length || 1)},1fr)`,
          }}
        >
          {order.map((id, idx) => {
            const p = positions[id] ?? 0;
            const pct = Math.min(100, (p / TRACK_LENGTH) * 100);
            const col = HORSE_MP_COLORS[idx % HORSE_MP_COLORS.length]!;
            return (
              <div
                key={id}
                style={{
                  background: col + "14",
                  border: `1px solid ${col}55`,
                  borderRadius: 10,
                  padding: "6px 8px",
                }}
              >
                <div
                  style={{
                    color: col,
                    fontSize: 9,
                    letterSpacing: 1,
                    fontWeight: "bold",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {(nameById[id] ?? id).slice(0, 10)} {p}/{TRACK_LENGTH}
                </div>
                <div
                  style={{
                    marginTop: 4,
                    height: 4,
                    background: "rgba(255,255,255,0.05)",
                    borderRadius: 2,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${pct}%`,
                      height: "100%",
                      background: col,
                      transition: "width 0.45s",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function TrackBar({
  playerPos,
  robotPos,
}: {
  playerPos: number;
  robotPos: number;
}) {
  const squares = Array.from({ length: TRACK_LENGTH }, (_, i) => i + 1);
  const pctPlayer = Math.min(100, (playerPos / TRACK_LENGTH) * 100);
  const pctRobot = Math.min(100, (robotPos / TRACK_LENGTH) * 100);
  return (
    <div style={{ marginTop: 6 }}>
      <div
        style={{
          position: "relative",
          height: 28,
          borderRadius: 10,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(200,160,48,0.22)",
          padding: "4px 6px",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", gap: 1 }}>
          {squares.map((sq) => {
            const reachedByPlayer = playerPos >= sq;
            const reachedByRobot = robotPos >= sq;
            const color = reachedByPlayer
              ? "#60c060"
              : reachedByRobot
                ? "#e06050"
                : "rgba(255,255,255,0.12)";
            return (
              <div
                key={sq}
                style={{
                  flex: 1,
                  height: 18,
                  background: color,
                  borderRadius: 2,
                  opacity: reachedByPlayer || reachedByRobot ? 0.85 : 0.5,
                }}
              />
            );
          })}
        </div>
      </div>
      <div
        style={{
          marginTop: 6,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 8,
        }}
      >
        <div
          style={{
            background: "rgba(96,192,96,0.08)",
            border: "1px solid rgba(96,192,96,0.35)",
            borderRadius: 10,
            padding: "6px 8px",
          }}
        >
          <div
            style={{
              color: "#60c060",
              fontSize: 9,
              letterSpacing: 2,
              fontWeight: "bold",
            }}
          >
            YOU {playerPos}/{TRACK_LENGTH}
          </div>
          <div
            style={{
              marginTop: 4,
              height: 4,
              background: "rgba(255,255,255,0.05)",
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${pctPlayer}%`,
                height: "100%",
                background: "#60c060",
                transition: "width 0.45s",
              }}
            />
          </div>
        </div>
        <div
          style={{
            background: "rgba(224,96,80,0.08)",
            border: "1px solid rgba(224,96,80,0.35)",
            borderRadius: 10,
            padding: "6px 8px",
          }}
        >
          <div
            style={{
              color: "#e06050",
              fontSize: 9,
              letterSpacing: 2,
              fontWeight: "bold",
            }}
          >
            ROBOT {robotPos}/{TRACK_LENGTH}
          </div>
          <div
            style={{
              marginTop: 4,
              height: 4,
              background: "rgba(255,255,255,0.05)",
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${pctRobot}%`,
                height: "100%",
                background: "#e06050",
                transition: "width 0.45s",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function CurrentResult({
  sides,
  language,
}: {
  sides: (ShagaiSide | null)[];
  language: "mn" | "en";
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 6,
        justifyContent: "center",
        margin: "8px 0",
      }}
    >
      {sides.map((side, i) => {
        const info = side ? SHAGAI_INFO[side] : null;
        const isHorse = side === "horse";
        return (
          <div
            key={i}
            style={{
              width: 54,
              height: 68,
              borderRadius: 10,
              border: `2px solid ${info ? info.color + "aa" : "rgba(255,255,255,0.1)"}`,
              background: info
                ? `rgba(${hexToRgb(info.color)},${isHorse ? 0.22 : 0.1})`
                : "rgba(255,255,255,0.03)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              padding: 3,
              transition: "all 0.4s cubic-bezier(0.34,1.56,0.64,1)",
              transform: isHorse ? "scale(1.06)" : "scale(1)",
              boxShadow: isHorse ? `0 0 14px ${info?.glow}` : "none",
            }}
          >
            {side ? (
              <ShagaiSideImage side={side} size={34} highlight={isHorse} />
            ) : (
              <span style={{ fontSize: 18, lineHeight: 1 }}>—</span>
            )}
            <span
              style={{
                fontSize: 9,
                color: info ? info.color : "#555",
                letterSpacing: 0.5,
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

function HistoryList({
  history,
  t,
  language,
  nameById,
}: {
  history: RaceState["history"];
  t: RaceI18n;
  language: "mn" | "en";
  nameById?: Record<string, string>;
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
            background:
              r.turn === "robot"
                ? "rgba(224,96,80,0.06)"
                : "rgba(96,192,96,0.05)",
            borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                fontSize: 9,
                color: r.turn === "robot" ? "#e06050" : "#60c060",
                letterSpacing: 1,
                minWidth: 30,
                maxWidth: 80,
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
              title={
                r.throwerId && nameById?.[r.throwerId]
                  ? nameById[r.throwerId]
                  : undefined
              }
            >
              {r.throwerId && nameById
                ? (nameById[r.throwerId] ?? t.playerTag).slice(0, 6)
                : r.turn === "robot"
                  ? t.robotTag
                  : t.playerTag}
            </span>
            <div style={{ display: "flex", gap: 3 }}>
              {r.sides.map((s, j) => (
                <span
                  key={j}
                  title={sideName(s, language)}
                  style={{
                    fontSize: 14,
                    opacity: s === "horse" ? 1 : 0.55,
                  }}
                >
                  {SHAGAI_INFO[s].symbol}
                </span>
              ))}
            </div>
          </div>
          <span
            style={{
              color: r.horseCount > 0 ? "#f0c040" : "#666",
              fontSize: 11,
              fontWeight: "bold",
            }}
          >
            +{r.horseCount}
          </span>
        </div>
      ))}
    </div>
  );
}

function HorseRaceRulesAsideBody({
  showRulesHeading,
  t,
  state,
  language,
  sessionGain,
  nameById,
}: {
  showRulesHeading: boolean;
  t: RaceI18n;
  state: RaceState;
  language: "mn" | "en";
  sessionGain?: { coins: number; gems: number };
  nameById?: Record<string, string>;
}) {
  return (
    <>
      {showRulesHeading ? (
        <div
          style={{
            color: "#c8a030",
            fontSize: 11,
            letterSpacing: 3,
            fontWeight: "bold",
            textAlign: "center",
          }}
        >
          {t.rulesTitle}
        </div>
      ) : null}
      <GoldDivider />
      <div
        style={{
          color: "#bbb",
          fontSize: 11,
          lineHeight: 1.5,
          marginBottom: 8,
        }}
      >
        {t.howToPlay}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {t.rules.map((r, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              padding: "5px 8px",
              background: "rgba(255,255,255,0.02)",
              borderRadius: 6,
            }}
          >
            <span style={{ color: "#f0c040", fontSize: 12, minWidth: 18 }}>
              {r.n}
            </span>
            <div>
              <div
                style={{ color: "#ddd", fontSize: 11, fontWeight: "bold" }}
              >
                {r.t}
              </div>
              <div style={{ color: "#888", fontSize: 10 }}>{r.d}</div>
            </div>
          </div>
        ))}
      </div>

      <GoldDivider />
      <div
        style={{
          color: "#c8a030",
          fontSize: 11,
          letterSpacing: 3,
          fontWeight: "bold",
          textAlign: "center",
        }}
      >
        {t.scoringTitle}
      </div>
      <GoldDivider />
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {t.scoring.map((s, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "4px 8px",
              background: "rgba(255,255,255,0.02)",
              borderRadius: 6,
              fontSize: 11,
            }}
          >
            <span style={{ color: "#ccc" }}>{s.label}</span>
            <span style={{ color: "#f0c040", fontWeight: "bold" }}>
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
          fontWeight: "bold",
          textAlign: "center",
        }}
      >
        {t.statistic}
      </div>
      <GoldDivider />
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {t.stats.map((s, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "4px 8px",
              background: "rgba(255,255,255,0.02)",
              borderRadius: 6,
              fontSize: 11,
            }}
          >
            <span style={{ color: "#aaa" }}>{s.label}</span>
            <span style={{ color: "#f0c040", fontWeight: "bold" }}>
              {state[s.valueKey]}
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
          fontWeight: "bold",
          textAlign: "center",
        }}
      >
        {t.historyTitle}
      </div>
      <GoldDivider />
      <HistoryList
        history={state.history}
        t={t}
        language={language}
        nameById={nameById}
      />

      {sessionGain && (sessionGain.coins > 0 || sessionGain.gems > 0) && (
        <>
          <GoldDivider />
          <div
            style={{
              color: "#c8a030",
              fontSize: 10,
              letterSpacing: 2,
              textAlign: "center",
            }}
          >
            {t.rewardLabel}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 12,
              marginTop: 4,
            }}
          >
            {sessionGain.coins > 0 && (
              <span style={{ color: "#f0c040", fontSize: 12 }}>
                +{sessionGain.coins} coins
              </span>
            )}
            {sessionGain.gems > 0 && (
              <span style={{ color: "#bfe6ff", fontSize: 12 }}>
                +{sessionGain.gems} gems
              </span>
            )}
          </div>
        </>
      )}
    </>
  );
}

export default function HorseRaceUI({
  state,
  onThrow,
  onReset,
  settledSides,
  currentTurn,
  rewardEvents = [],
  sessionGain,
  uiMode = "robot",
  mp,
  mpToastText = null,
  mpWinnerId = null,
}: Props) {
  const t = useRaceI18n();
  const language = t.language;
  const narrowUi = useGameUiNarrow();
  const [rulesOpen, setRulesOpen] = useState(false);
  const rulesFabLabel = language === "mn" ? "Дүрэм" : "Rules";
  const mainPanelChrome = narrowUi
    ? gamePanelPlayNarrowBottom()
    : gamePanelLeftDesktop(310);
  const mainPanelPad: React.CSSProperties = narrowUi
    ? { padding: "10px 12px 12px" }
    : {};
  const isMp = uiMode === "mp" && mp;

  const canThrow = isMp
    ? (state.phase === "idle" || state.phase === "playerResult") &&
      state.winner === null &&
      mp!.turnPlayerId === mp!.myId
    : (state.phase === "idle" ||
        state.phase === "playerResult" ||
        state.phase === "robotResult") &&
      state.winner === null;
  const matchOver = state.phase === "matchOver";
  const playerWon = isMp
    ? matchOver && mpWinnerId === mp?.myId
    : matchOver && state.winner === "player";
  const lastHist =
    state.history.length > 0 ? state.history[state.history.length - 1]! : null;
  const waitingOther =
    isMp &&
    mp &&
    !matchOver &&
    state.phase === "idle" &&
    mp.turnPlayerId !== mp.myId;

  const statusLine = (() => {
    if (isMp) {
      if (matchOver) {
        if (mpWinnerId === mp?.myId) return t.youWonMatch;
        const wn = mpWinnerId
          ? (mp.nameById[mpWinnerId] ?? "?")
          : "";
        return language === "en" ? `${wn} wins!` : `${wn} яллаа!`;
      }
      if (state.phase === "throwing" || state.phase === "settling")
        return t.rollingHint;
      if (state.phase === "playerResult" && lastHist) {
        if (lastHist.throwerId === mp?.myId) {
          return lastHist.horseCount > 0
            ? t.playerAdvanced(lastHist.horseCount)
            : t.noMoveThisTurn;
        }
        if (lastHist.throwerId) {
          const wn = mp.nameById[lastHist.throwerId] ?? "?";
          return language === "en"
            ? `${wn}: +${lastHist.horseCount} horses`
            : `${wn}: +${lastHist.horseCount} морь`;
        }
      }
      if (waitingOther) {
        const w = mp.nameById[mp.turnPlayerId] ?? "…";
        return language === "en" ? `Waiting: ${w}` : `Ээлж: ${w}`;
      }
      const need = Math.max(0, TRACK_LENGTH - (mp.positions[mp.myId] ?? 0));
      return t.playerTurn(need);
    }
    if (matchOver) return playerWon ? t.youWonMatch : t.robotWonMatch;
    if (state.phase === "throwing" || state.phase === "settling")
      return t.rollingHint;
    if (state.phase === "playerResult") {
      return state.lastPlayerHorseCount > 0
        ? t.playerAdvanced(state.lastPlayerHorseCount)
        : t.noMoveThisTurn;
    }
    if (state.phase === "robotThinking") return t.robotThinking;
    if (state.phase === "robotResult") {
      return state.robotHorseCount > 0
        ? t.robotAdvanced(state.robotHorseCount)
        : t.robotTurn;
    }
    const need = Math.max(0, TRACK_LENGTH - state.playerPosition);
    return t.playerTurn(need);
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
  };

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

      {/* LEFT PANEL */}
      <div
        className="horse-race-panel"
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
              {isMp
                ? language === "en"
                  ? "ONLINE RACE"
                  : "ONLINE · 2–4"
                : t.subtitle}
            </div>
          ) : null}
        </div>

        {mpToastText && (
          <div
            style={{
              textAlign: "center",
              color: "#f0c040",
              fontSize: 11,
              marginBottom: 4,
            }}
          >
            {mpToastText}
          </div>
        )}

        <GoldDivider />

        {isMp && mp ? (
          <TrackBarMulti
            order={mp.order}
            positions={mp.positions}
            nameById={mp.nameById}
          />
        ) : (
          <TrackBar
            playerPos={state.playerPosition}
            robotPos={state.robotPosition}
          />
        )}

        <div
          style={{
            color: "#666",
            fontSize: 9,
            textAlign: "center",
            letterSpacing: 1,
            marginTop: 6,
          }}
        >
          {t.target}
        </div>

        <GoldDivider />

        <div
          style={{
            color: matchOver
              ? playerWon
                ? "#f0c040"
                : "#e06050"
              : state.phase === "playerResult" && state.lastPlayerHorseCount > 0
                ? "#f0c040"
                : "#aaa",
            fontSize: 12,
            textAlign: "center",
            marginBottom: 6,
            letterSpacing: 1,
            minHeight: 18,
            fontWeight:
              matchOver ||
              (state.phase === "playerResult" && state.lastPlayerHorseCount > 0)
                ? "bold"
                : "normal",
          }}
        >
          {statusLine}
        </div>

        <CurrentResult sides={settledSides} language={language} />

        {!matchOver && (
          <button
            onClick={() => {
              playButtonClick();
              onThrow();
            }}
            disabled={!canThrow}
            style={{
              width: "100%",
              padding: "11px 0",
              marginTop: 6,
              borderRadius: 10,
              border: "1px solid rgba(200,160,48,0.5)",
              background: canThrow
                ? "linear-gradient(135deg, rgba(200,160,48,0.35), rgba(240,192,64,0.15))"
                : "rgba(255,255,255,0.04)",
              color: canThrow ? "#f0c040" : "#555",
              fontSize: 13,
              letterSpacing: 2,
              fontWeight: "bold",
              cursor: canThrow ? "pointer" : "not-allowed",
              transition: "all 0.2s",
            }}
          >
            {state.phase === "throwing" || state.phase === "settling"
              ? t.throwingButton
              : isMp && waitingOther
                ? t.waitingRobot
                : state.phase === "robotThinking"
                  ? t.waitingRobot
                  : currentTurn === "robot" && !canThrow
                    ? t.waitingRobot
                    : t.throwButton}
          </button>
        )}

        {matchOver && (
          <button
            onClick={() => {
              playButtonClick();
              onReset();
            }}
            style={{
              width: "100%",
              padding: "11px 0",
              marginTop: 6,
              borderRadius: 10,
              border: "1px solid rgba(200,160,48,0.5)",
              background:
                "linear-gradient(135deg, rgba(200,160,48,0.35), rgba(240,192,64,0.15))",
              color: "#f0c040",
              fontSize: 13,
              letterSpacing: 2,
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            {t.resetBtn}
          </button>
        )}
      </div>

      {!narrowUi ? (
        <div
          className="horse-race-panel-right"
          style={{ ...panel, ...gamePanelRightDesktop(300) }}
        >
          <HorseRaceRulesAsideBody
            showRulesHeading
            t={t}
            state={state}
            language={language}
            sessionGain={sessionGain}
            nameById={isMp ? mp.nameById : undefined}
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
            <HorseRaceRulesAsideBody
              showRulesHeading={false}
              t={t}
              state={state}
              language={language}
              sessionGain={sessionGain}
              nameById={isMp ? mp.nameById : undefined}
            />
          </GameRulesSheet>
        </>
      )}

      <style jsx>{`
        @keyframes rewardFloat {
          0% {
            transform: translateY(0) scale(0.85);
            opacity: 0;
          }
          20% {
            transform: translateY(-4px) scale(1.05);
            opacity: 1;
          }
          100% {
            transform: translateY(-38px) scale(1);
            opacity: 0;
          }
        }
      `}</style>
    </>
  );
}
