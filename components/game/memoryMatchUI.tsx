"use client";

import { useApp } from "@/components/AppContext";
import { playButtonClick } from "@/lib/uiSounds";
import { useMemo, type CSSProperties } from "react";
import {
  LuClock as IconClock,
  LuFootprints as IconMoves,
  LuCopy as IconPairs,
  LuPlay as IconPlay,
  LuRotateCcw as IconAgain,
} from "react-icons/lu";
import { GamePanelResultCard } from "./GamePanelResultCard";
import { GAME_CTA_PRIMARY, GAME_UI_FONT_FAMILY } from "./gameUiTheme";
import { MATCH_TIME_LIMIT_SEC } from "./memoryMatchType";
import { useMatchLobbyIntro } from "./gameModalSession";

type I18n = {
  title: string;
  overline: string;
  subtitle: string;
  time: string;
  moves: string;
  pairs: string;
  start: string;
  again: string;
  win: string;
  lose: string;
  howTitle: string;
  howLines: string[];
  playingHint: string;
  progressLabel: string;
  phasePlaying: string;
  phaseReady: string;
  mpWaitHint: string;
};

function useI18n(): I18n {
  const { language } = useApp();
  const lobbyIntroMn = useMatchLobbyIntro("mn");
  const lobbyIntroEn = useMatchLobbyIntro("en");
  return useMemo(() => {
    if (language === "mn") {
      return {
        title: "ХОС ОЛ",
        overline: "ᠰᠠᠨᠠᠬᠤᠢ ᠣᠢ ᠰᠣᠷᠢᠯᠲᠠ",
        subtitle: "Санах ой · анхаарал · логик",
        time: "Цаг",
        moves: "Алхам",
        pairs: "Хос",
        start: "Эхлэх",
        again: "Дахин тоглох",
        win: "Бүх хосыг оллоо!",
        lose: "Цаг дууслаа. Дахин оролдоорой.",
        howTitle: "Дүрэм",
        howLines: [
          "Картуудыг дарж эргүүлнэ — доор нь шагайн талууд нуугдана.",
          "Хоёр ижил дүрсийг дарахад хос гэж тооцогдоно.",
          "Бүх " + MATCH_TIME_LIMIT_SEC + " секундын дотор 8 хосыг ол.",
        ],
        playingHint: "Картуудыг хурдан хослуул — цагтаа багтах чухал.",
        progressLabel: "Явц",
        phasePlaying: "Тоглож байна",
        phaseReady: "Бэлэн",
        mpWaitHint: lobbyIntroMn.trim()
          ? `${lobbyIntroMn} Найз нэгдэхэд хамт эхэлнэ; ганцаар 10–15 секундын дараа самбар нээгдэнэ.`
          : "Самбар удахгүй нээгдэнэ.",
      };
    }
    return {
      title: "MEMORY PAIRS",
      overline: "LOGIC & FOCUS",
      subtitle: "Match every pair before the clock hits zero",
      time: "Time",
      moves: "Moves",
      pairs: "Pairs",
      start: "Start game",
      again: "Play again",
      win: "You cleared the board!",
      lose: "Time's up — try again.",
      howTitle: "How to play",
      howLines: [
        "Tap cards to flip and reveal traditional shagai sides.",
        "Two identical symbols lock in as a matched pair.",
        "Find all 8 pairs within " + MATCH_TIME_LIMIT_SEC + " seconds.",
      ],
      playingHint: "Flip quickly — the timer keeps running.",
      progressLabel: "Progress",
      phasePlaying: "Playing",
      phaseReady: "Ready",
      mpWaitHint: lobbyIntroEn.trim()
        ? `${lobbyIntroEn} If a friend joins, you start together; if you’re alone, the board opens automatically after about 10–15 seconds.`
        : "The board will open in a moment.",
    };
  }, [language, lobbyIntroMn, lobbyIntroEn]);
}

interface Props {
  phase: "idle" | "playing" | "won" | "lost";
  timeLeft: number;
  moves: number;
  pairsFound: number;
  onStart: () => void;
  onRestart: () => void;
  multiplayerAwaiting?: boolean;
}

const GOLD = "#c9a227";
const GOLD_DIM = "rgba(201, 162, 39, 0.55)";

