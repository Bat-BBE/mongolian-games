"use client";

import { useApp } from "@/components/AppContext";
import type { MatchRoomControls } from "@/hooks/useMatchRoom";
import { playButtonClick } from "@/lib/uiSounds";
import { useEffect, useMemo, useState } from "react";
import {
  LuUsers as IconUsers,
  LuCopy as IconCopy,
  LuLogOut as IconLeave,
  LuPlay as IconPlay,
  LuRotateCcw as IconReset,
} from "react-icons/lu";

type Props = {
  mp: MatchRoomControls;
  enabled: boolean;
  supportsSharedBoard: boolean;
  /** Ижил өртөө + тоглоомын тогтмол код — «Өрөө нээх» эсвэл code_taken бол автоматаар нэгдэнэ. */
  suggestedMatchCode?: string | null;
  /** Хос ол: өрөөг гар ашиглахгүйгээр автоматаар нэгдэнэ. */
  autoMatchmaking?: boolean;
};

function useStrings() {
  const { language } = useApp();
  return useMemo(() => {
    if (language === "mn") {
      return {
        title: "Online өрөө",
        hint: "Код хуваалцаад нэгдээрэй. «Хос ол»-д ижил картууд.",
        create: "Өрөө нээх",
        join: "Нэгдэх",
        codePh: "Код",
        leave: "Гарах",
        ready: "Бэлэн",
        unready: "Буцаах",
        start: "Эхлүүлэх (эзэн)",
        resetLobby: "Дахин бэлдэх (эзэн)",
        conn: "Холбогдож байна…",
        disc: "Сүлжээ тасарсан",
        players: "Тоглогчид",
        copy: "Хуулах",
        copied: "Хуулсан",
        err: "Алдаа",
        need2: "Хамгийн багадаа 2 тоглогч.",
        shared: "Ижил самбар",
        soloNote: "Энэ тоглоомд зөвхөн өрөө + дохио; ижил тавилга удахгүй.",
        stationRoom:
          "Энэ өртөө + тоглоомын нийтлэг код — найзтайгаа ижил өрөөнд орно.",
        autoJoining: "Өрөөнд нэгдэж байна…",
        autoHint:
          "Найз ирвэл хамтдаа эхэлнэ. 10 секунд хүлээгээд хүн ирэхгүй бол ганцаарчилсан самбар (роботгүй, ижил дүрэм) автоматаар эхэлнэ.",
      };
    }
    return {
      title: "Online room",
      hint: "Share the code to join. Memory pairs uses the same card layout.",
      create: "Create room",
      join: "Join",
      codePh: "Code",
      leave: "Leave",
      ready: "Ready",
      unready: "Unready",
      start: "Start (host)",
      resetLobby: "Reset lobby (host)",
      conn: "Connecting…",
      disc: "Disconnected",
      players: "Players",
      copy: "Copy",
      copied: "Copied",
      err: "Error",
      need2: "Need at least 2 players.",
      shared: "Shared board",
      soloNote: "Lobby + signals only; same layout coming for more games.",
      stationRoom: "Public code for this station + game — friends join the same room.",
      autoJoining: "Joining the room…",
      autoHint:
        "If a friend joins, you start together. After 10s alone, a solo board auto-starts (same rules, no bot).",
    };
  }, [language]);
}

