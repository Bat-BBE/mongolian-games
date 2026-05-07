"use client";

import { LuCircleHelp as CircleHelp } from "react-icons/lu";
import { LuX as X } from "react-icons/lu";
import { useEffect, useMemo, useRef, useState } from "react";
import { useGLTF } from "@react-three/drei";
import ShagaiGame from "./shagaiGame";
import StoneGame from "./stoneGame";
import StoneGameMulti, { StoneGameOnlineLobby } from "./stoneGameMulti";
import FourBonesGame from "./fourBonusGame";
import FourBonesGameMulti, { FourBonesOnlineLobby } from "./fourBonesGameMulti";
import HorseRaceGame from "./horseRaceGame";
import HorseRaceGameMulti, { HorseRaceOnlineLobby } from "./horseRaceGameMulti";
import ShagaiGuessGame from "./shagaiGuessGame";
import ShagaiGuessGameMulti, {
  ShagaiGuessOnlineLobby,
} from "./shagaiGuessGameMulti";
import ShagaiSevenGame from "./shagaiSevenGame";
import ShagaiTwelveGame from "./shagaiTwelveGame";
import ShagaiTwelveGameMulti, {
  ShagaiTwelveOnlineLobby,
} from "./shagaiTwelveGameMulti";
import ShagaiBerkh12Game from "./shagaiBerkh12Game";
import ShagaiBerkh12GameMulti, {
  ShagaiBerkh12OnlineLobby,
} from "./shagaiBerkh12GameMulti";
import type { LocalPlayerCount } from "./shagaiBerkh12Type";
import FourPowersGame from "./fourPowersGame";
import FourPowersGameMulti, {
  FourPowersOnlineLobby,
} from "./fourPowersGameMulti";
import WoodenDiceGame from "./woodenDiceGame";
import WoodenDiceGameMulti, {
  WoodenDiceOnlineLobby,
} from "./woodenDiceGameMulti";
import StoneCairnMemoryGame from "./stoneCairnMemoryGame";
import StoneCairnMemoryGameMulti, {
  StoneCairnOnlineLobby,
} from "./stoneCairnMemoryGameMulti";
import MemoryMatchGame from "./memoryMatchGame";
import KhorolGame from "./khorolGame";
import WoodenPuzzleGame from "./woodenPuzzleGame";
import WoodenPuzzleGameMulti, {
  WoodenPuzzleOnlineLobby,
} from "./woodenPuzzleGameMulti";
import { loadPlayer } from "@/components/hero-select/hero-data";
import { completeGame, tryGetAppUserByEmail } from "@/lib/api";
import { playButtonClick } from "@/lib/uiSounds";
import { useMatchRoom } from "@/hooks/useMatchRoom";
import { GameModalRulesBody } from "./gameModalRulesBody";
import {
  GAME_MODAL_TITLE_CLASS,
  GAME_MODAL_TITLE_IMMERSIVE_CLASS,
  GAME_UI_FONT_FAMILY,
} from "./gameUiTheme";
import { STATION_GAME_WEEKLY_PLAY_CAP } from "@/lib/stationWeeklyPlayCap";
import { deriveStationGameMatchCode } from "@/lib/stationMatchCode";
import { useAuth } from "@/components/AuthContext";
import GameRulesSheet from "./GameRulesSheet";
import MatchRoomChatFab from "./MatchRoomChatFab";
import { GameModalSessionProvider } from "./gameModalSession";
import { useApp } from "@/components/AppContext";

const MATCH_ROOM_GAME_TYPES = new Set<string>([
  "puzzle",
  "shagai",
  "stone-guess",
  "four-bones",
  "horse-race",
  "shagai-guess",
  "four-powers",
  "wooden-dice",
  "stone-cairn",
  "twelve-shagai",
  "berkh-12-shagai",
  "modon-onis",
]);

function usesMatchRoom(gt: string) {
  return MATCH_ROOM_GAME_TYPES.has(gt);
}

