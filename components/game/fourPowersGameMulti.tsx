"use client";

import { useApp } from "@/components/AppContext";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MatchRoomControls, PeerRelayEvent } from "@/hooks/useMatchRoom";
import {
  WIN_SCORE,
  addTotals,
  firstWinner,
  mulberry32,
  pickBotPower,
  powerLabel,
  roundPoints,
  type PowerId,
} from "./fourPowersType";
import { useInventoryGrant } from "./useInventoryGrant";
import { STONE_ROUND_COINS } from "./gameRewardConstants";
import { ONLINE_LOBBY_INTRO } from "./onlineRoomLobbyCopy";

const RELAY = "four_powers_mp_v1";

type PMsg = { kind: "p"; r: number; from: string; c: number };
type RMsg = {
  kind: "R";
  v: number;
  r: number;
  ch: [number, number, number, number];
  tot: [number, number, number, number];
};

const ACCENT = ["#38bdf8", "#a3e635", "#fbbf24", "#f472b6"] as const;

function parseR(p: unknown): RMsg | null {
  if (typeof p !== "object" || p === null) return null;
  const o = p as RMsg;
  if (o.kind !== "R") return null;
  if (typeof o.v !== "number" || typeof o.r !== "number") return null;
  if (!Array.isArray(o.ch) || o.ch.length !== 4) return null;
  if (!Array.isArray(o.tot) || o.tot.length !== 4) return null;
  return o;
}

function parseP(p: unknown): PMsg | null {
  if (typeof p !== "object" || p === null) return null;
  const o = p as PMsg;
  if (o.kind !== "p") return null;
  if (typeof o.r !== "number" || typeof o.from !== "string") return null;
  if (typeof o.c !== "number") return null;
  return o;
}

type Props = {
  onComplete: (result: "win" | "lose", progressPct?: number) => void;
  mp: MatchRoomControls;
  lastPeerRelay: PeerRelayEvent | null;
  sendRelay: (ch: string, p: unknown) => void;
};

