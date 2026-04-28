"use client";

import { useApp } from "@/components/AppContext";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MatchRoomControls, PeerRelayEvent } from "@/hooks/useMatchRoom";
import {
  MAX_ENERGY,
  makeInitialRoundState,
  POWER_SPECS,
  resolveRoundWithEffects,
  suggestMovesForSeat,
  WIN_SCORE,
  firstWinner,
  mulberry32,
  pickBotPower,
  powerLabel,
  type RoundState,
  type Seat4,
  type PowerId,
} from "./fourPowersType";
import { useInventoryGrant } from "./useInventoryGrant";
import { STONE_ROUND_COINS } from "./gameRewardConstants";
import { useMatchLobbyIntro } from "./gameModalSession";
import { FourPowersHowItWorks } from "./fourPowersRulesUI";
import {
  GAME_LOBBY_INTRO_CLASS,
  GAME_TEXT_META,
  GAME_TEXT_MONO_META,
  GAME_TEXT_SECTION_LABEL,
} from "./gameUiTheme";

const RELAY = "four_powers_mp_v1";

type PMsg = { kind: "p"; r: number; from: string; c: number };
type RMsg = {
  kind: "R";
  v: number;
  r: number;
  ch: Seat4;
  st: RoundState;
  d: Seat4;
  notes: string[];
};

const ACCENT = ["#38bdf8", "#a3e635", "#fbbf24", "#f472b6"] as const;

