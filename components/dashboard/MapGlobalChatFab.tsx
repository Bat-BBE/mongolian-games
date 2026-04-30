"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
} from "react";
import { LuMessageCircle as MessageCircle } from "react-icons/lu";
import { LuSend as SendIcon } from "react-icons/lu";
import { LuX as X } from "react-icons/lu";
import type { MapChatLine } from "@/hooks/useMapPresence";
import { playChatReceiveMicro, playChatSendMicro } from "@/lib/uiSounds";

const MAX_CHARS = 280;

type Lang = "mn" | "en";

type Props = {
  language: Lang;
  myDisplayName: string;
  linesRef: MutableRefObject<MapChatLine[]>;
  onIncomingLine: (listener: ((line: MapChatLine) => void) | null) => void;
  sendChat: (text: string) => void;
};

export function MapGlobalChatFab({
  language,
  myDisplayName,
  linesRef,
  onIncomingLine,
  sendChat,
}: Props) {
  const isMn = language === "mn";
  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState<MapChatLine[]>([]);
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLines(linesRef.current.slice(-120));
    onIncomingLine((line) => {
      setLines((prev) => [...prev.slice(-119), line]);
      const isMe =
        line.fromDisplayName.trim().toLowerCase() ===
        myDisplayName.trim().toLowerCase();
      if (!isMe) playChatReceiveMicro(0.2);
    });
    return () => onIncomingLine(null);
  }, [linesRef, onIncomingLine, myDisplayName]);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [lines, open]);

  const title = useMemo(
    () => (isMn ? "Газрын зургийн чат" : "Map chat"),
    [isMn],
  );

  const formatClock = (ts: number) =>
    new Date(ts).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

  function onSend() {
    const text = draft.replace(/\s+/g, " ").trim().slice(0, MAX_CHARS);
    if (!text) return;
    playChatSendMicro(0.22);
    sendChat(text);
    setDraft("");
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="map-ui-fab pointer-events-auto absolute right-3 z-[60] flex h-9 w-9 items-center justify-center rounded-full bottom-[max(0.5rem,env(safe-area-inset-bottom,0px))] md:bottom-4"
        aria-label={title}
        title={title}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <MessageCircle size={18} className="opacity-95" aria-hidden />
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[170] flex flex-col items-end justify-end pr-3 pb-[max(10px,env(safe-area-inset-bottom))] pl-6 pt-10 sm:pr-4 sm:pb-4 sm:pl-8 sm:pt-12"
          style={{ background: "rgba(2,3,6,0.58)" }}
          onClick={() => setOpen(false)}
          role="presentation"
        >
          <div
            className="flex w-[min(100%,21rem)] max-h-[min(52dvh,410px)] flex-col rounded-2xl border border-zinc-500/35 bg-zinc-950/98 shadow-[0_20px_60px_-16px_rgba(0,0,0,0.85)]"
            style={{ paddingBottom: "max(10px, env(safe-area-inset-bottom))" }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="map-chat-title"
          >
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 px-3 py-2 sm:px-4 sm:py-2.5">
              <h2
                id="map-chat-title"
                className="min-w-0 flex-1 truncate text-left font-[family-name:var(--font-inter)] text-sm font-semibold tracking-tight text-zinc-200"
              >
                {title}
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
              className="min-h-[72px] max-h-[min(34dvh,240px)] flex-1 overflow-y-auto overflow-x-hidden px-3 py-2 [scrollbar-color:rgba(113,113,122,0.45)_transparent] [scrollbar-width:thin] sm:min-h-[88px] sm:max-h-[min(36dvh,270px)] sm:px-4 sm:py-2.5"
            >
              {lines.length === 0 ? (
                <p className="text-center text-sm text-zinc-500">
                  {isMn
                    ? "Map дээрх бүх хэрэглэгчид энэ мессежийг харна."
                    : "Messages are visible to everyone on this map."}
                </p>
              ) : (
                <ul className="flex flex-col gap-2.5">
                  {lines.map((ln) => {
                    const isMe =
                      ln.fromDisplayName.trim().toLowerCase() ===
                      myDisplayName.trim().toLowerCase();
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
                            {ln.fromDisplayName}
                          </p>
                          <p>{ln.text}</p>
                          <p className="mt-1 text-right text-[10px] text-zinc-400/85">
                            {formatClock(ln.sentAt || Date.now())}
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
                      onSend();
                    }
                  }}
                  placeholder={isMn ? "Мессеж…" : "Message…"}
                  className="min-w-0 flex-1 rounded-lg border border-zinc-600/35 bg-black/40 px-2.5 py-1.5 text-sm text-zinc-100 outline-none ring-sky-600/20 placeholder:text-zinc-600 focus:border-sky-500/45 focus:ring-2"
                />
                <button
                  type="button"
                  onClick={onSend}
                  disabled={!draft.trim()}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-sky-600/40 bg-sky-950/35 text-sky-200 transition enabled:hover:border-sky-500/55 enabled:hover:bg-sky-900/45 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label={isMn ? "Илгээх" : "Send"}
                >
                  <SendIcon size={18} aria-hidden />
                </button>
              </div>
              <p className="mt-1 text-right text-xs text-zinc-600">
                {draft.length}/{MAX_CHARS}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