/** Canvas + зүүн панел — модалын толгойг нимгэн, тунгалаг болгоно */
const IMMERSIVE_CANVAS_MODAL_HEADER = new Set<string>([
  "berkh-12-shagai",
  "twelve-shagai",
  "seven-shagai",
  "shagai",
  "shagai-guess",
]);

const SOLO_LOBBY_WAIT_MIN_MS = 10_000;
const SOLO_LOBBY_WAIT_MAX_MS = 15_000;

function pickSoloLobbyWaitMs(): number {
  const span = SOLO_LOBBY_WAIT_MAX_MS - SOLO_LOBBY_WAIT_MIN_MS;
  return SOLO_LOBBY_WAIT_MIN_MS + Math.floor(Math.random() * (span + 1));
}

interface GameModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameType: string;
  gameName: string;
  stationSlug: string;
  gameSlug: string;
  onCompleted?: (result: "win" | "lose") => void;
  weeklyPlaysRemaining?: number;
}

export default function GameModal({
  isOpen,
  onClose,
  gameType,
  gameName,
  stationSlug,
  gameSlug,
  onCompleted,
  weeklyPlaysRemaining,
}: GameModalProps) {
  const { language } = useApp();
  const { user: authUser, authConfigured } = useAuth();
  const [appUserInPostgres, setAppUserInPostgres] = useState(false);
  const [matchDisplayName, setMatchDisplayName] = useState(
    loadPlayer()?.name?.trim() || "Player",
  );
  const isMn = language === "mn";

  useEffect(() => {
    if (!isOpen) {
      setAppUserInPostgres(false);
      return;
    }
    if (stationSlug === "freeplay" || !authConfigured) {
      setAppUserInPostgres(false);
      return;
    }
    const email = authUser?.email?.trim();
    if (!email) {
      setAppUserInPostgres(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const row = await tryGetAppUserByEmail(email);
        if (!cancelled) setAppUserInPostgres(Boolean(row));
      } catch {
        if (!cancelled) setAppUserInPostgres(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, stationSlug, authConfigured, authUser?.email]);

  useEffect(() => {
    if (!isOpen) return;
    const fallback = loadPlayer()?.name?.trim() || "Player";
    const email = authUser?.email?.trim();
    if (!authConfigured || !email) {
      setMatchDisplayName(fallback);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const row = await tryGetAppUserByEmail(email);
        if (cancelled) return;
        const nick = row?.display_name?.trim();
        setMatchDisplayName(nick || fallback);
      } catch {
        if (!cancelled) setMatchDisplayName(fallback);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, authConfigured, authUser?.email]);

  const modalSession = useMemo(
    () => ({
      stationSlug,
      appUserInPostgres,
      authConfigured,
    }),
    [stationSlug, appUserInPostgres, authConfigured],
  );

  const [modalRulesOpen, setModalRulesOpen] = useState(false);
  const isMatch = isOpen && usesMatchRoom(gameType);
  const postPlayCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const matchJoinRequestedRef = useRef(false);
  const autoMultiStartSentRef = useRef(false);
  const soloFallbackStartSentRef = useRef(false);
  const soloLobbyWaitMsRef = useRef<number | null>(null);
  const soloLobbyRoomCodeRef = useRef<string | null>(null);
  const mp = useMatchRoom({
    enabled: isMatch,
    gameType,
    gameSlug,
    displayName: matchDisplayName,
    maxRoomPlayers:
      gameType === "stone-guess" ||
      gameType === "shagai-guess" ||
      gameType === "wooden-dice" ||
      gameType === "stone-cairn" ||
      gameType === "twelve-shagai"
        ? 2
        : gameType === "shagai" ||
            gameType === "four-bones" ||
            gameType === "horse-race" ||
            gameType === "four-powers" ||
            gameType === "berkh-12-shagai" ||
            gameType === "modon-onis"
          ? 4
          : undefined,
  });

  const showMatchRoomChat =
    isMatch &&
    Boolean(mp.roomCode) &&
    stationSlug !== "freeplay" &&
    (!authConfigured || appUserInPostgres);

  useEffect(() => {
    if (!mp.connected) matchJoinRequestedRef.current = false;
  }, [mp.connected]);

  useEffect(() => {
    if (mp.roomStatus !== "lobby") {
      autoMultiStartSentRef.current = false;
      soloFallbackStartSentRef.current = false;
    }
  }, [mp.roomStatus]);

  const stationMatchCode = deriveStationGameMatchCode(stationSlug, gameSlug);

  useEffect(() => {
    if (!isOpen || !isMatch) {
      matchJoinRequestedRef.current = false;
      return;
    }
    if (!mp.connected || !mp.playerId || mp.roomCode) return;
    if (matchJoinRequestedRef.current) return;
    matchJoinRequestedRef.current = true;
    mp.createRoom(stationMatchCode);
  }, [
    isOpen,
    isMatch,
    mp.connected,
    mp.playerId,
    mp.roomCode,
    mp.createRoom,
    stationMatchCode,
  ]);

  useEffect(() => {
    if (!isOpen || !isMatch) return;
    if (!mp.connected || mp.roomStatus !== "lobby" || !mp.roomCode) return;
    const me = mp.players.find((p) => p.id === mp.playerId);
    if (me && !me.ready) mp.setReady(true);
  }, [
    isOpen,
    isMatch,
    mp.connected,
    mp.roomStatus,
    mp.roomCode,
    mp.players,
    mp.playerId,
    mp.setReady,
  ]);

  useEffect(() => {
    if (!isOpen || !isMatch) return;
    if (!mp.isHost || mp.roomStatus !== "lobby" || !mp.connected) return;
    if (mp.players.length < 2) return;
    if (!mp.players.every((p) => p.ready)) return;
    if (autoMultiStartSentRef.current) return;
    autoMultiStartSentRef.current = true;
    mp.startMatch();
  }, [
    isOpen,
    isMatch,
    mp.isHost,
    mp.roomStatus,
    mp.connected,
    mp.players,
    mp.startMatch,
  ]);

  useEffect(() => {
    const clearSoloLobbyScheduling = () => {
      soloLobbyWaitMsRef.current = null;
      soloLobbyRoomCodeRef.current = null;
    };

    if (!isOpen || !isMatch) {
      clearSoloLobbyScheduling();
      return;
    }

    const soloWaitEligible =
      mp.isHost &&
      mp.roomStatus === "lobby" &&
      mp.connected &&
      Boolean(mp.roomCode) &&
      mp.players.length === 1;

    if (!soloWaitEligible || soloFallbackStartSentRef.current) {
      if (!soloWaitEligible) clearSoloLobbyScheduling();
      return;
    }

    const skipSoloLobbyWait = stationSlug === "freeplay" || !authUser;

    if (soloLobbyRoomCodeRef.current !== mp.roomCode) {
      soloLobbyRoomCodeRef.current = mp.roomCode;
      soloLobbyWaitMsRef.current = skipSoloLobbyWait
        ? 0
        : pickSoloLobbyWaitMs();
    }
    const waitMs = skipSoloLobbyWait
      ? 0
      : (soloLobbyWaitMsRef.current ?? pickSoloLobbyWaitMs());
    if (!skipSoloLobbyWait) soloLobbyWaitMsRef.current = waitMs;

    const t = window.setTimeout(() => {
      if (!soloFallbackStartSentRef.current) {
        soloFallbackStartSentRef.current = true;
        mp.startMatch({ forceSolo: true });
      }
    }, waitMs);
    return () => {
      window.clearTimeout(t);
    };
  }, [
    isOpen,
    isMatch,
    mp.isHost,
    mp.roomStatus,
    mp.connected,
    mp.players.length,
    mp.roomCode,
    mp.startMatch,
    stationSlug,
    authUser,
  ]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) return;
    setModalRulesOpen(false);
    if (postPlayCloseTimerRef.current) {
      clearTimeout(postPlayCloseTimerRef.current);
      postPlayCloseTimerRef.current = null;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const usesShagaiModel = new Set([
      "shagai",
      "four-bones",
      "horse-race",
      "shagai-guess",
      "seven-shagai",
      "twelve-shagai",
      "berkh-12-shagai",
    ]);
    if (!usesShagaiModel.has(gameType)) return;
    void useGLTF.preload("/models/shagai_model.glb");
  }, [isOpen, gameType]);

  const berkh12PlayerCount: LocalPlayerCount = useMemo(() => {
    const n = mp.players.length;
    if (n >= 4) return 4;
    if (n === 3) return 3;
    return 2;
  }, [mp.players.length]);

  const immersiveModalHeader =
    IMMERSIVE_CANVAS_MODAL_HEADER.has(gameType);

  if (!isOpen) return null;

  if (weeklyPlaysRemaining === 0) {
    return (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(10px)" }}
        onClick={onClose}
      >
        <div
          className="max-w-md rounded-2xl border border-amber-500/30 bg-zinc-950/95 p-5 text-center shadow-2xl sm:p-6"
          style={{ fontFamily: GAME_UI_FONT_FAMILY }}
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-balance font-bold leading-tight tracking-tight text-amber-200 text-[clamp(1rem,3.5vw,1.25rem)]">
            {isMn ? "7 хоногийн тоглолт дууссан" : "Weekly plays used up"}
          </p>
          <p className="mt-3 text-xs leading-relaxed text-amber-100/80 sm:text-sm">
            {isMn
              ? `«${gameName}»-ыг энэ өртөөнд сүүлийн 7 хоногт ${STATION_GAME_WEEKLY_PLAY_CAP} удаа тоглосон. Дараагийн тоглолт 7 хонгийн дараа шинээр эхэлнэ.`
              : `You've played this game ${STATION_GAME_WEEKLY_PLAY_CAP} times in the last 7 days at this station. The limit resets on a rolling 7-day window.`}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="mt-5 w-full rounded-lg border border-amber-500/40 bg-amber-950/50 py-2.5 text-sm font-semibold text-amber-100 hover:bg-amber-900/40"
          >
            {isMn ? "Хаах" : "Close"}
          </button>
        </div>
      </div>
    );
  }

  const mpSharedBoard = gameType === "puzzle";
  const stoneLobbyBlock =
    isMatch &&
    gameType === "stone-guess" &&
    mp.roomCode &&
    mp.roomStatus === "lobby";
  const stoneHumanMp =
    isMatch &&
    gameType === "stone-guess" &&
    mp.roomStatus === "playing" &&
    mp.players.length >= 2;
  const fourBonesLobbyBlock =
    isMatch &&
    gameType === "four-bones" &&
    mp.roomCode &&
    mp.roomStatus === "lobby";
  const fourBonesHumanMp =
    isMatch &&
    gameType === "four-bones" &&
    mp.roomStatus === "playing" &&
    mp.players.length >= 2;
  const horseRaceLobbyBlock =
    isMatch &&
    gameType === "horse-race" &&
    mp.roomCode &&
    mp.roomStatus === "lobby";
  const horseRaceHumanMp =
    isMatch &&
    gameType === "horse-race" &&
    mp.roomStatus === "playing" &&
    mp.players.length >= 2;
  const shagaiGuessLobbyBlock =
    isMatch &&
    gameType === "shagai-guess" &&
    mp.roomCode &&
    mp.roomStatus === "lobby";
  const shagaiGuessHumanMp =
    isMatch &&
    gameType === "shagai-guess" &&
    mp.roomStatus === "playing" &&
    mp.players.length >= 2;
  const fourPowersLobbyBlock =
    isMatch &&
    gameType === "four-powers" &&
    mp.roomCode &&
    mp.roomStatus === "lobby";
  const fourPowersHumanMp =
    isMatch &&
    gameType === "four-powers" &&
    mp.roomStatus === "playing" &&
    mp.players.length >= 2;
  const woodenDiceLobbyBlock =
    isMatch &&
    gameType === "wooden-dice" &&
    mp.roomCode &&
    mp.roomStatus === "lobby";
  const woodenDiceHumanMp =
    isMatch &&
    gameType === "wooden-dice" &&
    mp.roomStatus === "playing" &&
    mp.players.length >= 2;
  const stoneCairnLobbyBlock =
    isMatch &&
    gameType === "stone-cairn" &&
    mp.roomCode &&
    mp.roomStatus === "lobby";
  const stoneCairnHumanMp =
    isMatch &&
    gameType === "stone-cairn" &&
    mp.roomStatus === "playing" &&
    mp.players.length >= 2;
  const twelveShagaiLobbyBlock =
    isMatch &&
    gameType === "twelve-shagai" &&
    mp.roomCode &&
    mp.roomStatus === "lobby";
  const twelveShagaiHumanMp =
    isMatch &&
    gameType === "twelve-shagai" &&
    mp.roomStatus === "playing" &&
    mp.players.length >= 2;
  const berkh12LobbyBlock =
    isMatch &&
    gameType === "berkh-12-shagai" &&
    mp.roomCode &&
    mp.roomStatus === "lobby";
  const berkh12HumanMp =
    isMatch &&
    gameType === "berkh-12-shagai" &&
    mp.roomStatus === "playing" &&
    mp.players.length >= 2;
  const woodenPuzzleLobbyBlock =
    isMatch &&
    gameType === "modon-onis" &&
    mp.roomCode &&
    mp.roomStatus === "lobby";
  const woodenPuzzleHumanMp =
    isMatch &&
    gameType === "modon-onis" &&
    mp.roomStatus === "playing" &&
    mp.players.length >= 2;
  const puzzleMpActive = mpSharedBoard && isMatch;
  const mpBlocksSoloStart =
    puzzleMpActive && !(mp.roomStatus === "playing" && mp.matchSeed != null);

  const POST_PLAY_CLOSE_MS = 5000;

  function submit(result: "win" | "lose", progressPct?: number) {
    if (postPlayCloseTimerRef.current) {
      clearTimeout(postPlayCloseTimerRef.current);
    }
    const saved = loadPlayer();
    if (saved?.name) {
      void (async () => {
        try {
          await completeGame({
            email: saved.name,
            stationSlug,
            gameSlug,
            result,
            progressPct,
          });
        } catch (e) {
          console.error("completeGame", e);
        }
      })();
    }
    postPlayCloseTimerRef.current = setTimeout(() => {
      postPlayCloseTimerRef.current = null;
      onClose();
      onCompleted?.(result);
    }, POST_PLAY_CLOSE_MS);
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-3 pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:p-5 md:p-8"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)" }}
      onClick={onClose}
    >
      <div
        className="relative flex min-h-0 w-full max-w-6xl flex-col overflow-hidden rounded-xl shadow-2xl sm:rounded-2xl max-md:h-[min(94dvh,calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-1rem))] md:h-[min(90dvh,calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-1.25rem))]"
        style={{
          maxHeight: "100dvh",
          border: "1px solid rgba(200,160,48,0.3)",
          background: "#080604",
          boxShadow: "0 0 60px rgba(200,160,48,0.1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={
            immersiveModalHeader
              ? "flex shrink-0 items-center gap-2 border-b border-white/[0.06] px-3 py-1.5 sm:gap-2.5 sm:px-3 sm:py-1.5"
              : "flex shrink-0 items-center gap-2 border-b border-amber-900/20 px-3 py-2 sm:gap-3 sm:px-4 sm:py-2.5"
          }
          style={
            immersiveModalHeader
              ? {
                  background:
                    "linear-gradient(to bottom, rgba(0,0,0,0.42), rgba(0,0,0,0.18))",
                }
              : {
                  background:
                    "linear-gradient(to bottom, rgba(0,0,0,0.75), rgba(0,0,0,0.35))",
                }
          }
        >
          <h2
            className={
              immersiveModalHeader
                ? GAME_MODAL_TITLE_IMMERSIVE_CLASS
                : GAME_MODAL_TITLE_CLASS
            }
            title={gameName}
          >
            {gameName}
          </h2>
          <button
            type="button"
            onClick={() => {
              playButtonClick();
              setModalRulesOpen(true);
            }}
            className={
              immersiveModalHeader
                ? "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] text-zinc-400 transition hover:border-white/15 hover:bg-white/[0.08] hover:text-zinc-200"
                : "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-amber-600/35 bg-black/45 text-amber-200/90 transition hover:border-amber-500/50 hover:bg-amber-950/40 hover:text-amber-50"
            }
            aria-label={isMn ? "Дүрэм" : "Rules"}
            title={isMn ? "Дүрэм" : "Rules"}
          >
            <CircleHelp
              className={immersiveModalHeader ? "size-4" : "size-[18px]"}
              aria-hidden
            />
          </button>
          <button
            type="button"
            onClick={() => {
              playButtonClick();
              onClose();
            }}
            className={
              immersiveModalHeader
                ? "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] text-zinc-500 transition hover:border-white/12 hover:bg-white/[0.06] hover:text-zinc-200"
                : "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/50 text-zinc-400 transition hover:border-amber-500/30 hover:bg-amber-950/35 hover:text-white"
            }
            aria-label={isMn ? "Хаах" : "Close"}
          >
            <X size={immersiveModalHeader ? 16 : 18} />
          </button>
        </div>

        <GameModalSessionProvider value={modalSession}>
          <div className="relative flex min-h-0 min-w-0 w-full flex-1 flex-col overflow-hidden">
            {isMatch && mp.roomCode && showMatchRoomChat && (
              <MatchRoomChatFab
                language={language}
                roomCode={mp.roomCode}
                playerId={mp.playerId}
                players={mp.players}
                sendRelay={mp.sendRelay}
                lastPeerRelay={mp.lastPeerRelay}
                myDisplayName={matchDisplayName}
              />
            )}
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
              {gameType === "shagai" && (
                <ShagaiGame
                  onComplete={(r, pct) => void submit(r, pct)}
                  match={isMatch ? mp : null}
                />
              )}
              {gameType === "stone-guess" && stoneLobbyBlock && (
                <StoneGameOnlineLobby />
              )}
              {gameType === "stone-guess" &&
                !stoneLobbyBlock &&
                stoneHumanMp && (
                  <StoneGameMulti
                    onComplete={(r) => void submit(r)}
                    mp={mp}
                    lastPeerRelay={mp.lastPeerRelay}
                    sendRelay={mp.sendRelay}
                  />
                )}
              {gameType === "stone-guess" &&
                !stoneLobbyBlock &&
                !stoneHumanMp && (
                  <StoneGame onComplete={(r) => void submit(r)} />
                )}
              {gameType === "alag-melkhii" && (
                <ComingSoon name="Алаг мэлхий өрөх" />
              )}
              {gameType === "four-bones" && fourBonesLobbyBlock && (
                <FourBonesOnlineLobby />
              )}
              {gameType === "four-bones" &&
                !fourBonesLobbyBlock &&
                fourBonesHumanMp && (
                  <FourBonesGameMulti
                    onComplete={(r, pct) => void submit(r, pct)}
                    mp={mp}
                    lastPeerRelay={mp.lastPeerRelay}
                    sendRelay={mp.sendRelay}
                  />
                )}
              {gameType === "four-bones" &&
                !fourBonesLobbyBlock &&
                !fourBonesHumanMp && (
                  <FourBonesGame onComplete={(r) => void submit(r)} />
                )}
              {gameType === "horse-race" && horseRaceLobbyBlock && (
                <HorseRaceOnlineLobby />
              )}
              {gameType === "horse-race" &&
                !horseRaceLobbyBlock &&
                horseRaceHumanMp && (
                  <HorseRaceGameMulti
                    onComplete={(r, pct) => void submit(r, pct)}
                    mp={mp}
                    lastPeerRelay={mp.lastPeerRelay}
                    sendRelay={mp.sendRelay}
                  />
                )}
              {gameType === "horse-race" &&
                !horseRaceLobbyBlock &&
                !horseRaceHumanMp && (
                  <HorseRaceGame onComplete={(r, pct) => void submit(r, pct)} />
                )}
              {gameType === "shagai-guess" && shagaiGuessLobbyBlock && (
                <ShagaiGuessOnlineLobby />
              )}
              {gameType === "shagai-guess" &&
                !shagaiGuessLobbyBlock &&
                shagaiGuessHumanMp && (
                  <ShagaiGuessGameMulti
                    onComplete={(r, pct) => void submit(r, pct)}
                    mp={mp}
                    lastPeerRelay={mp.lastPeerRelay}
                    sendRelay={mp.sendRelay}
                  />
                )}
              {gameType === "shagai-guess" &&
                !shagaiGuessLobbyBlock &&
                !shagaiGuessHumanMp && (
                  <ShagaiGuessGame
                    onComplete={(r, pct) => void submit(r, pct)}
                  />
                )}
              {gameType === "four-powers" && fourPowersLobbyBlock && (
                <FourPowersOnlineLobby />
              )}
              {gameType === "four-powers" &&
                !fourPowersLobbyBlock &&
                fourPowersHumanMp && (
                  <FourPowersGameMulti
                    onComplete={(r, pct) => void submit(r, pct)}
                    mp={mp}
                    lastPeerRelay={mp.lastPeerRelay}
                    sendRelay={mp.sendRelay}
                  />
                )}
              {gameType === "four-powers" &&
                !fourPowersLobbyBlock &&
                !fourPowersHumanMp && (
                  <FourPowersGame
                    onComplete={(r, pct) => void submit(r, pct)}
                  />
                )}
              {gameType === "wooden-dice" && woodenDiceLobbyBlock && (
                <WoodenDiceOnlineLobby />
              )}
              {gameType === "wooden-dice" &&
                !woodenDiceLobbyBlock &&
                woodenDiceHumanMp && (
                  <WoodenDiceGameMulti
                    onComplete={(r, pct) => void submit(r, pct)}
                    mp={mp}
                    lastPeerRelay={mp.lastPeerRelay}
                    sendRelay={mp.sendRelay}
                  />
                )}
              {gameType === "wooden-dice" &&
                !woodenDiceLobbyBlock &&
                !woodenDiceHumanMp && (
                  <WoodenDiceGame
                    onComplete={(r, pct) => void submit(r, pct)}
                  />
                )}
              {gameType === "stone-cairn" && stoneCairnLobbyBlock && (
                <StoneCairnOnlineLobby />
              )}
              {gameType === "stone-cairn" &&
                !stoneCairnLobbyBlock &&
                stoneCairnHumanMp && (
                  <StoneCairnMemoryGameMulti
                    onComplete={(r, pct) => void submit(r, pct)}
                    mp={mp}
                    lastPeerRelay={mp.lastPeerRelay}
                    sendRelay={mp.sendRelay}
                  />
                )}
              {gameType === "stone-cairn" &&
                !stoneCairnLobbyBlock &&
                !stoneCairnHumanMp && (
                  <StoneCairnMemoryGame
                    onComplete={(r, pct) => void submit(r, pct)}
                  />
                )}
              {gameType === "seven-shagai" && (
                <ShagaiSevenGame onComplete={(r, pct) => void submit(r, pct)} />
              )}
              {gameType === "twelve-shagai" && twelveShagaiLobbyBlock && (
                <ShagaiTwelveOnlineLobby />
              )}
              {gameType === "twelve-shagai" &&
                !twelveShagaiLobbyBlock &&
                twelveShagaiHumanMp && (
                  <ShagaiTwelveGameMulti
                    onComplete={(r, pct) => void submit(r, pct)}
                    mp={mp}
                    lastPeerRelay={mp.lastPeerRelay}
                    sendRelay={mp.sendRelay}
                  />
                )}
              {gameType === "twelve-shagai" &&
                !twelveShagaiLobbyBlock &&
                !twelveShagaiHumanMp && (
                  <ShagaiTwelveGame
                    onComplete={(r, pct) => void submit(r, pct)}
                    autoPlayVsBotWhenSoloInRoom={
                      isMatch && mp.players.length < 2
                    }
                  />
                )}
              {gameType === "berkh-12-shagai" && berkh12LobbyBlock && (
                <ShagaiBerkh12OnlineLobby />
              )}
              {gameType === "berkh-12-shagai" &&
                !berkh12LobbyBlock &&
                berkh12HumanMp && (
                  <ShagaiBerkh12GameMulti
                    onComplete={(r, pct) => void submit(r, pct)}
                    mp={mp}
                    lastPeerRelay={mp.lastPeerRelay}
                    sendRelay={mp.sendRelay}
                    playerCount={berkh12PlayerCount}
                  />
                )}
              {gameType === "berkh-12-shagai" &&
                !berkh12LobbyBlock &&
                !berkh12HumanMp && (
                  <ShagaiBerkh12Game
                    onComplete={(r, pct) => void submit(r, pct)}
                    autoPlayVsBotWhenSoloInRoom={
                      isMatch && mp.players.length < 2
                    }
                  />
                )}
              {gameType === "uichuur" && <ComingSoon name="Үйчүүр" />}
              {gameType === "khorol" && <KhorolGame />}
              {gameType === "puzzle" && (
                <MemoryMatchGame
                  onComplete={(r, pct) => void submit(r, pct)}
                  multiplayerSeed={puzzleMpActive ? mp.matchSeed : null}
                  multiplayerAwaitingStart={mpBlocksSoloStart}
                />
              )}
              {gameType === "modon-onis" && woodenPuzzleLobbyBlock && (
                <WoodenPuzzleOnlineLobby />
              )}
              {gameType === "modon-onis" &&
                !woodenPuzzleLobbyBlock &&
                woodenPuzzleHumanMp && (
                  <WoodenPuzzleGameMulti
                    onComplete={(r, pct) => void submit(r, pct)}
                    mp={mp}
                    lastPeerRelay={mp.lastPeerRelay}
                    sendRelay={mp.sendRelay}
                  />
                )}
              {gameType === "modon-onis" &&
                !woodenPuzzleLobbyBlock &&
                !woodenPuzzleHumanMp && (
                  <WoodenPuzzleGame
                    onComplete={(r, pct) => void submit(r, pct)}
                  />
                )}
              {gameType === "teveg" && <ComingSoon name="Тэвэг өшиглөх" />}
            </div>
          </div>
        </GameModalSessionProvider>

        <GameRulesSheet
          open={modalRulesOpen}
          onClose={() => setModalRulesOpen(false)}
          title={isMn ? "Дүрэм" : "Rules"}
        >
          <GameModalRulesBody
            gameType={gameType}
            isMn={isMn}
            fourPowersVariant={
              isMatch && gameType === "four-powers" && mp.roomCode
                ? "online"
                : "solo"
            }
          />
        </GameRulesSheet>
      </div>
    </div>
  );
}

function ComingSoon({ name }: { name: string }) {
  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center gap-3 px-4 text-center text-white"
      style={{ fontFamily: GAME_UI_FONT_FAMILY }}
    >
      <div className="text-[clamp(1.75rem,6vw,2.25rem)]" aria-hidden>
        🚧
      </div>
      <div
        className="max-w-[min(100%,20rem)] truncate text-balance font-semibold tracking-tight text-[#c8a030] text-[clamp(0.85rem,2.8vw,1rem)]"
        title={name}
      >
        {name}
      </div>
      <div className="text-xs tracking-wide text-zinc-500 sm:text-[0.8125rem]">
        Удахгүй нээгдэнэ
      </div>
    </div>
  );
}
