"use client";

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
import { loadPlayer } from "@/components/hero-select/hero-data";
import { completeGame } from "@/lib/api";
import { playButtonClick } from "@/lib/uiSounds";
import { useMatchRoom } from "@/hooks/useMatchRoom";
import { deriveStationGameMatchCode } from "@/lib/stationMatchCode";
import { GameModalHowToBanner } from "./gameModalHowToBanner";
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
]);

function usesMatchRoom(gt: string) {
  return MATCH_ROOM_GAME_TYPES.has(gt);
}

interface GameModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameType: string;
  gameName: string;
  stationSlug: string;
  gameSlug: string;
  onCompleted?: (result: "win" | "lose") => void;
  /**
   * Өртөөний 7 хоногийн 2 тоглолт — 0 бол тоглолт эхлүүлэхгүй.
   * undefined: шалгалтгүй (жиш. нүүр "freeplay").
   */
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
  const isMatch = isOpen && usesMatchRoom(gameType);
  const postPlayCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const matchJoinRequestedRef = useRef(false);
  const autoMultiStartSentRef = useRef(false);
  const soloFallbackStartSentRef = useRef(false);
  const playerName = loadPlayer()?.name?.trim() || "Player";
  const mp = useMatchRoom({
    enabled: isMatch,
    gameType,
    gameSlug,
    displayName: playerName,
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
            gameType === "berkh-12-shagai"
          ? 4
          : undefined,
  });

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

  /** Нийтлэг өрөө: паблик код, бэлэн, 2+ бол эхлэх, 1 хүн 10с дараа ганцаарчлал. */
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
    if (!isOpen || !isMatch) return;
    if (!mp.isHost || mp.roomStatus !== "lobby" || !mp.connected) return;
    if (mp.players.length !== 1) return;
    const t = window.setTimeout(() => {
      if (soloFallbackStartSentRef.current) return;
      soloFallbackStartSentRef.current = true;
      mp.startMatch({ forceSolo: true });
    }, 10_000);
    return () => clearTimeout(t);
  }, [
    isOpen,
    isMatch,
    mp.isHost,
    mp.roomStatus,
    mp.connected,
    mp.players.length,
    mp.startMatch,
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

  if (!isOpen) return null;

  if (weeklyPlaysRemaining === 0) {
    const isMn = language === "mn";
    return (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(10px)" }}
        onClick={onClose}
      >
        <div
          className="max-w-md rounded-2xl border border-amber-500/30 bg-zinc-950/95 p-6 text-center shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-2xl font-bold text-amber-200">
            {isMn ? "7 хоногийн тоглолт дууссан" : "Weekly plays used up"}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-amber-100/80">
            {isMn
              ? `«${gameName}»-ыг энэ өртөөнд сүүлийн 7 хоногт 2 удаа тоглосон. Дараагийн тоглолт хуанлийн 7 хоног шинээр эхлэхэд сэргэнэ.`
              : `You've played this game 2 times in the last 7 days at this station. The limit resets on a rolling 7-day window.`}
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
  const berkh12PlayerCount: LocalPlayerCount = useMemo(() => {
    const n = mp.players.length;
    if (n >= 4) return 4;
    if (n === 3) return 3;
    return 2;
  }, [mp.players.length]);
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
  const puzzleMpActive = mpSharedBoard && isMatch;
  const mpBlocksSoloStart =
    puzzleMpActive && !(mp.roomStatus === "playing" && mp.matchSeed != null);

  const POST_PLAY_CLOSE_MS = 1200;

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
          className="flex justify-between items-star px-3 py-2 sm:px-5 sm:py-3"
          style={{
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)",
          }}
        >
          <GameModalHowToBanner gameType={gameType} />
          <button
            onClick={() => {
              playButtonClick();
              onClose();
            }}
            style={{
              width: 24,
              height: 24,
              borderRadius: "50%",
              background: "rgba(0,0,0,0.6)",
              border: "1px solid rgba(200,160,48,0.2)",
              color: "#888",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "#fff";
              (e.currentTarget as HTMLButtonElement).style.background =
                "rgba(200,160,48,0.2)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "#888";
              (e.currentTarget as HTMLButtonElement).style.background =
                "rgba(0,0,0,0.6)";
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex min-h-0 min-w-0 w-full flex-1 flex-col overflow-hidden">
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
            {gameType === "stone-guess" && !stoneLobbyBlock && stoneHumanMp && (
              <StoneGameMulti
                onComplete={(r) => void submit(r)}
                mp={mp}
                lastPeerRelay={mp.lastPeerRelay}
                sendRelay={mp.sendRelay}
              />
            )}
            {gameType === "stone-guess" &&
              !stoneLobbyBlock &&
              !stoneHumanMp && <StoneGame onComplete={(r) => void submit(r)} />}
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
                <ShagaiGuessGame onComplete={(r, pct) => void submit(r, pct)} />
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
                <FourPowersGame onComplete={(r, pct) => void submit(r, pct)} />
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
                <WoodenDiceGame onComplete={(r, pct) => void submit(r, pct)} />
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
                  autoPlayVsBotWhenSoloInRoom={isMatch && mp.players.length < 2}
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
                  autoPlayVsBotWhenSoloInRoom={isMatch && mp.players.length < 2}
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
            {gameType === "modon-onis" && (
              <WoodenPuzzleGame onComplete={(r, pct) => void submit(r, pct)} />
            )}
            {gameType === "teveg" && <ComingSoon name="Тэвэг өшиглөх" />}
          </div>
        </div>
      </div>
    </div>
  );
}

function ComingSoon({ name }: { name: string }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        color: "white",
        fontFamily:
          "var(--font-inter), -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
      }}
    >
      <div style={{ fontSize: 48 }}>🚧</div>
      <div style={{ color: "#c8a030", fontSize: 22, letterSpacing: 2 }}>
        {name}
      </div>
      <div style={{ color: "#666", fontSize: 14, letterSpacing: 1 }}>
        Удахгүй нээгдэнэ
      </div>
    </div>
  );
}