function parseR(p: unknown): RMsg | null {
  if (typeof p !== "object" || p === null) return null;
  const o = p as RMsg;
  if (o.kind !== "R") return null;
  if (typeof o.v !== "number" || typeof o.r !== "number") return null;
  if (!Array.isArray(o.ch) || o.ch.length !== 4) return null;
  if (!Array.isArray(o.st?.totals) || o.st.totals.length !== 4) return null;
  if (!Array.isArray(o.st?.energy) || o.st.energy.length !== 4) return null;
  if (typeof o.st?.round !== "number") return null;
  if (!Array.isArray(o.d) || o.d.length !== 4) return null;
  if (!Array.isArray(o.notes)) return null;
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
  const lobbyIntro = useMatchLobbyIntro(language === "en" ? "en" : "mn");
  return (
    <div
      className="flex h-full w-full items-center justify-center p-4 text-center"
      style={{
        background:
          "radial-gradient(circle at 50% 50%, #1a1410 0%, #0a0806 100%)",
      }}
    >
      <span className={`max-w-md text-balance ${GAME_LOBBY_INTRO_CLASS}`}>
        {lobbyIntro}
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

  const [state, setState] = useState<RoundState>(() => makeInitialRoundState());
  const [phase, setPhase] = useState<"pick" | "reveal">("pick");
  const [lastCh, setLastCh] = useState<Seat4 | null>(null);
  const [lastD, setLastD] = useState<Seat4 | null>(null);
  const [lastNotes, setLastNotes] = useState<string[]>([]);
  const [picked, setPicked] = useState<PowerId | null>(null);
  const [done, setDone] = useState(false);

  const appliedV = useRef(0);
  const rGen = useRef(0);
  const picks = useRef<Record<number, Record<string, number>>>({});
  const stateRef = useRef(state);
  const roundRef = useRef(state.round);
  const resultSent = useRef(false);
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    stateRef.current = state;
    roundRef.current = state.round;
  }, [state]);

  const seatIdsRef = useRef(seatIds);
  const humanIdsRef = useRef(humanIds);
  seatIdsRef.current = seatIds;
  humanIdsRef.current = humanIds;

  const finishIfNeeded = useCallback(
    (st: RoundState, seatOrder: [string, string, string, string]) => {
      const w = firstWinner(st.totals);
      if (w < 0) {
        setPhase("pick");
        setLastCh(null);
        setLastD(null);
        setLastNotes([]);
        return;
      }
      setDone(true);
      const winId = seatOrder[w]!;
      const won = winId === myId;
      if (won) grant({ coins: STONE_ROUND_COINS });
      const myScore =
        mySeat >= 0 && mySeat < 4 ? st.totals[mySeat]! : 0;
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
      stateRef.current = msg.st;
      setState(msg.st);
      setLastCh(msg.ch);
      setLastD(msg.d);
      setLastNotes(msg.notes ?? []);
      setPhase("reveal");
      if (revealTimer.current) clearTimeout(revealTimer.current);
      revealTimer.current = setTimeout(() => {
        finishIfNeeded(msg.st, seatIdsRef.current);
        delete picks.current[msg.r];
      }, 2000);
    },
    [finishIfNeeded],
  );

  const tryResolve = useCallback(() => {
    if (!isHost) return;
    const current = stateRef.current;
    const r0 = current.round;
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
    const resolved = resolveRoundWithEffects(current, ch);
    const v = (rGen.current += 1);
    const msg: RMsg = {
      kind: "R",
      v,
      r: r0,
      ch: resolved.appliedChoices,
      st: resolved.nextState,
      d: resolved.deltas,
      notes: resolved.notes,
    };
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
      setPicked(c);
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
        <div className="mt-1.5">
          <FourPowersHowItWorks lang={lang} variant="online" />
        </div>
        <p className={`mt-1 ${GAME_TEXT_MONO_META}`}>
          {lang === "mn" ? "Өнгө" : "Round"} {state.round} · {WIN_SCORE}{" "}
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
                className={`${GAME_TEXT_SECTION_LABEL} !font-bold tracking-wider`}
                style={{ color: ACCENT[i] }}
              >
                {nameAtSeat(i)}
              </div>
              <div className="mt-0.5 line-clamp-1 text-sm font-semibold text-white">
                {n.name}
              </div>
              <div className={`${GAME_TEXT_META} text-slate-500 flex items-center justify-between gap-2`}>
                <span>{n.sub}</span>
                <span className="rounded border border-white/15 px-1 text-[10px] text-slate-300">
                  E{state.energy[i]}/{MAX_ENERGY}
                </span>
              </div>
              <div className="mt-auto pt-2 text-2xl font-bold tabular-nums text-amber-200">
                {state.totals[i] ?? 0}
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

      {mySeat >= 0 ? (
        <p className="mt-2 text-center text-xs text-zinc-300">
          {(() => {
            const h = suggestMovesForSeat(state, mySeat);
            return lang === "mn"
              ? `Санал: Шилдэг ${powerLabel(h.best, lang).name} · Аюулгүй ${powerLabel(h.safe, lang).name} · Эрсдэлтэй ${powerLabel(h.risk, lang).name}`
              : `Hint: Best ${powerLabel(h.best, lang).name} · Safe ${powerLabel(h.safe, lang).name} · Risk ${powerLabel(h.risk, lang).name}`;
          })()}
        </p>
      ) : null}

      {phase === "reveal" && lastCh && (
        <p className="mt-2 text-center text-xs text-sky-200/90">
          {lastCh.map((c) => powerLabel(c, lang).name).join(" · ")}
          {lastNotes.length > 0 ? ` · ${lastNotes.join(", ")}` : ""}
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
                  opacity: POWER_SPECS[i].cost > state.energy[mySeat] ? 0.45 : 1,
                }}
              >
                <div>{L.name}</div>
                <div className="text-[10px] text-zinc-300">Cost {POWER_SPECS[i].cost}</div>
              </button>
            );
          })}
        </div>
      ) : null}
      {picked != null && phase === "pick" ? (
        <p className="mt-1 text-center text-[11px] text-amber-200/80">
          {lang === "mn"
            ? `Сонгосон: ${powerLabel(picked, lang).name}`
            : `Selected: ${powerLabel(picked, lang).name}`}
        </p>
      ) : null}

      {done && (
        <p className="mt-2 text-center text-sm text-amber-200/90">
          {lang === "mn" ? "Дууссан." : "Finished."}
        </p>
      )}
    </div>
  );
}
