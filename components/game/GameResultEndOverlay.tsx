import { LuPartyPopper as PartyPopper } from "react-icons/lu";
import { LuFrown as Frown } from "react-icons/lu";
import { GAME_UI_FONT_FAMILY } from "./gameUiTheme";

export function GameResultEndOverlay({
  outcome,
  winTitle,
  loseTitle,
  subWin,
  subLose,
}: {
  outcome: "win" | "lose" | null;
  winTitle: string;
  loseTitle: string;
  subWin: string;
  subLose: string;
}) {
  if (!outcome) return null;
  const won = outcome === "win";
  return (
    <div
      className="pointer-events-none absolute inset-0 z-[32] flex flex-col items-center justify-center px-4"
      style={{
        background: won
          ? "radial-gradient(ellipse 65% 55% at 50% 42%, rgba(24, 90, 48, 0.55) 0%, rgba(0,0,0,0.82) 72%)"
          : "radial-gradient(ellipse 65% 55% at 50% 42%, rgba(90, 32, 28, 0.5) 0%, rgba(0,0,0,0.85) 72%)",
      }}
      role="status"
      aria-live="assertive"
    >
      <div
        className="game-result-end-card max-w-md"
        style={{
          fontFamily: GAME_UI_FONT_FAMILY,
          borderRadius: 18,
          padding: "1.25rem 1.5rem",
          border: won
            ? "1px solid rgba(120, 200, 130, 0.35)"
            : "1px solid rgba(200, 120, 100, 0.3)",
          background: won
            ? "linear-gradient(165deg, rgba(12, 40, 22, 0.92) 0%, rgba(8, 14, 10, 0.94) 100%)"
            : "linear-gradient(165deg, rgba(40, 18, 16, 0.92) 0%, rgba(12, 8, 8, 0.94) 100%)",
          boxShadow: won
            ? "0 12px 48px rgba(40, 160, 80, 0.2), inset 0 1px 0 rgba(255,255,255,0.06)"
            : "0 12px 40px rgba(160, 50, 40, 0.15), inset 0 1px 0 rgba(255,255,255,0.04)",
          backdropFilter: "blur(10px)",
        }}
      >
        <div className="flex flex-col items-center text-center">
          <div
            className="mb-2 flex h-12 w-12 items-center justify-center rounded-full"
            style={{
              background: won ? "rgba(80, 180, 100, 0.2)" : "rgba(180, 80, 70, 0.18)",
              color: won ? "#9ee8a8" : "#f0b0a0",
            }}
            aria-hidden
          >
            {won ? <PartyPopper className="size-6" /> : <Frown className="size-6" />}
          </div>
          <p
            className="text-balance font-bold tracking-tight"
            style={{
              fontSize: "clamp(1.05rem, 3.8vw, 1.45rem)",
              lineHeight: 1.2,
              color: won ? "#c8f2c0" : "#f5ccc0",
              textShadow: won
                ? "0 0 28px rgba(80, 200, 100, 0.35)"
                : "0 0 24px rgba(200, 90, 70, 0.25)",
            }}
          >
            {won ? winTitle : loseTitle}
          </p>
          <p
            className="mt-2 max-w-sm text-pretty text-sm leading-relaxed"
            style={{ color: "rgba(235, 225, 210, 0.88)" }}
          >
            {won ? subWin : subLose}
          </p>
        </div>
      </div>
      <style>{`
        @keyframes game-result-fade-zoom {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
        .game-result-end-card {
          animation: game-result-fade-zoom 0.35s ease-out both;
        }
      `}</style>
    </div>
  );
}
