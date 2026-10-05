"use client";

import { useEffect, useRef } from "react";
import { useMapPresence } from "@/hooks/useMapPresence";
import { useArcheryDuel } from "@/components/map3d-r3f/duel/useArcheryDuel";

/** Dev-only: exercises the duel plumbing with ZERO 3D rendering, to isolate
 * whether flakiness in the full-map test comes from resource contention
 * (two heavy Canvas scenes in headless rendering) vs. the duel logic itself. */
export default function DuelLogicOnlyPage() {
  if (process.env.NODE_ENV === "production") {
    return <div>Dev-only tool.</div>;
  }
  return <Inner />;
}

function Inner() {
  const testNameRef = useRef(`tester-${Math.random().toString(36).slice(2, 8)}`);
  const peerIdRef = useRef<string | null>(null);

  const { remotePeersRef, myIdRef, sendChallenge, setOnPeerChallenged } =
    useMapPresence({
      displayName: testNameRef.current,
      homeKey: "duel-logic-only",
      enabled: true,
    });

  const duel = useArcheryDuel({
    myDisplayName: testNameRef.current,
    sendChallenge,
    setOnPeerChallenged,
  });

  useEffect(() => {
    console.log(`[duel] phase=${duel.phase}`);
    if (duel.phase === "challenge_received") duel.acceptChallenge();
    if (duel.phase === "aiming") {
      const power = 0.4 + Math.random() * 0.3;
      const angle = -0.1 + Math.random() * 0.2;
      duel.fireShot(power, angle);
    }
    if (duel.phase === "resolved" && duel.result) {
      console.log(
        `[duel] RESOLVED iWon=${duel.iWon} myAcc=${duel.result.myAccuracy.toFixed(2)} oppAcc=${duel.result.opponentAccuracy.toFixed(2)} seed=${duel.matchSeed}`,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duel.phase]);

  const challengedOnceRef = useRef(false);
  useEffect(() => {
    const id = setInterval(() => {
      const myId = myIdRef.current;
      const peer = remotePeersRef.current[0];
      if (peer) peerIdRef.current = peer.id;
      console.log(
        `[duel] tick myId=${myId} peers=${remotePeersRef.current.length} phase=${duel.phase}`,
      );
      if (challengedOnceRef.current) return;
      if (!myId || !peer) return;
      if (duel.phase !== "idle") return;
      if (myId > peer.id) return;
      challengedOnceRef.current = true;
      console.log(`[duel] challenging ${peer.id}`);
      duel.challenge(myId, peer.id, peer.displayName);
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myIdRef, remotePeersRef, duel.phase]);

  return (
    <div style={{ padding: 24, fontFamily: "monospace", background: "#111", color: "#0f0" }}>
      duel-logic-only — id: {myIdRef.current} — phase: {duel.phase}
    </div>
  );
}