export default function MemoryMatchUI({
  phase,
  timeLeft,
  moves,
  pairsFound,
  onStart,
  onRestart,
  multiplayerAwaiting = false,
}: Props) {
  const t = useI18n();
  const mm = Math.floor(Math.max(0, timeLeft) / 60);
  const ss = Math.floor(Math.max(0, timeLeft) % 60);
  const timeStr = `${mm}:${ss.toString().padStart(2, "0")}`;
  const progressPct = Math.min(100, (pairsFound / 8) * 100);
  const urgent = phase === "playing" && timeLeft <= 15 && timeLeft > 0;

  const showAction =
    (phase === "idle" && !multiplayerAwaiting) ||
    phase === "won" ||
    phase === "lost";

  return (
    <>
      <style>{`
        @keyframes mm-urgent-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.72; }
        }
        .mm-timer-urgent {
          animation: mm-urgent-pulse 1s ease-in-out infinite;
        }
      `}</style>

      <aside style={panel} aria-label="Memory game panel">
        <div style={topAccent} aria-hidden />
        <h2 style={h2}>{t.title}</h2>
        <p style={sub}>{t.subtitle}</p>
        {phase === "playing" && <p style={playingHint}>{t.playingHint}</p>}
        <div style={statsGrid}>
          <div style={statCard}>
            <div style={statIconWrap}>
              <IconClock size={18} color={GOLD} aria-hidden />
            </div>
            <div style={label}>{t.time}</div>
            <div
              style={{
                ...big,
                color: urgent ? "#ffcc66" : "#f0e6d8",
              }}
              className={urgent ? "mm-timer-urgent" : undefined}
            >
              {timeStr}
            </div>
          </div>
          <div style={statCard}>
            <div style={statIconWrap}>
              <IconMoves size={18} color={GOLD} aria-hidden />
            </div>
            <div style={label}>{t.moves}</div>
            <div style={{ ...big, color: "#d4c8b8" }}>{moves}</div>
          </div>
          <div style={statCard}>
            <div style={statIconWrap}>
              <IconPairs size={18} color={GOLD} aria-hidden />
            </div>
            <div style={label}>{t.pairs}</div>
            <div style={{ ...big, color: "#9ecf9a" }}>
              {pairsFound}
              <span style={statDenom}>/8</span>
            </div>
          </div>
        </div>

        <div style={progressBlock}>
          <div style={progressHeader}>
            <span style={progressLabelText}>{t.progressLabel}</span>
            <span style={progressPctText}>{Math.round(progressPct)}%</span>
          </div>
          <div style={progressTrack}>
            <div
              style={{
                ...progressFill,
                width: `${progressPct}%`,
                boxShadow:
                  progressPct >= 100
                    ? "0 0 16px rgba(144, 216, 144, 0.45)"
                    : "0 0 12px rgba(201, 162, 39, 0.25)",
                background:
                  progressPct >= 100
                    ? "linear-gradient(90deg, #6ab86a, #9ecf9a)"
                    : "linear-gradient(90deg, #8a6a20, #d4b04a, #e8c860)",
              }}
            />
          </div>
        </div>

        {phase === "won" && (
          <GamePanelResultCard variant="win" title={t.win} className="mt-1" />
        )}
        {phase === "lost" && (
          <GamePanelResultCard variant="lose" title={t.lose} className="mt-1" />
        )}

        <div style={{ marginTop: "auto", paddingTop: 20 }}>
          {phase === "idle" && multiplayerAwaiting && (
            <p
              style={{
                margin: 0,
                padding: "12px 14px",
                borderRadius: 12,
                border: "1px solid rgba(201, 162, 39, 0.35)",
                background: "rgba(30, 26, 18, 0.85)",
                color: "rgba(240, 230, 216, 0.92)",
                fontSize: 12,
                lineHeight: 1.45,
              }}
            >
              {t.mpWaitHint}
            </p>
          )}
          {showAction && (
            <button
              type="button"
              className={GAME_CTA_PRIMARY}
              onClick={() => {
                playButtonClick();
                (phase === "idle" ? onStart : onRestart)();
              }}
            >
              {phase === "idle" ? (
                <>
                  <IconPlay size={18} />
                  {t.start}
                </>
              ) : (
                <>
                  <IconAgain size={18} />
                  {t.again}
                </>
              )}
            </button>
          )}
        </div>
      </aside>
    </>
  );
}

function phasePill(phase: Props["phase"]): CSSProperties {
  const base: CSSProperties = {
    fontSize: 9,
    letterSpacing: "0.22em",
    textTransform: "uppercase",
    padding: "6px 12px",
    borderRadius: 999,
    border: "1px solid rgba(201, 162, 39, 0.28)",
    fontWeight: 600,
  };
  if (phase === "playing") {
    return {
      ...base,
      color: "#c8e8c0",
      background: "rgba(60, 100, 70, 0.35)",
      borderColor: "rgba(120, 200, 140, 0.35)",
    };
  }
  if (phase === "won") {
    return {
      ...base,
      color: "#9ecf9a",
      background: "rgba(50, 90, 55, 0.4)",
    };
  }
  if (phase === "lost") {
    return {
      ...base,
      color: "#e0a090",
      background: "rgba(90, 45, 40, 0.35)",
    };
  }
  return {
    ...base,
    color: GOLD_DIM,
    background: "rgba(30, 24, 16, 0.6)",
  };
}

