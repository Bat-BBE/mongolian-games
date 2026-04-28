"use client";

import { useApp } from "@/components/AppContext";
import { useCallback, useEffect, useRef, useState } from "react";
import type { MatchRoomControls, PeerRelayEvent } from "@/hooks/useMatchRoom";
import { useInventoryGrant } from "./useInventoryGrant";
import { STONE_ROUND_COINS } from "./gameRewardConstants";
import { WIN_LEVEL } from "./stoneCairnType";
import { useMatchLobbyIntro } from "./gameModalSession";
import StoneCairnMemoryGame from "./stoneCairnMemoryGame";

const REL = "cairn_mp_v1";

type EndMsg = {
  kind: "cairn_e";
  v: number;
  from: string;
  best: number;
  won: boolean;
};

function parseE(x: unknown): EndMsg | null {
  if (typeof x !== "object" || x === null) return null;
  const o = x as EndMsg;
  if (o.kind !== "cairn_e" || typeof o.v !== "number") return null;
  if (typeof o.from !== "string") return null;
  if (typeof o.best !== "number") return null;
  return o;
}

type Props = {
  onComplete: (result: "win" | "lose", progressPct?: number) => void;
  mp: MatchRoomControls;
  lastPeerRelay: PeerRelayEvent | null;
  sendRelay: (ch: string, p: unknown) => void;
};

export function StoneCairnOnlineLobby() {
  const { language } = useApp();
  const lobbyIntro = useMatchLobbyIntro(language === "en" ? "en" : "mn");
  return (
    <div
      className="flex h-full w-full items-center justify-center p-4 text-center text-sm text-white/80"
      style={{
        background:
          "radial-gradient(circle at 50% 50%, #1a1410 0%, #0a0806 100%)",
      }}
    >
      <span>{lobbyIntro}</span>
    </div>
  );
}

export default function StoneCairnMemoryGameMulti({
  onComplete,
  mp,
  lastPeerRelay,
  sendRelay,
}: Props) {
  const { grant } = useInventoryGrant();
  const myId = mp.playerId ?? "";
  const otherId = mp.players.find((p) => p.id !== myId)?.id ?? "";
  const [mine, setMine] = useState<{
    best: number;
    won: boolean;
  } | null>(null);
  const [theirs, setTheirs] = useState<{
    best: number;
    won: boolean;
  } | null>(null);
  const sendV = useRef(0);
  const done = useRef(false);
  const appliedV = useRef(0);
  const seed = mp.matchSeed ?? 0;
  const mk = mp.matchStartedAt ?? 0;

  useEffect(() => {
    if (!mk) return;
    setMine(null);
    setTheirs(null);
    done.current = false;
    sendV.current = 0;
    appliedV.current = 0;
  }, [mk]);

  const onLocal = useCallback(
    (p: { best: number; won: boolean }) => {
      if (done.current) return;
      setMine({ best: p.best, won: p.won });
      sendV.current += 1;
      const v = sendV.current;
      sendRelay(REL, {
        kind: "cairn_e",
        v,
        from: myId,
        best: p.best,
        won: p.won,
      });
    },
    [myId, sendRelay],
  );

  useEffect(() => {
    if (!lastPeerRelay || lastPeerRelay.channel !== REL) return;
    if (lastPeerRelay.from === myId) return;
    const p = parseE(lastPeerRelay.payload);
    if (!p || p.v <= appliedV.current) return;
    appliedV.current = p.v;
    if (p.from === otherId) {
      setTheirs({ best: p.best, won: p.won });
    }
  }, [lastPeerRelay, myId, otherId]);

  useEffect(() => {
    if (done.current) return;
    if (!mine || !theirs) return;
    done.current = true;
    if (mine.won && !theirs.won) {
      grant({ coins: STONE_ROUND_COINS });
      onComplete("win", 100);
      return;
    }
    if (!mine.won && theirs.won) {
      onComplete("lose", Math.min(100, (mine.best / WIN_LEVEL) * 100));
      return;
    }
    if (mine.best > theirs.best) {
      grant({ coins: STONE_ROUND_COINS });
      onComplete("win", 100);
      return;
    }
    if (mine.best < theirs.best) {
      onComplete("lose", Math.min(100, (mine.best / WIN_LEVEL) * 100));
      return;
    }
    onComplete("lose", 50);
  }, [mine, theirs, grant, onComplete]);

  if (!otherId) {
    return <StoneCairnOnlineLobby />;
  }

  return (
    <StoneCairnMemoryGame mode="mp" baseSeed={seed} onLocalFinish={onLocal} />
  );
}