export function FourPowersOnlineLobby() {
  const { language } = useApp();
  return (
    <div
      className="flex h-full w-full items-center justify-center p-4 text-center text-sm leading-relaxed text-white/80"
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

export default function FourPowersGameMulti({
  onComplete,
  mp,
  lastPeerRelay,
  sendRelay,
}: Props) {
  const { language } = useApp();
  const lang = language === "en" ? "en" : "mn";
  const { grant } = useInventoryGrant();
  const myId = mp.playerId ?? "";
  const isHost = mp.isHost;
  const matchSeed = mp.matchSeed ?? 0;

  const humanIds = useMemo(
    () => mp.players.map((p) => p.id).filter(Boolean),
    [mp.players],
  );
  const seatIds = useMemo((): [string, string, string, string] => {
    const h = [...humanIds, "__b0", "__b1", "__b2", "__b3"].slice(0, 4);
    return [h[0]!, h[1]!, h[2]!, h[3]!];
  }, [humanIds]);

  const mySeat = useMemo(
    () => seatIds.findIndex((x) => x === myId),
    [seatIds, myId],
  );

  const nameAtSeat = useCallback(
    (i: number) => {
      const id = seatIds[i]!;
      if (id?.startsWith("__b")) {
        return lang === "mn" ? `Бот ${i + 1}` : `Bot ${i + 1}`;
      }
      return mp.players.find((p) => p.id === id)?.displayName ?? "—";
    },
    [seatIds, mp.players, lang],
  );

  const [totals, setTotals] = useState<[number, number, number, number]>([
    0, 0, 0, 0,
  ]);
  const [round, setRound] = useState(1);
  const [phase, setPhase] = useState<"pick" | "reveal">("pick");
  const [lastCh, setLastCh] = useState<
    [number, number, number, number] | null
  >(null);
  const [lastD, setLastD] = useState<
    [number, number, number, number] | null
  >(null);
  const [done, setDone] = useState(false);

  const appliedV = useRef(0);
  const rGen = useRef(0);
  const picks = useRef<Record<number, Record<string, number>>>({});
  const totalsRef = useRef(totals);
  const roundRef = useRef(round);
  const resultSent = useRef(false);
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    totalsRef.current = totals;
  }, [totals]);
  useEffect(() => {
    roundRef.current = round;
  }, [round]);

  const seatIdsRef = useRef(seatIds);
  const humanIdsRef = useRef(humanIds);
  seatIdsRef.current = seatIds;
  humanIdsRef.current = humanIds;

  const finishIfNeeded = useCallback(
    (tot: [number, number, number, number], seatOrder: [string, string, string, string]) => {
      const w = firstWinner(tot);
      if (w < 0) {
        setPhase("pick");
        setLastCh(null);
        setLastD(null);
        return;
      }
      setDone(true);
      const winId = seatOrder[w]!;
      const won = winId === myId;
      if (won) grant({ coins: STONE_ROUND_COINS });
      const myScore =
        mySeat >= 0 && mySeat < 4 ? tot[mySeat]! : 0;
      if (!resultSent.current) {
        resultSent.current = true;
        onComplete(
          won ? "win" : "lose",
          Math.min(100, Math.round((myScore / WIN_SCORE) * 100)),
        );
      }
    },
    [grant, myId, mySeat, onComplete],
  );

  const applyR = useCallback(
    (msg: RMsg) => {
      if (msg.v <= appliedV.current) return;
      if (msg.r !== roundRef.current) return;
      appliedV.current = msg.v;
      totalsRef.current = msg.tot;
      setTotals(msg.tot);
      setLastCh(msg.ch);
      setLastD(roundPoints(msg.ch));
      setPhase("reveal");
      if (revealTimer.current) clearTimeout(revealTimer.current);
      revealTimer.current = setTimeout(() => {
        const w0 = firstWinner(msg.tot);
        if (w0 < 0) setRound((k) => k + 1);
        finishIfNeeded(msg.tot, seatIdsRef.current);
        delete picks.current[msg.r];
      }, 2000);
    },
    [finishIfNeeded],
  );

  const tryResolve = useCallback(() => {
    if (!isHost) return;
    const r0 = roundRef.current;
    const m = picks.current[r0];
    if (!m) return;
    for (const hid of humanIdsRef.current) {
      if (typeof m[hid] !== "number") return;
    }
    const snap: Record<string, number> = { ...m };
    delete picks.current[r0];
    const ch: [number, number, number, number] = [0, 0, 0, 0];
    for (let s = 0; s < 4; s++) {
      const id = seatIdsRef.current[s]!;
      if (humanIdsRef.current.includes(id)) {
        ch[s] = snap[id]!;
      } else {
        const rng = mulberry32(
          (matchSeed | 0) + r0 * 10_007 + s * 113 + 29,
        );
        ch[s] = pickBotPower(rng) as PowerId;
      }
    }
    const next = addTotals(totalsRef.current, roundPoints(ch));
    const v = (rGen.current += 1);
    const msg: RMsg = { kind: "R", v, r: r0, ch, tot: next };
    sendRelay(RELAY, msg);
    queueMicrotask(() => {
      applyR(msg);
    });
  }, [applyR, isHost, matchSeed, sendRelay]);

  useEffect(() => {
    return () => {
      if (revealTimer.current) clearTimeout(revealTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!lastPeerRelay || lastPeerRelay.channel !== RELAY) return;
    const pay = lastPeerRelay.payload;
    const r0 = parseR(pay);
    if (r0) {
      applyR(r0);
      return;
    }
    if (!isHost) return;
    const p0 = parseP(pay);
    if (!p0 || p0.r !== roundRef.current) return;
    if (!picks.current[p0.r]) picks.current[p0.r] = {};
    picks.current[p0.r]![p0.from] = p0.c;
    queueMicrotask(() => {
      tryResolve();
    });
  }, [applyR, isHost, lastPeerRelay, tryResolve]);

  const commit = useCallback(
    (c: PowerId) => {
      if (phase !== "pick" || done) return;
      if (!humanIds.includes(myId)) return;
      const r0 = roundRef.current;
      if (!picks.current[r0]) picks.current[r0] = {};
      picks.current[r0]![myId] = c;
      sendRelay(RELAY, { kind: "p", r: r0, from: myId, c } satisfies PMsg);
      if (isHost) queueMicrotask(() => {
        tryResolve();
      });
    },
    [done, humanIds, isHost, myId, phase, sendRelay, tryResolve],
  );

  return (
    <div
      className="flex h-full min-h-0 w-full flex-col overflow-hidden px-2 pb-3 pt-1 sm:px-4"
      style={{
        background:
          "radial-gradient(circle at 50% 20%, #1a2332 0%, #0a0806 55%)",
        color: "rgba(255,255,255,0.92)",
      }}
    >
      <div className="shrink-0 text-center">
        <h2
          className="font-display text-base font-bold tracking-wide text-amber-100/95 sm:text-lg"
          style={{ textShadow: "0 0 20px rgba(200,160,48,0.25)" }}
        >
          {lang === "mn" ? "Дөрвөн эрхэ" : "Clash of Four Powers"}
        </h2>
        <p className="mt-1 text-[11px] text-slate-400">
          {lang === "mn" ? "Өнгө" : "Round"} {round} · {WIN_SCORE}{" "}
          {lang === "mn" ? "оноо" : "pts"}
        </p>
      </div>

      <div className="mt-2 grid min-h-0 flex-1 grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        {[0, 1, 2, 3].map((i) => {
          const n = powerLabel(i, lang);
          const isMe = seatIds[i] === myId;
          return (
            <div
              key={i}
              className="flex min-h-0 flex-col rounded-xl border p-2 sm:p-3"
              style={{
                background: "rgba(12,10,8,0.85)",
                borderColor: isMe
                  ? "rgba(34,197,94,0.5)"
                  : "rgba(255,255,255,0.1)",
                boxShadow: isMe
                  ? "0 0 0 1px rgba(34,197,94,0.25)"
                  : undefined,
              }}
            >
              <div
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color: ACCENT[i] }}
              >
                {nameAtSeat(i)}
              </div>
              <div className="mt-0.5 line-clamp-1 text-sm font-semibold text-white">
                {n.name}
              </div>
              <div className="text-[10px] text-slate-500">{n.sub}</div>
              <div className="mt-auto pt-2 text-2xl font-bold tabular-nums text-amber-200">
                {totals[i] ?? 0}
              </div>
              {lastD && (lastD[i] ?? 0) > 0 && (
                <div className="text-xs font-semibold text-emerald-400">
                  +{lastD[i]!}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {phase === "reveal" && lastCh && (
        <p className="mt-2 text-center text-xs text-sky-200/90">
          {lastCh.map((c) => powerLabel(c, lang).name).join(" · ")}
        </p>
      )}

      {phase === "pick" && !done && humanIds.includes(myId) ? (
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {[0, 1, 2, 3].map((i) => {
            const L = powerLabel(i, lang);
            return (
              <button
                key={i}
                type="button"
                onClick={() => void commit(i as PowerId)}
                className="min-h-[3rem] min-w-[5.5rem] rounded-lg border px-3 py-2 text-left text-sm font-semibold transition hover:brightness-110"
                style={{
                  borderColor: `${ACCENT[i]}55`,
                  background: `linear-gradient(145deg, ${ACCENT[i]}18, #0c0a08)`,
                  color: "#fff",
                }}
              >
                {L.name}
              </button>
            );
          })}
        </div>
      ) : null}

      {done && (
        <p className="mt-2 text-center text-sm text-amber-200/90">
          {lang === "mn" ? "Дууссан." : "Finished."}
        </p>
      )}
    </div>
  );
}
