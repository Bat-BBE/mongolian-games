"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MatchRoomControls, PeerRelayEvent } from "@/hooks/useMatchRoom";
import { useApp } from "@/components/AppContext";
import WoodenPuzzleGame from "./woodenPuzzleGame";
import { MatchRoomLobbyIntro } from "./MatchRoomLobbyIntro";

const REL = "wooden_interlock_race_v1";

type ProgressMsg = {
  kind: "wood_prog";
  locked: number;
  total: number;
  at: number;
  done: boolean;
  elapsedMs?: number;
  moves?: number;
};

type Props = {
  onComplete: (result: "win" | "lose", progressPct?: number) => void;
  mp: MatchRoomControls;
  lastPeerRelay: PeerRelayEvent | null;
  sendRelay: (ch: string, p: unknown) => void;
};

export function WoodenPuzzleOnlineLobby() {
  return (
    <div
      className="flex h-full w-full items-center justify-center p-4"
      style={{
        background:
          "radial-gradient(circle at 50% 50%, #1a1410 0%, #0a0806 100%)",
      }}
    >
      <MatchRoomLobbyIntro />
    </div>
  );
}

function isProgressMsg(v: unknown): v is ProgressMsg {
  if (!v || typeof v !== "object" || Array.isArray(v)) return false;
  const x = v as Record<string, unknown>;
  return (
    x.kind === "wood_prog" &&
    typeof x.locked === "number" &&
    typeof x.total === "number" &&
    typeof x.at === "number" &&
    typeof x.done === "boolean"
  );
}

export default function WoodenPuzzleGameMulti({
  onComplete,
  mp,
  lastPeerRelay,
  sendRelay,
}: Props) {
  const { language } = useApp();
  const isMn = language === "mn";
  const myId = mp.playerId ?? "";
  const players = mp.players;

  const [progressMap, setProgressMap] = useState<Record<string, ProgressMsg>>({});
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const myProgressRef = useRef<{ locked: number; total: number }>({
    locked: 0,
    total: 0,
  });
  const doneRef = useRef(false);
  const seenRelayRef = useRef(-1);

  const emitProgress = useCallback(
    (msg: ProgressMsg) => {
      if (!myId) return;
      setProgressMap((prev) => ({ ...prev, [myId]: msg }));
      sendRelay(REL, msg);
    },
    [myId, sendRelay],
  );

  useEffect(() => {
    if (!lastPeerRelay) return;
    if (lastPeerRelay.id === seenRelayRef.current) return;
    seenRelayRef.current = lastPeerRelay.id;
    if (lastPeerRelay.channel !== REL) return;
    if (lastPeerRelay.from === myId) return;
    if (!isProgressMsg(lastPeerRelay.payload)) return;
    const incoming = lastPeerRelay.payload;
    setProgressMap((prev) => ({ ...prev, [lastPeerRelay.from]: incoming }));
  }, [lastPeerRelay, myId]);

  useEffect(() => {
    const finished = Object.entries(progressMap)
      .filter(([, p]) => p.done)
      .sort((a, b) => a[1].at - b[1].at);
    if (finished.length === 0) return;
    setWinnerId(finished[0]![0]);
  }, [progressMap]);

  useEffect(() => {
    if (!winnerId || doneRef.current || !myId) return;
    doneRef.current = true;
    const won = winnerId === myId;
    onComplete(won ? "win" : "lose", won ? 100 : 60);
  }, [winnerId, myId, onComplete]);

  const standings = useMemo(() => {
    return players.map((p) => {
      const pr = progressMap[p.id];
      return {
        id: p.id,
        name: p.displayName || p.id.slice(0, 8),
        locked: pr?.locked ?? 0,
        total: pr?.total ?? 0,
        done: pr?.done ?? false,
        at: pr?.at ?? Number.MAX_SAFE_INTEGER,
      };
    });
  }, [players, progressMap]);

  if (!myId || !players.some((p) => p.id === myId)) {
    return <WoodenPuzzleOnlineLobby />;
  }

  return (
    <div className="relative h-full w-full">
      <div className="pointer-events-none absolute left-2 right-2 top-2 z-20 rounded-lg border border-amber-500/25 bg-black/65 px-2 py-1.5 text-[11px] text-zinc-200">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-amber-200">
            {isMn ? "Race" : "Race"}
          </span>
          {standings.map((s, idx) => (
            <span
              key={s.id}
              className={`rounded border px-1.5 py-0.5 ${
                s.done
                  ? "border-emerald-500/50 bg-emerald-900/30 text-emerald-200"
                  : "border-white/15 bg-white/5 text-zinc-200"
              }`}
            >
              {idx + 1}. {s.name}: {s.locked}/{s.total || "?"}
            </span>
          ))}
          {winnerId ? (
            <span className="text-emerald-300">
              {isMn ? "Ялагч тодорлоо" : "Winner decided"}
            </span>
          ) : null}
        </div>
      </div>
      <WoodenPuzzleGame
        onComplete={() => {
          // multi result is decided by race winner
        }}
        showGuidePanel={false}
        onProgressChange={(locked, total) => {
          myProgressRef.current = { locked, total };
          emitProgress({
            kind: "wood_prog",
            locked,
            total,
            at: Date.now(),
            done: false,
          });
        }}
        onSolved={(meta) => {
          const cur = myProgressRef.current;
          emitProgress({
            kind: "wood_prog",
            locked: cur.total || cur.locked,
            total: cur.total || cur.locked,
            at: Date.now(),
            done: true,
            elapsedMs: meta.elapsedMs,
            moves: meta.moves,
          });
        }}
      />
    </div>
  );
}
