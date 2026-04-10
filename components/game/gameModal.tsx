"use client";

import { LuX as X } from "react-icons/lu";
import { useEffect } from "react";
import ShagaiGame from "./shagaiGame";
import StoneGame  from "./stoneGame";
import FourBonesGame from "./fourBonusGame";
import { loadPlayer } from "@/components/hero-select/hero-data";
import { completeGame } from "@/lib/api";

interface GameModalProps {
  isOpen:   boolean;
  onClose:  () => void;
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
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-6xl rounded-2xl overflow-hidden shadow-2xl"
        style={{
          height: "88vh",
          border: "1px solid rgba(200,160,48,0.3)",
          background: "#080604",
          boxShadow: "0 0 60px rgba(200,160,48,0.1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="absolute top-0 left-0 right-0 z-20 flex justify-between items-center px-5 py-3"
          style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)" }}
        >
          <div style={{ color: "#c8a030", fontFamily: "'Noto Serif', Georgia, serif", fontSize: 15, letterSpacing: 2 }}>
            🎮 {gameName}
          </div>
          <button
            onClick={onClose}
            style={{
              width: 36, height: 36,
              borderRadius: "50%",
              background: "rgba(0,0,0,0.6)",
              border: "1px solid rgba(200,160,48,0.2)",
              color: "#888",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "#fff";
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(200,160,48,0.2)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "#888";
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,0,0,0.6)";
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div className="w-full h-full">
          {gameType === "shagai" && (
            <ShagaiGame
              onComplete={(r, pct) => void submit(r, pct)}
            />
          )}
          {gameType === "stone-guess" && (
            <StoneGame onComplete={(r) => void submit(r)} />
          )}
          {gameType === "alag-melkhii" && <ComingSoon name="Алаг мэлхий өрөх" />}
          {gameType === "four-bones" && (
            <FourBonesGame onComplete={(r) => void submit(r)} />
          )}
          {gameType === "uichuur"      && <ComingSoon name="Үйчүүр" />}
          {gameType === "khorol"       && <ComingSoon name="Хорол" />}
          {gameType === "puzzle"       && <ComingSoon name="Оньсон тоглоом" />}
          {gameType === "teveg"        && <ComingSoon name="Тэвэг өшиглөх" />}
        </div>
      </div>
    </div>
  );
}

function ComingSoon({ name }: { name: string }) {
  return (
    <div style={{
      width: "100%", height: "100%",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: 16, color: "white",
      fontFamily: "'Noto Serif', Georgia, serif",
    }}>
      <div style={{ fontSize: 48 }}>🚧</div>
      <div style={{ color: "#c8a030", fontSize: 22, letterSpacing: 2 }}>{name}</div>
      <div style={{ color: "#666", fontSize: 14, letterSpacing: 1 }}>Удахгүй нээгдэнэ</div>
    </div>
  );
}