export function MultiplayerMatchPanel({
  mp,
  enabled,
  supportsSharedBoard,
  suggestedMatchCode,
  autoMatchmaking = false,
}: Props) {
  const s = useStrings();
  const [joinInput, setJoinInput] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const c = suggestedMatchCode?.trim().toUpperCase();
    if (!c) return;
    setJoinInput((v) => (v.trim() ? v : c));
  }, [suggestedMatchCode]);

  if (!enabled) return null;

  const allReady =
    mp.players.length >= 2 && mp.players.every((p) => p.ready);
  const me = mp.playerId
    ? mp.players.find((p) => p.id === mp.playerId)
    : undefined;

  async function copyCode() {
    if (!mp.roomCode) return;
    playButtonClick();
    try {
      await navigator.clipboard.writeText(mp.roomCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  return (
    <div
      className="shrink-0 border-b border-amber-500/25 bg-black/55 px-3 py-2.5 sm:px-4"
      style={{ borderColor: "rgba(200, 160, 48, 0.22)" }}
    >
      <div className="flex flex-wrap items-center gap-2 gap-y-2">
        <IconUsers className="size-4 shrink-0 text-amber-400/90" aria-hidden />
        <span
          className="text-[11px] font-semibold uppercase tracking-wider"
          style={{ color: "#c9a227" }}
        >
          {s.title}
        </span>
        {!mp.connected && (
          <span className="text-[10px] text-amber-200/70">{s.conn}</span>
        )}
        {mp.connected && mp.error && (
          <span className="text-[10px] text-red-300/90">
            {s.err}: {mp.error}
          </span>
        )}
        {mp.connected && !mp.roomCode && (
          <>
            {autoMatchmaking ? (
              <span className="text-[10px] text-amber-200/80">{s.autoJoining}</span>
            ) : (
              <>
                <button
                  type="button"
                  className="rounded-md border border-amber-500/35 bg-amber-950/40 px-2.5 py-1 text-[11px] font-medium text-amber-100/95 hover:bg-amber-900/45"
                  onClick={() => {
                    playButtonClick();
                    const sug = suggestedMatchCode?.trim().toUpperCase();
                    mp.createRoom(sug && sug.length === 6 ? sug : undefined);
                  }}
                >
                  {s.create}
                </button>
                <div className="flex items-center gap-1">
                  <input
                    value={joinInput}
                    onChange={(e) => setJoinInput(e.target.value.toUpperCase())}
                    placeholder={s.codePh}
                    maxLength={8}
                    className="w-24 rounded-md border border-amber-500/30 bg-black/50 px-2 py-1 text-[11px] uppercase text-amber-50 outline-none focus:border-amber-400/50"
                  />
                  <button
                    type="button"
                    className="rounded-md border border-amber-500/35 bg-black/40 px-2.5 py-1 text-[11px] font-medium text-amber-100/90 hover:bg-amber-950/50"
                    onClick={() => {
                      playButtonClick();
                      mp.joinRoom(joinInput);
                    }}
                  >
                    {s.join}
                  </button>
                </div>
              </>
            )}
          </>
        )}
        {mp.roomCode && (
          <>
            <span className="font-mono text-[12px] font-bold tracking-widest text-amber-100">
              {mp.roomCode}
            </span>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 px-2 py-0.5 text-[10px] text-amber-200/90 hover:bg-amber-950/40"
              onClick={() => void copyCode()}
            >
              <IconCopy className="size-3" />
              {copied ? s.copied : s.copy}
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-md border border-red-500/25 px-2 py-0.5 text-[10px] text-red-200/85 hover:bg-red-950/35"
              onClick={() => {
                playButtonClick();
                mp.leaveRoom();
              }}
            >
              <IconLeave className="size-3" />
              {s.leave}
            </button>
          </>
        )}
      </div>
      <p className="mt-1.5 text-[10px] leading-snug text-amber-100/55">
        {autoMatchmaking && supportsSharedBoard
          ? `${s.autoHint} ${suggestedMatchCode?.trim() ? `★ ${s.shared}.` : ""}`
          : suggestedMatchCode?.trim()
            ? `${s.stationRoom} ${supportsSharedBoard ? `★ ${s.shared}.` : ""} ${s.hint}`
            : supportsSharedBoard
              ? `★ ${s.shared}. ${s.hint}`
              : s.soloNote}
      </p>
      {mp.roomCode && (
        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="min-w-0 flex-1">
            <p className="mb-1 text-[10px] font-medium text-amber-200/70">
              {s.players} ({mp.players.length}/{mp.maxPlayers})
            </p>
            <ul className="flex flex-wrap gap-1.5">
              {mp.players.map((p) => (
                <li
                  key={p.id}
                  className="rounded-md border border-amber-500/25 bg-black/35 px-2 py-0.5 text-[10px] text-amber-50/90"
                >
                  {p.displayName || "…"}
                  {p.ready ? " ✓" : ""}
                  {p.id === mp.hostId ? " · H" : ""}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {me && mp.roomStatus === "lobby" && !autoMatchmaking && (
              <button
                type="button"
                className="rounded-md border border-amber-500/35 bg-amber-950/35 px-2.5 py-1 text-[11px] text-amber-50 hover:bg-amber-900/40"
                onClick={() => {
                  playButtonClick();
                  mp.setReady(!me.ready);
                }}
              >
                {me.ready ? s.unready : s.ready}
              </button>
            )}
            {mp.isHost && mp.roomStatus === "lobby" && !autoMatchmaking && (
              <button
                type="button"
                disabled={!allReady}
                title={!allReady ? s.need2 : undefined}
                className="inline-flex items-center gap-1 rounded-md border border-emerald-500/35 bg-emerald-950/40 px-2.5 py-1 text-[11px] font-medium text-emerald-100/95 enabled:hover:bg-emerald-900/45 disabled:cursor-not-allowed disabled:opacity-45"
                onClick={() => {
                  playButtonClick();
                  mp.startMatch();
                }}
              >
                <IconPlay className="size-3.5" />
                {s.start}
              </button>
            )}
            {mp.isHost && mp.roomStatus === "playing" && (
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-black/45 px-2.5 py-1 text-[11px] text-amber-100/90 hover:bg-amber-950/40"
                onClick={() => {
                  playButtonClick();
                  mp.resetRoomLobby();
                }}
              >
                <IconReset className="size-3.5" />
                {s.resetLobby}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
