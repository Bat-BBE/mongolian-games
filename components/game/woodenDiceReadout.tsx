import type { CSSProperties } from "react";
import { DICE_PIP_CELLS } from "./woodenDicePipLayout";

const PIP = DICE_PIP_CELLS;

function clampDie(n: number): 1 | 2 | 3 | 4 | 5 | 6 {
  const v = Math.round(n);
  if (v < 1) return 1;
  if (v > 6) return 6;
  return v as 1 | 2 | 3 | 4 | 5 | 6;
}

const faceStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gridTemplateRows: "repeat(3, 1fr)",
  width: 44,
  height: 44,
  gap: 2,
  padding: 4,
  borderRadius: 8,
  border: "1px solid rgba(255,255,255,0.15)",
  background: "rgba(0,0,0,0.45)",
  boxSizing: "border-box",
};

function makeFaceStyle(compact: boolean): CSSProperties {
  if (!compact) return faceStyle;
  return {
    ...faceStyle,
    width: 32,
    height: 32,
    gap: 1,
    padding: 2,
  };
}

function DiePipFace({
  value,
  title,
  faceStyle: fs,
  pip,
}: {
  value: number;
  title: string;
  faceStyle: CSSProperties;
  pip: number;
}) {
  const v = clampDie(value);
  const pips = PIP[v] ?? PIP[1]!;
  const set = new Set(pips.map(([r, c]) => `${r},${c}`));
  return (
    <div style={fs} role="img" aria-label={title}>
      {Array.from({ length: 9 }, (_, i) => {
        const r = (i / 3) | 0;
        const c = i % 3;
        const on = set.has(`${r},${c}`);
        return (
          <div
            key={i}
            className="flex items-center justify-center"
            style={{ minWidth: 0, minHeight: 0 }}
          >
            {on ? (
              <span
                className="rounded-full bg-amber-200/90"
                style={{
                  width: pip,
                  height: pip,
                  boxShadow: "0 0 4px rgba(255,200,100,0.3)",
                }}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

type Tone = "sky" | "rose" | "amber";

const toneName: Record<Tone, { bg: string; text: string; sub: string }> = {
  sky: { bg: "bg-sky-500/10", text: "text-sky-100", sub: "text-sky-200/70" },
  rose: {
    bg: "bg-rose-500/10",
    text: "text-rose-100",
    sub: "text-rose-200/70",
  },
  amber: {
    bg: "bg-amber-500/10",
    text: "text-amber-100",
    sub: "text-amber-200/70",
  },
};

export function TripleDiceReadout({
  triple,
  label,
  sumLabel,
  sum,
  dieLabels,
  tone = "sky",
  spinning = false,
  compact = false,
  className = "",
}: {
  triple: [number, number, number] | null;
  label: string;
  sumLabel: string;
  sum: number | null;
  dieLabels: readonly [string, string, string];
  tone?: Tone;
  spinning?: boolean;
  compact?: boolean;
  className?: string;
}) {
  const t = toneName[tone];
  const fs = makeFaceStyle(compact);
  const pip = compact ? 5 : 6;
  return (
    <div
      className={`flex min-w-0 max-w-[min(100%,16rem)] flex-col items-center gap-1.5 rounded-xl border border-white/10 p-1.5 sm:gap-2 sm:p-2 ${compact ? "h-full w-full min-h-0 max-w-none justify-between" : ""} ${t.bg} ${className}`.trim()}
    >
      <p
        className={`w-full text-center font-semibold uppercase tracking-wide text-slate-400 ${compact ? "text-[7px] leading-tight" : "text-[9px]"}`}
      >
        {label}
      </p>
      {spinning ? (
        <p
          className={`text-sm ${t.sub} ${compact ? "min-h-[1.5rem] text-xs" : "min-h-[4.5rem]"}`}
          aria-live="polite"
        >
          …
        </p>
      ) : (
        <div
          className={`flex w-full items-center justify-center ${compact ? "gap-1.5" : "flex-wrap gap-2 sm:gap-3"}`}
        >
          {(triple ? triple : [null, null, null]).map((v, i) => (
            <div
              key={i}
              className={`flex flex-col items-center ${compact ? "gap-1" : "gap-0.5"}`}
            >
              <span
                className={`uppercase text-slate-500 ${compact ? "text-[6px]" : "text-[8px]"}`}
              >
                {dieLabels[i]}
              </span>
              {v == null ? (
                <div
                  className="flex items-center justify-center text-slate-600"
                  style={{ ...fs, fontSize: 10 }}
                >
                  —
                </div>
              ) : (
                <>
                  <DiePipFace
                    value={v}
                    title={`${dieLabels[i]}: ${v}`}
                    faceStyle={fs}
                    pip={pip}
                  />
                  <span
                    className={`font-bold tabular-nums leading-none ${t.text} ${compact ? "text-sm" : "text-lg"}`}
                    aria-hidden
                  >
                    {v}
                  </span>
                </>
              )}
            </div>
          ))}
        </div>
      )}
      <div className="w-full border-t border-white/10 text-center [font-variant-numeric:tabular-nums] pt-1.5">
        <span
          className={`text-slate-500 ${compact ? "text-[7px]" : "text-[9px]"}`}
        >
          {sumLabel}
        </span>
        <p
          className={`font-bold tabular-nums ${t.text} ${compact ? "text-lg" : "text-2xl"}`}
        >
          {spinning ? "…" : sum == null ? "—" : sum}
        </p>
      </div>
    </div>
  );
}
