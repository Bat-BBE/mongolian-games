"use client";

import { LuMessageCircle as MessageCircle } from "react-icons/lu";
import { LuSend as SendIcon } from "react-icons/lu";
import { LuX as X } from "react-icons/lu";
import { useCallback, useEffect, useRef, useState } from "react";
import type { MatchRoomPlayer, PeerRelayEvent } from "@/hooks/useMatchRoom";
import { MATCH_ROOM_CHAT_RELAY_CHANNEL } from "@/lib/matchRoomRelayChannels";
import { playButtonClick } from "@/lib/uiSounds";
import { playChatReceiveMicro, playChatSendMicro } from "@/lib/uiSounds";
import { GAME_TEXT_META, GAME_UI_FONT_FAMILY } from "./gameUiTheme";

const MAX_CHARS = 280;

type ChatLine = {
  id: string;
  fromPlayerId: string;
  text: string;
  sentAt: number;
};

type Lang = "mn" | "en";

function parseChatPayload(
  payload: unknown,
): { text: string; sentAt: number } | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload))
    return null;
  const obj = payload as Record<string, unknown>;
  const t = obj.text;
  if (typeof t !== "string") return null;
  const s = t.replace(/\s+/g, " ").trim();
  if (!s) return null;
  const tsRaw = obj.sentAt;
  const sentAt =
    typeof tsRaw === "number" && Number.isFinite(tsRaw) ? tsRaw : Date.now();
  return { text: s.slice(0, MAX_CHARS), sentAt };
}

type Props = {
  language: Lang;
  roomCode: string;
  playerId: string | null;
  players: MatchRoomPlayer[];
  sendRelay: (channel: string, payload: unknown) => void;
  lastPeerRelay: PeerRelayEvent | null;
  myDisplayName: string;
};

