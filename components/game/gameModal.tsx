"use client";

import { LuUsers as IconUsers, LuX as X } from "react-icons/lu";
import { useEffect, useRef, useState } from "react";
import { useGLTF } from "@react-three/drei";
import ShagaiGame from "./shagaiGame";
import StoneGame from "./stoneGame";
import FourBonesGame from "./fourBonusGame";
import HorseRaceGame from "./horseRaceGame";
import ShagaiGuessGame from "./shagaiGuessGame";
import ShagaiSevenGame from "./shagaiSevenGame";
import MemoryMatchGame from "./memoryMatchGame";
import KhorolGame from "./khorolGame";
import WoodenPuzzleGame from "./woodenPuzzleGame";
import { loadPlayer } from "@/components/hero-select/hero-data";
import { completeGame } from "@/lib/api";
import { playButtonClick } from "@/lib/uiSounds";
import { useMatchRoom } from "@/hooks/useMatchRoom";
import { MultiplayerMatchPanel } from "./MultiplayerMatchPanel";
import { deriveStationGameMatchCode } from "@/lib/stationMatchCode";

interface GameModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameType: string;
  gameName: string;
  stationSlug: string;
  gameSlug: string;
  onCompleted?: (result: "win" | "lose") => void;
}

export default function GameModal({
  isOpen,
  onClose,
  gameType,
  gameName,
  stationSlug,
  gameSlug,
  onCompleted,
}: GameModalProps) {
  const [multiplayerOn, setMultiplayerOn] = useState(false);
  const matchJoinRequestedRef = useRef(false);
  const autoMultiStartSentRef = useRef(false);
  const soloFallbackStartSentRef = useRef(false);
  const playerName = loadPlayer()?.name?.trim() || "Player";
  const mp = useMatchRoom({
    enabled: isOpen && (gameType === "puzzle" || multiplayerOn),
    gameType,
    gameSlug,
    displayName: playerName,
    maxRoomPlayers: gameType === "shagai" ? 4 : undefined,
  });

  /** Хос ол: нээгдэхэд шууд нийтлэг өрөө; бусад тоглоомд зөвхөн Online товчоор. */
  useEffect(() => {
    if (!isOpen) {
      setMultiplayerOn(false);
      return;
    }
    if (gameType === "puzzle") setMultiplayerOn(true);
    else setMultiplayerOn(false);
  }, [isOpen, gameType]);

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

  /** Паблик өрөөг автоматаар үүсгэх эсвэл нэгдэх. */
  useEffect(() => {
    if (!isOpen || gameType !== "puzzle" || !multiplayerOn) {
      matchJoinRequestedRef.current = false;
      return;
    }
    if (!mp.connected || !mp.playerId || mp.roomCode) return;
    if (matchJoinRequestedRef.current) return;
    matchJoinRequestedRef.current = true;
    mp.createRoom(stationMatchCode);
  }, [
    isOpen,
    gameType,
    multiplayerOn,
    mp.connected,
    mp.playerId,
    mp.roomCode,
    mp.createRoom,
    stationMatchCode,
  ]);

  /** Бүх хүн lobby-д автоматаар бэлэн. */
  useEffect(() => {
    if (!isOpen || gameType !== "puzzle" || !multiplayerOn) return;
    if (!mp.connected || mp.roomStatus !== "lobby" || !mp.roomCode) return;
    const me = mp.players.find((p) => p.id === mp.playerId);
    if (me && !me.ready) mp.setReady(true);
  }, [
    isOpen,
    gameType,
    multiplayerOn,
    mp.connected,
    mp.roomStatus,
    mp.roomCode,
    mp.players,
    mp.playerId,
    mp.setReady,
  ]);

  /** 2+ тоглогч бүгд бэлэн бол эзэн шууд эхлүүлнэ. */
  useEffect(() => {
    if (!isOpen || gameType !== "puzzle" || !multiplayerOn) return;
    if (!mp.isHost || mp.roomStatus !== "lobby" || !mp.connected) return;
    if (mp.players.length < 2) return;
    if (!mp.players.every((p) => p.ready)) return;
    if (autoMultiStartSentRef.current) return;
    autoMultiStartSentRef.current = true;
    mp.startMatch();
  }, [
    isOpen,
    gameType,
    multiplayerOn,
    mp.isHost,
    mp.roomStatus,
    mp.connected,
    mp.players,
    mp.startMatch,
  ]);

  /** 10 секунд зөвхөн 1 хүн — серверээс seed (ганцаарчилсан самбар). */
  useEffect(() => {
    if (!isOpen || gameType !== "puzzle" || !multiplayerOn) return;
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
    gameType,
    multiplayerOn,
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
    if (!isOpen) return;
    const usesShagaiModel = new Set([
      "shagai",
      "four-bones",
      "horse-race",
      "shagai-guess",
      "seven-shagai",
    ]);
    if (!usesShagaiModel.has(gameType)) return;
    void useGLTF.preload("/models/shagai_model.glb");
  }, [isOpen, gameType]);

  if (!isOpen) return null;

  const mpSharedBoard = gameType === "puzzle";
  const puzzleMpActive = mpSharedBoard && multiplayerOn;
  const mpBlocksSoloStart =
    puzzleMpActive &&
    !(mp.roomStatus === "playing" && mp.matchSeed != null);

  async function submit(result: "win" | "lose", progressPct?: number) {
    const saved = loadPlayer();
    if (!saved?.name) return;
    await completeGame({
      email: saved.name,
      stationSlug,
      gameSlug,
      result,
      progressPct,
    });
    onCompleted?.(result);
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
          className="absolute top-0 left-0 right-0 z-20 flex shrink-0 justify-between items-center px-3 py-2 sm:px-5 sm:py-3"
          style={{
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)",
          }}
        >
          <button
            type="button"
            title={
              gameType === "puzzle"
                ? "Өрөө: идэвхтэй (унтраахад зөвхөн ганцаарчилсан)"
                : "Online — өрөө үүсгэх / нэгдэх"
            }
            onClick={() => {
              playButtonClick();
              setMultiplayerOn((v) => !v);
            }}
            className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide transition-colors ${
              multiplayerOn
                ? "border-amber-400/60 bg-amber-950/55 text-amber-100"
                : "border-amber-500/25 bg-black/35 text-amber-200/75 hover:border-amber-400/40"
            }`}
          >
            <IconUsers className="size-3.5" aria-hidden />
            {gameType === "puzzle" ? "Өрөө" : "Online"}
          </button>
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

        <div className="flex min-h-0 min-w-0 w-full flex-1 flex-col overflow-hidden pt-11 sm:pt-[3.25rem]">
          {multiplayerOn ? (
            <MultiplayerMatchPanel
              mp={mp}
              enabled={multiplayerOn}
              supportsSharedBoard={mpSharedBoard}
              suggestedMatchCode={stationMatchCode}
              autoMatchmaking={gameType === "puzzle"}
              homboroiMode={gameType === "shagai"}
            />
          ) : null}
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {gameType === "shagai" && (
            <ShagaiGame
              onComplete={(r, pct) => void submit(r, pct)}
              match={multiplayerOn ? mp : null}
              multiplayerOn={multiplayerOn}
            />
          )}
          {gameType === "stone-guess" && (
            <StoneGame onComplete={(r) => void submit(r)} />
          )}
          {gameType === "alag-melkhii" && (
            <ComingSoon name="Алаг мэлхий өрөх" />
          )}
          {gameType === "four-bones" && (
            <FourBonesGame onComplete={(r) => void submit(r)} />
          )}
          {gameType === "horse-race" && (
            <HorseRaceGame onComplete={(r, pct) => void submit(r, pct)} />
          )}
          {gameType === "shagai-guess" && (
            <ShagaiGuessGame onComplete={(r, pct) => void submit(r, pct)} />
          )}
          {gameType === "seven-shagai" && (
            <ShagaiSevenGame onComplete={(r, pct) => void submit(r, pct)} />
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
        fontFamily: "var(--font-inter), -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
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
