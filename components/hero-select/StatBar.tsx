"use client";

interface StatBarProps {
  label: string;
  value: number;
  color: string;
}

export function StatBar({ label, value, color }: StatBarProps) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="text-[9px] uppercase tracking-[0.15em] w-16 text-right shrink-0"
        style={{ color: "rgb(255, 255, 255)" }}
      >
        {label}
      </span>

      <div
        className="flex-1 h-[3px] rounded-full overflow-hidden"
        style={{ background: "rgba(255, 255, 255, 0.53)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${value}%`,
            background: `linear-gradient(90deg, ${color}66, ${color})`,
            boxShadow: `0 0 8px ${color}55`,
          }}
        />
      </div>

      <span className="text-[9px] w-6 shrink-0" style={{ color: "rgb(255, 255, 255)" }}>
        {value}
      </span>
    </div>
  );
}