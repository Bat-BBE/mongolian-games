"use client";

import { useApp } from "@/components/AppContext";
import { useCallback, useEffect, useRef, useState } from "react";
import type { MatchRoomControls, PeerRelayEvent } from "@/hooks/useMatchRoom";
import { useInventoryGrant } from "./useInventoryGrant";
import { STONE_ROUND_COINS } from "./gameRewardConstants";
import { makeRng, rollTriple, ROUNDS_TO_WIN, sum3 } from "./woodenDiceType";
import { TripleDiceReadout } from "./woodenDiceReadout";
import { WoodenDiceSceneCanvas } from "./woodenDiceScene";
import { playWoodenDiceRoll } from "@/lib/uiSounds";
import { ONLINE_LOBBY_INTRO } from "./onlineRoomLobbyCopy";

const REL = "wooden_dice_mp_v1";

type T = [number, number, number];
type P = {
  kind: "wd";
  v: number;
  round: number;
  a: T;
  b: T;
  sh: number;
  sj: number;
  over: boolean;
};

function parseP(x: unknown): P | null {
  if (typeof x !== "object" || x === null) return null;
  const o = x as P;
  if (o.kind !== "wd" || typeof o.v !== "number") return null;
  if (!Array.isArray(o.a) || o.a.length !== 3) return null;
  if (!Array.isArray(o.b) || o.b.length !== 3) return null;
  return o;
}

type Props = {
  onComplete: (result: "win" | "lose", progressPct?: number) => void;
  mp: MatchRoomControls;
  lastPeerRelay: PeerRelayEvent | null;
  sendRelay: (ch: string, p: unknown) => void;
};

export function WoodenDiceOnlineLobby() {
  const { language } = useApp();
  return (
    <div
      className="flex h-full w-full items-center justify-center p-4 text-center text-sm text-white/80"
      style={{
        background:
          "radial-gradient(circle at 50% 50%, #1a1410 0%, #0a0806 100%)",
      }}
    >
      <span>
        {language === "en" ? ONLINE_LOBBY_INTRO.en : ONLINE_LOBBY_INTRO.mn}
      </span>
    </div>
  );
}

