/**
 * Тоглолт дууссаны дараах ялалт/хожигдлын давхарга (Memory Pairs-ийн дэлгэцтэй ижил санаа).
 * Бусад тоглолтод `outcome` + гарчиг, тайлбар дамжуулж ашиглах боломжтой.
 */
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
          ? "radial-gradient(ellipse 60% 50% at 50% 45%, rgba(20, 80, 40, 0.72) 0%, rgba(0,0,0,0.75) 70%)"
          : "radial-gradient(ellipse 60% 50% at 50% 45%, rgba(80, 30, 25, 0.65) 0%, rgba(0,0,0,0.78) 70%)",
      }}
      role="status"
      aria-live="assertive"
    >
      <p
        className="text-center font-bold tracking-wide"
        style={{
          fontSize: "clamp(1.4rem, 5vw, 2.1rem)",
          lineHeight: 1.2,
          color: won ? "#b8f0b0" : "#f0b8a8",
          textShadow: won
            ? "0 0 40px rgba(100, 220, 120, 0.45)"
            : "0 0 32px rgba(200, 80, 60, 0.35)",
        }}
      >
        {won ? winTitle : loseTitle}
      </p>
      <p
        className="mt-2 max-w-sm text-center text-sm font-medium"
        style={{ color: "rgba(240, 230, 220, 0.88)" }}
      >
        {won ? subWin : subLose}
      </p>
    </div>
  );
}
