"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import type { MapPresencePeer } from "@/hooks/useMapPresence";
import type { HeroKinematic } from "../controls/heroKinematic";
import type { useArcheryDuel } from "./useArcheryDuel";
import {
  GAME_PANEL_CHROME_GLASS,
  GAME_CTA_PRIMARY,
  GAME_CTA_SECONDARY,
  GAME_TEXT_LEAD,
  GAME_PANEL_HEADING_CLASS,
} from "@/components/game/gameUiTheme";

const CHALLENGE_DISTANCE = 12;
const CHECK_MS = 500;

type NearPeer = { id: string; name: string };

/**
 * "Ойрт од" overlay trigger — the pattern confirmed during brainstorming:
 * a prompt appears over the 3D scene when another player is within dueling
 * range, instead of a separate in-world button mesh. Handles only the
 * pre-match phases (idle/challenge_received/connecting/countdown); aiming
 * and resolved are ArcheryDuelHUD's job.
 */
export function DuelChallengeTrigger({
  remotePeersRef,
  heroKinematicRef,
  myIdRef,
  duel,
}: {
  remotePeersRef: React.RefObject<MapPresencePeer[]>;
  heroKinematicRef: React.RefObject<HeroKinematic>;
  myIdRef: React.RefObject<string | null>;
  duel: ReturnType<typeof useArcheryDuel>;
}) {
  const [nearest, setNearest] = useState<NearPeer | null>(null);

  useEffect(() => {
    const tick = () => {
      const kin = heroKinematicRef.current;
      if (!kin?.has) {
        setNearest(null);
        return;
      }
      let best: { peer: MapPresencePeer; dist: number } | null = null;
      for (const p of remotePeersRef.current) {
        const dist = Math.hypot(p.x - kin.pos.x, p.z - kin.pos.z);
        if (!best || dist < best.dist) best = { peer: p, dist };
      }
      setNearest(
        best && best.dist <= CHALLENGE_DISTANCE
          ? { id: best.peer.id, name: best.peer.displayName }
          : null,
      );
    };
    tick();
    const id = setInterval(tick, CHECK_MS);
    return () => clearInterval(id);
  }, [remotePeersRef, heroKinematicRef]);

  const { phase } = duel;

  if (phase === "idle") {
    if (!nearest) return null;
    return (
      <div style={overlayPos}>
        <div style={{ ...GAME_PANEL_CHROME_GLASS, padding: "10px 14px", textAlign: "center" }}>
          <div className={GAME_TEXT_LEAD} style={{ marginBottom: 8 }}>
            {nearest.name} ойрт байна
          </div>
          <button
            className={GAME_CTA_PRIMARY}
            onClick={() => {
              const myId = myIdRef.current;
              if (!myId || !nearest) return;
              duel.challenge(myId, nearest.id, nearest.name);
            }}
          >
            ⚔ Дуэлд уриалах
          </button>
        </div>
      </div>
    );
  }

  if (phase === "challenge_received") {
    return (
      <div style={overlayPos}>
        <div
          style={{
            ...GAME_PANEL_CHROME_GLASS,
            padding: "12px 16px",
            minWidth: 240,
            textAlign: "center",
          }}
        >
          <div className={GAME_PANEL_HEADING_CLASS} style={{ marginBottom: 6 }}>
            {duel.opponentName} чамайг дуэлд уриалж байна!
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button className={GAME_CTA_PRIMARY} onClick={() => duel.acceptChallenge()}>
              Зөвшөөрөх
            </button>
            <button className={GAME_CTA_SECONDARY} onClick={() => duel.declineChallenge()}>
              Татгалзах
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "connecting" || phase === "countdown") {
    return (
      <div style={overlayPos}>
        <div style={{ ...GAME_PANEL_CHROME_GLASS, padding: "10px 16px", textAlign: "center" }}>
          <div className={GAME_TEXT_LEAD}>
            {phase === "connecting"
              ? `${duel.opponentName}-тай холбогдож байна...`
              : "Бэлдээрэй!"}
          </div>
        </div>
      </div>
    );
  }

  return null;
}

const overlayPos: CSSProperties = {
  position: "fixed",
  bottom: 90,
  left: "50%",
  transform: "translateX(-50%)",
  zIndex: 900,
  pointerEvents: "auto",
};