export default function WoodenDiceGameMulti({
  onComplete,
  mp,
  lastPeerRelay,
  sendRelay,
}: Props) {
  const { language } = useApp();
  const loc = language === "en" ? "en" : "mn";
  const { grant } = useInventoryGrant();
  const hostId = mp.hostId ?? "";
  const myId = mp.playerId ?? "";
  const iAmHost = Boolean(myId && hostId && myId === hostId);
  const iAmJoiner = Boolean(myId && hostId && myId !== hostId);

  const [round, setRound] = useState(1);
  const [sh, setSh] = useState(0);
  const [sj, setSj] = useState(0);
  const [la, setLa] = useState<T | null>(null);
  const [lb, setLb] = useState<T | null>(null);
  const [spin, setSpin] = useState(false);
  const [done, setDone] = useState(false);
  const appliedV = useRef(0);
  const sendV = useRef(0);
  const matchSeed = mp.matchSeed ?? 0;
  const completeOnce = useRef(false);
  const mk = mp.matchStartedAt ?? 0;
  const shRef = useRef(0);
  const sjRef = useRef(0);
  useEffect(() => {
    shRef.current = sh;
    sjRef.current = sj;
  }, [sh, sj]);

  useEffect(() => {
    if (!mk) return;
    appliedV.current = 0;
    sendV.current = 0;
    setRound(1);
    setSh(0);
    setSj(0);
    setLa(null);
    setLb(null);
    setDone(false);
    completeOnce.current = false;
  }, [mk]);

  const applyPayload = useCallback(
    (p: P) => {
      if (p.v <= appliedV.current) return;
      appliedV.current = p.v;
      playWoodenDiceRoll();
      setSpin(true);
      setLa(null);
      setLb(null);
      window.setTimeout(() => {
        setLa(p.a);
        setLb(p.b);
        setSh(p.sh);
        setSj(p.sj);
        setRound(p.round);
        setSpin(false);
        if (p.over) {
          setDone(true);
          if (!completeOnce.current) {
            completeOnce.current = true;
            const iWin =
              (iAmHost && p.sh >= ROUNDS_TO_WIN) ||
              (iAmJoiner && p.sj >= ROUNDS_TO_WIN);
            if (iWin) grant({ coins: STONE_ROUND_COINS });
            onComplete(
              iWin ? "win" : "lose",
              iWin
                ? 100
                : Math.min(
                    100,
                    Math.round(((iAmHost ? p.sh : p.sj) / ROUNDS_TO_WIN) * 100),
                  ),
            );
          }
        }
      }, 1500);
    },
    [grant, iAmHost, iAmJoiner, onComplete],
  );

  useEffect(() => {
    if (!lastPeerRelay || lastPeerRelay.channel !== REL) return;
    const p = parseP(lastPeerRelay.payload);
    if (p) applyPayload(p);
  }, [lastPeerRelay, applyPayload]);

  const doRoll = useCallback(() => {
    if (!iAmHost || done || spin) return;
    const r0 = round;
    const ra = makeRng(matchSeed, r0, 1);
    const rb = makeRng(matchSeed, r0, 2);
    const a = rollTriple(ra);
    const b = rollTriple(rb);
    const ta = sum3(a);
    const tb = sum3(b);
    const curH = shRef.current;
    const curJ = sjRef.current;
    const nextSh = curH + (ta > tb ? 1 : 0);
    const nextSj = curJ + (tb > ta ? 1 : 0);
    const over = nextSh >= ROUNDS_TO_WIN || nextSj >= ROUNDS_TO_WIN;
    sendV.current += 1;
    const v = sendV.current;
    const pay: P = {
      kind: "wd",
      v,
      round: r0 + 1,
      a,
      b,
      sh: nextSh,
      sj: nextSj,
      over,
    };
    sendRelay(REL, pay);
    applyPayload(pay);
  }, [applyPayload, done, iAmHost, matchSeed, round, sendRelay, spin]);

  if (!iAmHost && !iAmJoiner) {
    return <WoodenDiceOnlineLobby />;
  }

  const leftLabel = iAmHost
    ? loc === "mn"
      ? "Та"
      : "You"
    : loc === "mn"
      ? "Эзэн"
      : "Host";
  const rightLabel = iAmJoiner
    ? loc === "mn"
      ? "Та"
      : "You"
    : loc === "mn"
      ? "Зочин"
      : "Joiner";
  const sumL = loc === "mn" ? "Нийлбэр" : "Total";

  return (
    <div
      className="flex h-full min-h-0 w-full flex-col"
      style={{ background: "#080604" }}
    >
      <div className="shrink-0 px-3 py-1 text-center">
        <h2
          className="font-display text-sm font-bold text-amber-100 sm:text-base"
          style={{ textShadow: "0 0 18px rgba(200,160,48,0.2)" }}
        >
          {loc === "mn" ? "Модон шоо" : "Wooden dice duel"}
        </h2>
        <p className="text-[10px] text-amber-100/85">
          {loc === "mn"
            ? "2 тоглогч · зүүн эзэн, баруун зочин. Талууд: нүд + нийлбэр. Төв: 3D. Доор эзэн шиднэ."
            : "Host left, guest right. Side panels: pips + total. Center: 3D. Host rolls at bottom."}
        </p>
        <div className="mt-1 flex justify-center gap-4 font-mono text-xs text-amber-200/90">
          <span>
            {iAmHost ? (loc === "mn" ? "Та" : "You") : "Host"}: {sh}
          </span>
          <span>
            {iAmJoiner ? (loc === "mn" ? "Та" : "You") : "Joiner"}: {sj}
          </span>
        </div>
      </div>
      <div className="flex min-h-0 w-full flex-1 flex-col">
        <div
          className="flex min-h-0 flex-1 flex-row items-stretch gap-0.5 px-0.5 sm:gap-1.5 sm:px-1"
          style={{ minHeight: "clamp(11rem, 28vh, 100%)" }}
        >
          <div className="flex w-[28%] max-w-[6.5rem] min-w-0 shrink-0 sm:max-w-[7.5rem]">
            <TripleDiceReadout
              label={leftLabel}
              sumLabel={sumL}
              triple={la}
              sum={spin || !la ? null : sum3(la)}
              dieLabels={["1", "2", "3"]}
              tone="sky"
              spinning={spin}
              compact
            />
          </div>
          <div className="min-h-0 min-w-0 flex-1">
            <WoodenDiceSceneCanvas
              spin={spin}
              leftTriple={la ?? [1, 1, 1]}
              rightTriple={lb ?? [1, 1, 1]}
            />
          </div>
          <div className="flex w-[28%] max-w-[6.5rem] min-w-0 shrink-0 sm:max-w-[7.5rem]">
            <TripleDiceReadout
              label={rightLabel}
              sumLabel={sumL}
              triple={lb}
              sum={spin || !lb ? null : sum3(lb)}
              dieLabels={["1", "2", "3"]}
              tone="rose"
              spinning={spin}
              compact
            />
          </div>
        </div>
      </div>
      {iAmHost && !done && (
        <div className="shrink-0 p-2 text-center">
          <button
            type="button"
            onClick={() => void doRoll()}
            disabled={spin}
            className="rounded-lg border border-amber-500/50 bg-amber-950/40 px-5 py-2.5 text-sm font-semibold text-amber-100 disabled:opacity-50"
          >
            {loc === "mn" ? "Өнгө шидэх" : "Roll round"}
          </button>
        </div>
      )}
      {!iAmHost && !done && (
        <p className="shrink-0 p-2 text-center text-xs text-slate-500">
          {loc === "mn" ? "Эзэнийг хүлээнэ…" : "Wait for host to roll…"}
        </p>
      )}
    </div>
  );
}