export default function MatchRoomChatFab({
  language,
  roomCode,
  playerId,
  players,
  sendRelay,
  lastPeerRelay,
  myDisplayName,
}: Props) {
  const isMn = language === "mn";
  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState<ChatLine[]>([]);
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const seenRelayIdRef = useRef<Set<number>>(new Set());

  const formatClock = (ts: number) =>
    new Date(ts).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

  useEffect(() => {
    seenRelayIdRef.current = new Set();
    setLines([]);
    setDraft("");
  }, [roomCode]);

  useEffect(() => {
    if (
      !lastPeerRelay ||
      lastPeerRelay.channel !== MATCH_ROOM_CHAT_RELAY_CHANNEL
    )
      return;
    if (seenRelayIdRef.current.has(lastPeerRelay.id)) return;
    seenRelayIdRef.current.add(lastPeerRelay.id);
    const parsed = parseChatPayload(lastPeerRelay.payload);
    if (!parsed) return;
    if (!playerId || lastPeerRelay.from !== playerId) {
      playChatReceiveMicro(0.2);
    }
    setLines((prev) => [
      ...prev,
      {
        id: `r-${lastPeerRelay.id}`,
        fromPlayerId: lastPeerRelay.from,
        text: parsed.text,
        sentAt: parsed.sentAt,
      },
    ]);
  }, [lastPeerRelay, playerId]);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [lines, open]);

  const displayFor = useCallback(
    (pid: string) => {
      if (playerId && pid === playerId) return myDisplayName.trim() || "Player";
      const p = players.find((x) => x.id === pid);
      return p?.displayName?.trim() || pid.slice(0, 8);
    },
    [playerId, players, myDisplayName],
  );

  const send = () => {
    const text = draft.replace(/\s+/g, " ").trim();
    if (!text || !playerId) return;
    const clipped = text.slice(0, MAX_CHARS);
    const sentAt = Date.now();
    playChatSendMicro(0.22);
    playButtonClick();
    sendRelay(MATCH_ROOM_CHAT_RELAY_CHANNEL, { text: clipped, sentAt });
    setLines((prev) => [
      ...prev,
      {
        id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        fromPlayerId: playerId,
        text: clipped,
        sentAt,
      },
    ]);
    setDraft("");
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          playButtonClick();
          setOpen(true);
        }}
        className="pointer-events-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-zinc-600/55 bg-zinc-950/80 text-zinc-200 shadow-lg backdrop-blur-md transition hover:border-sky-500/40 hover:bg-zinc-900/90 hover:text-sky-100/95"
        style={{
          position: "absolute",
          bottom: "max(10px, env(safe-area-inset-bottom))",
          right: "max(10px, env(safe-area-inset-right))",
          zIndex: 12,
        }}
        aria-label={isMn ? "Чат" : "Chat"}
        title={isMn ? "Чат" : "Chat"}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <MessageCircle size={18} className="opacity-95" aria-hidden />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[110] flex flex-col items-end justify-end pr-3 pb-[max(10px,env(safe-area-inset-bottom))] pl-6 pt-10 sm:pr-4 sm:pb-4 sm:pl-8 sm:pt-12"
          style={{ background: "rgba(2,3,6,0.58)" }}
          onClick={() => setOpen(false)}
          role="presentation"
        >
          <div
            className="flex w-[min(100%,19.5rem)] max-h-[min(48dvh,360px)] flex-col rounded-2xl border border-zinc-500/35 bg-zinc-950/98 shadow-[0_20px_60px_-16px_rgba(0,0,0,0.85)]"
            style={{
              paddingBottom: "max(10px, env(safe-area-inset-bottom))",
            }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="match-room-chat-title"
          >
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 px-3 py-2 sm:px-4 sm:py-2.5">
              <h2
                id="match-room-chat-title"
                className="min-w-0 flex-1 truncate text-left font-[family-name:var(--font-inter)] text-sm font-semibold tracking-tight text-zinc-200"
              >
                {isMn ? "Чат" : "Chat"}
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/12 bg-black/35 text-zinc-400 transition hover:border-zinc-500/40 hover:bg-zinc-800/60 hover:text-zinc-100"
                aria-label={isMn ? "Хаах" : "Close"}
              >
                <X size={17} />
              </button>
            </div>
            <div
              ref={listRef}
              className="min-h-[72px] max-h-[min(32dvh,220px)] flex-1 overflow-y-auto overflow-x-hidden px-3 py-2 [scrollbar-color:rgba(113,113,122,0.45)_transparent] [scrollbar-width:thin] sm:min-h-[88px] sm:max-h-[min(36dvh,260px)] sm:px-4 sm:py-2.5"
              style={{ fontFamily: GAME_UI_FONT_FAMILY }}
            >
              {lines.length === 0 ? (
                <p className="text-center text-sm text-zinc-500">
                  {isMn
                    ? "Өрөөнд байгаа тоглогчидтой харилцах боломжтой."
                    : "Messages are visible to everyone in this room."}
                </p>
              ) : (
                <ul className="flex flex-col gap-2.5">
                  {lines.map((ln) => {
                    const isMe = Boolean(
                      playerId && ln.fromPlayerId === playerId,
                    );
                    return (
                      <li
                        key={ln.id}
                        className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[78%] rounded-2xl border px-3.5 py-2.5 text-sm leading-snug shadow-sm ${
                            isMe
                              ? "border-emerald-400/35 bg-emerald-900/25 text-zinc-100"
                              : "border-sky-400/25 bg-sky-950/25 text-zinc-100"
                          }`}
                        >
                          <p
                            className={`mb-0.5 text-[11px] font-semibold ${
                              isMe ? "text-emerald-200/95" : "text-sky-200/90"
                            }`}
                          >
                            {displayFor(ln.fromPlayerId)}
                          </p>
                          <p>{ln.text}</p>
                          <p className="mt-1 text-right text-[10px] text-zinc-400/85">
                            {formatClock(ln.sentAt)}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            <div className="shrink-0 border-t border-white/10 px-3 pb-2 pt-2 sm:px-4 sm:pb-2.5 sm:pt-2.5">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={draft}
                  maxLength={MAX_CHARS}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  placeholder={isMn ? "Мессеж…" : "Message…"}
                  disabled={!playerId}
                  className="min-w-0 flex-1 rounded-lg border border-zinc-600/35 bg-black/40 px-2.5 py-1.5 text-sm text-zinc-100 outline-none ring-sky-600/20 placeholder:text-zinc-600 focus:border-sky-500/45 focus:ring-2"
                />
                <button
                  type="button"
                  onClick={send}
                  disabled={!playerId || !draft.trim()}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-sky-600/40 bg-sky-950/35 text-sky-200 transition enabled:hover:border-sky-500/55 enabled:hover:bg-sky-900/45 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label={isMn ? "Илгээх" : "Send"}
                >
                  <SendIcon size={18} aria-hidden />
                </button>
              </div>
              <p className={`mt-1 text-right ${GAME_TEXT_META} text-zinc-600`}>
                {draft.length}/{MAX_CHARS}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
