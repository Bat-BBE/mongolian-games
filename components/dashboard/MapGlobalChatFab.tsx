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
import { cn } from "@/lib/utils";

const MAX_CHARS = 280;

type Lang = "mn" | "en";

type Props = {
  language: Lang;
  myDisplayName: string;
  linesRef: MutableRefObject<MapChatLine[]>;
  onIncomingLine: (listener: ((line: MapChatLine) => void) | null) => void;
  sendChat: (text: string) => void;
  /** Жишээ нь joystick-ийн дээр байрлуулах доод offset (Tailwind class) */
  fabClassName?: string;
};

export function MapGlobalChatFab({
  language,
  myDisplayName,
  linesRef,
  onIncomingLine,
  sendChat,
  fabClassName,
}: Props) {
  const isMn = language === "mn";
  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState<MapChatLine[]>([]);
  const [draft, setDraft] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const openRef = useRef(open);
  const myNameRef = useRef(myDisplayName.trim().toLowerCase());

  useEffect(() => {
    openRef.current = open;
    if (open) setUnreadCount(0);
  }, [open]);

  useEffect(() => {
    myNameRef.current = myDisplayName.trim().toLowerCase();
  }, [myDisplayName]);

  useEffect(() => {
    setLines(linesRef.current.slice(-120));
    onIncomingLine((line) => {
      setLines((prev) => [...prev.slice(-119), line]);
      const isMe = line.fromDisplayName.trim().toLowerCase() === myNameRef.current;
      if (!isMe) playChatReceiveMicro(0.2);
      if (!isMe && !openRef.current) {
        setUnreadCount((prev) => Math.min(99, prev + 1));
      }
    });
    return () => onIncomingLine(null);
  }, [linesRef, onIncomingLine]);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [lines, open]);

  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => inputRef.current?.focus(), 60);
    return () => window.clearTimeout(id);
  }, [open]);

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
        className={cn(
          "map-ui-fab pointer-events-auto absolute right-3 z-[61] flex h-10 w-10 items-center justify-center rounded-full shadow-md sm:h-11 sm:w-11",
          fabClassName ??
            "bottom-[max(0.5rem,env(safe-area-inset-bottom,0px))] md:bottom-4",
        )}
        aria-label={title}
        title={title}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <MessageCircle
          size={20}
          className="text-[color:var(--map-ui-text)] opacity-95"
          aria-hidden
        />
        {unreadCount > 0 ? (
          <span
            className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full border border-rose-200/60 bg-rose-500 px-1 text-[10px] font-bold leading-none text-white shadow"
            aria-label={
              isMn
                ? `Шинэ мессеж: ${unreadCount}`
                : `New messages: ${unreadCount}`
            }
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          className={cn(
            "fixed inset-0 z-[170] flex flex-col items-end justify-end px-3 pt-10 sm:px-4 sm:pt-12",
            "pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]",
          )}
          style={{ background: "var(--map-overlay-scrim)" }}
          onClick={() => setOpen(false)}
          role="presentation"
        >
          <div
            className="map-ui-surface flex w-[min(100%,23rem)] max-h-[min(64dvh,540px)] min-h-[260px] flex-col overflow-hidden rounded-2xl border shadow-2xl"
            style={{
              paddingBottom: "max(10px, env(safe-area-inset-bottom))",
              marginBottom: "max(0px, env(safe-area-inset-bottom, 0px))",
            }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="map-chat-title"
          >
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[color:var(--map-ui-border)] px-3 py-2.5 sm:px-4">
              <h2
                id="map-chat-title"
                className="min-w-0 flex-1 truncate text-left font-[family-name:var(--font-inter)] text-sm font-semibold tracking-tight"
                style={{ color: "var(--map-ui-text)" }}
              >
                {title}
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[color:var(--map-ui-border-subtle)] transition hover:border-[color:var(--map-ui-border-bright)] hover:bg-white/8"
                style={{ color: "var(--map-ui-text-muted)" }}
                aria-label={isMn ? "Хаах" : "Close"}
              >
                <X size={17} />
              </button>
            </div>

            <div
              ref={listRef}
              className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 py-2.5 sm:px-4 [scrollbar-color:color-mix(in_srgb,var(--map-gold)_35%,transparent)_transparent] [scrollbar-width:thin]"
            >
              {lines.length === 0 ? (
                <p
                  className="px-1 py-6 text-center text-sm leading-relaxed"
                  style={{ color: "var(--map-ui-text-muted)" }}
                >
                  {isMn
                    ? "Map дээрх бүх тоглогчид энд илгээсэн мессежийг харна."
                    : "Everyone on this map can see messages sent here."}
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
                          className={cn(
                            "max-w-[85%] rounded-2xl border px-3 py-2 text-sm leading-snug shadow-sm",
                            isMe
                              ? "border-amber-400/35 bg-[color-mix(in_srgb,var(--map-gold)_14%,transparent)]"
                              : "border-[color:var(--map-ui-border)] bg-[color-mix(in_srgb,var(--map-ui-base)_50%,transparent)]",
                          )}
                          style={{ color: "var(--map-ui-text)" }}
                        >
                          <p
                            className={cn(
                              "mb-0.5 text-[11px] font-semibold",
                              isMe
                                ? "text-[color:var(--map-gold)]"
                                : "text-[color:var(--map-ui-text-muted)]",
                            )}
                          >
                            {ln.fromDisplayName}
                          </p>
                          <p className="break-words">{ln.text}</p>
                          <p
                            className="mt-1 text-right text-[10px]"
                            style={{ color: "var(--map-ui-text-muted)" }}
                          >
                            {formatClock(ln.sentAt)}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="shrink-0 border-t border-[color:var(--map-ui-border)] px-3 pb-2.5 pt-2 sm:px-4 sm:pb-3 sm:pt-2.5">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
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
                  placeholder={isMn ? "Мессеж бичнэ үү…" : "Type a message…"}
                  className="min-w-0 flex-1 rounded-xl border px-3 py-2 text-sm outline-none transition placeholder:opacity-60 focus-visible:ring-2 focus-visible:ring-amber-400/25"
                  style={{
                    borderColor: "var(--map-ui-border)",
                    background:
                      "color-mix(in srgb, var(--map-ui-base) 40%, transparent)",
                    color: "var(--map-ui-text)",
                    caretColor: "var(--map-gold)",
                  }}
                />
                <button
                  type="button"
                  onClick={onSend}
                  disabled={!draft.trim()}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition disabled:cursor-not-allowed disabled:opacity-40"
                  style={{
                    borderColor:
                      "color-mix(in srgb, var(--map-gold) 45%, transparent)",
                    background:
                      "color-mix(in srgb, var(--map-gold) 18%, transparent)",
                    color: "var(--map-gold)",
                  }}
                  aria-label={isMn ? "Илгээх" : "Send"}
                >
                  <SendIcon size={18} aria-hidden />
                </button>
              </div>
              <p
                className="mt-1 text-right text-[11px] tabular-nums"
                style={{ color: "var(--map-ui-text-muted)" }}
              >
                {draft.length}/{MAX_CHARS}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
