"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SHAGAI_INFO, type ShagaiSide } from "./fourBonusType";
import MemoryMatchUI from "./memoryMatchUI";
import {
  MATCH_TIME_LIMIT_SEC,
  buildDeck,
  shuffleDeck,
  type MemoryCard,
} from "./memoryMatchType";

export type MemoryMatchGameProps = {
  onComplete?: (result: "win" | "lose", progressPct?: number) => void;
};

type Phase = "idle" | "playing" | "won" | "lost";

function samePair(a: MemoryCard, b: MemoryCard): boolean {
  return a.side === b.side && a.pairGroup === b.pairGroup;
}

export default function MemoryMatchGame({ onComplete }: MemoryMatchGameProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [faceUpIds, setFaceUpIds] = useState<number[]>([]);
  const [matchedIds, setMatchedIds] = useState<Set<number>>(() => new Set());
  const [moves, setMoves] = useState(0);
  const [timeLeft, setTimeLeft] = useState(MATCH_TIME_LIMIT_SEC);
  const lockRef = useRef(false);
  const submittedRef = useRef(false);
  const matchEndedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pairsFound = useMemo(
    () => Math.floor(matchedIds.size / 2),
    [matchedIds],
  );

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startRound = useCallback(() => {
    matchEndedRef.current = false;
    submittedRef.current = false;
    lockRef.current = false;
    const deck = shuffleDeck(buildDeck());
    setCards(deck);
    setFaceUpIds([]);
    setMatchedIds(new Set());
    setMoves(0);
    setTimeLeft(MATCH_TIME_LIMIT_SEC);
    setPhase("playing");
  }, []);

  const endWin = useCallback(() => {
    if (matchEndedRef.current) return;
    matchEndedRef.current = true;
    clearTimer();
    setPhase("won");
    const pct = Math.max(
      55,
      Math.min(100, 100 - Math.max(0, moves - 8) * 4),
    );
    if (!submittedRef.current) {
      submittedRef.current = true;
      void onComplete?.("win", pct);
    }
  }, [clearTimer, moves, onComplete]);

  const endLose = useCallback(() => {
    if (matchEndedRef.current) return;
    matchEndedRef.current = true;
    clearTimer();
    setPhase("lost");
    const pct = Math.round((pairsFound / 8) * 100);
    if (!submittedRef.current) {
      submittedRef.current = true;
      void onComplete?.("lose", Math.max(5, pct));
    }
  }, [clearTimer, onComplete, pairsFound]);

  useEffect(() => {
    if (phase !== "playing") return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          queueMicrotask(() => endLose());
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearTimer();
  }, [phase, clearTimer, endLose]);

  useEffect(() => {
    if (phase === "playing" && pairsFound >= 8) {
      endWin();
    }
  }, [phase, pairsFound, endWin]);

  const handleCardClick = useCallback(
    (card: MemoryCard) => {
      if (phase !== "playing" || lockRef.current) return;
      if (matchedIds.has(card.id)) return;
      if (faceUpIds.includes(card.id)) return;

      const nextUp = [...faceUpIds, card.id];
      setFaceUpIds(nextUp);

      if (nextUp.length < 2) return;

      setMoves((m) => m + 1);
      const [id1, id2] = nextUp;
      const c1 = cards.find((c) => c.id === id1)!;
      const c2 = cards.find((c) => c.id === id2)!;

      if (samePair(c1, c2)) {
        setMatchedIds((prev) => new Set([...prev, id1, id2]));
        setFaceUpIds([]);
        return;
      }

      lockRef.current = true;
      window.setTimeout(() => {
        setFaceUpIds([]);
        lockRef.current = false;
      }, 750);
    },
    [phase, matchedIds, faceUpIds, cards],
  );

  const resetAll = useCallback(() => {
    clearTimer();
    matchEndedRef.current = false;
    setPhase("idle");
    setCards([]);
    setFaceUpIds([]);
    setMatchedIds(new Set());
    setMoves(0);
    setTimeLeft(MATCH_TIME_LIMIT_SEC);
    submittedRef.current = false;
  }, [clearTimer]);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: 420,
        background:
          "radial-gradient(ellipse 70% 60% at 50% 40%, #1a2820 0%, #0a0c0a 100%)",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 24,
          right: "min(360px, 34vw)",
          top: 24,
          bottom: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: 10,
            width: "100%",
            maxWidth: 420,
            aspectRatio: "1",
          }}
        >
          {cards.map((card) => {
            const up =
              faceUpIds.includes(card.id) || matchedIds.has(card.id);
            const info = SHAGAI_INFO[card.side];
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => void handleCardClick(card)}
                disabled={phase !== "playing" || matchedIds.has(card.id)}
                style={{
                  borderRadius: 14,
                  border: up
                    ? `2px solid ${info.color}`
                    : "2px solid rgba(200,160,48,0.35)",
                  background: up
                    ? `linear-gradient(160deg, ${info.color}33, #1a1814)`
                    : "linear-gradient(160deg, #2a2418, #141210)",
                  cursor:
                    phase !== "playing" || matchedIds.has(card.id)
                      ? "default"
                      : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: up ? 36 : 18,
                  color: up ? info.color : "rgba(200,160,48,0.45)",
                  boxShadow: up
                    ? `0 0 20px ${info.glow}`
                    : "inset 0 2px 8px rgba(0,0,0,0.4)",
                  transition: "transform 0.15s ease, box-shadow 0.2s",
                  transform: up ? "scale(1)" : "scale(0.98)",
                  padding: 0,
                  minHeight: 0,
                }}
              >
                {up ? info.symbol : "❖"}
              </button>
            );
          })}
        </div>
      </div>

      <MemoryMatchUI
        phase={phase}
        timeLeft={timeLeft}
        moves={moves}
        pairsFound={pairsFound}
        onStart={startRound}
        onRestart={resetAll}
      />
    </div>
  );
}