const panel: CSSProperties = {
  position: "absolute",
  top: 0,
  right: 0,
  bottom: 0,
  width: "min(300px, calc(100vw - 16px))",
  zIndex: 20,
  display: "flex",
  flexDirection: "column",
  padding: "22px 22px 26px",
  border: "1px solid rgba(148, 129, 1, 0.45)",
  // background: `
  //   linear-gradient(
  //     165deg,
  //     rgba(14, 10, 6, 0.99) 0%,
  //     rgba(22, 16, 10, 0.97) 45%,
  //     rgba(12, 9, 6, 0.99) 100%
  //   )
  // `,
  boxShadow: "-16px 0 48px rgba(0, 0, 0, 0.45)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  fontFamily: GAME_UI_FONT_FAMILY,
  color: "#ebe4d8",
  overflowY: "auto",
  overflowX: "hidden",
};

const topAccent: CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: 3,
  background:
    "linear-gradient(90deg, transparent, rgba(201, 162, 39, 0.55), transparent)",
  pointerEvents: "none",
};

const headerRow: CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  marginBottom: 8,
};

const overline: CSSProperties = {
  fontSize: 9,
  letterSpacing: "0.2em",
  color: "rgba(201, 162, 39, 0.48)",
  margin: "0 0 6px",
  fontWeight: 600,
};

const h2: CSSProperties = {
  fontSize: "clamp(0.8rem, 2.8vw, 0.95rem)",
  letterSpacing: "0.1em",
  color: "#e8c860",
  margin: "0 0 6px",
  fontWeight: 700,
  textShadow: "0 2px 24px rgba(201, 162, 39, 0.25)",
  lineHeight: 1.25,
  overflow: "hidden",
  textOverflow: "ellipsis",
  maxWidth: "100%",
};

const sub: CSSProperties = {
  fontSize: 12,
  color: "#8a8074",
  margin: "0 0 14px",
  lineHeight: 1.45,
  maxWidth: "100%",
};

const playingHint: CSSProperties = {
  fontSize: 12,
  color: "rgba(201, 162, 39, 0.75)",
  margin: "0 0 18px",
  padding: "10px 12px",
  borderRadius: 10,
  background: "rgba(201, 162, 39, 0.08)",
  border: "1px solid rgba(201, 162, 39, 0.12)",
  lineHeight: 1.45,
};

const statsGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: 10,
  marginBottom: 18,
};

const statCard: CSSProperties = {
  background:
    "linear-gradient(160deg, rgba(255,255,255,0.04) 0%, rgba(0,0,0,0.2) 100%)",
  border: "1px solid rgba(201, 162, 39, 0.12)",
  borderRadius: 12,
  padding: "12px 10px 14px",
  textAlign: "center",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
};

const statIconWrap: CSSProperties = {
  display: "flex",
  justifyContent: "center",
  marginBottom: 8,
  opacity: 0.9,
};

const label: CSSProperties = {
  fontSize: 9,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  color: "#6d655c",
  marginBottom: 6,
  fontWeight: 600,
};

const big: CSSProperties = {
  fontSize: "clamp(0.95rem, 3.5vw, 1.1rem)",
  fontWeight: 700,
  fontVariantNumeric: "tabular-nums",
  lineHeight: 1.1,
};

const statDenom: CSSProperties = {
  fontSize: 14,
  fontWeight: 500,
  color: "#7a7068",
  marginLeft: 2,
};

const progressBlock: CSSProperties = {
  marginBottom: 18,
};

const progressHeader: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 8,
};

const progressLabelText: CSSProperties = {
  fontSize: 10,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: "#6d655c",
  fontWeight: 600,
};

const progressPctText: CSSProperties = {
  fontSize: 12,
  color: GOLD,
  fontWeight: 600,
  fontVariantNumeric: "tabular-nums",
};

const progressTrack: CSSProperties = {
  height: 8,
  borderRadius: 999,
  background: "rgba(0,0,0,0.35)",
  border: "1px solid rgba(201, 162, 39, 0.12)",
  overflow: "hidden",
  boxShadow: "inset 0 2px 6px rgba(0,0,0,0.35)",
};

const progressFill: CSSProperties = {
  height: "100%",
  borderRadius: 999,
  transition: "width 0.35s ease, background 0.35s ease",
  minWidth: 0,
};
