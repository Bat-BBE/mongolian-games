"use client";

import { useState, useEffect, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type StationType = "capital" | "river" | "mountain" | "desert";

interface Station {
  id: string;
  name: string;
  icon: string;
  desc: string;
  x: number;
  y: number;
  horses: number;
  distance: string;
  type: StationType;
}

interface PathData {
  key: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  done: boolean;
  active: boolean;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  dur: number;
}

interface TypeColor {
  bg: string;
  border: string;
  glow: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const STATIONS: Station[] = [
  {
    id: "kharakhorum",
    name: "Хархорум",
    icon: "🏛️",
    desc: "Монгол эзэнт гүрний нийслэл",
    x: 22, y: 62,
    horses: 40,
    distance: "0 км",
    type: "capital",
  },
  {
    id: "orkhon",
    name: "Орхон",
    icon: "🌊",
    desc: "Орхон голын эрэг дахь буудал",
    x: 42, y: 44,
    horses: 28,
    distance: "180 км",
    type: "river",
  },
  {
    id: "erdenet",
    name: "Эрдэнэт",
    icon: "⛏️",
    desc: "Уулын нурууны дундах буудал",
    x: 60, y: 30,
    horses: 35,
    distance: "320 км",
    type: "mountain",
  },
  {
    id: "altai",
    name: "Алтай",
    icon: "⛰️",
    desc: "Алтайн нурууны өвөр",
    x: 76, y: 20,
    horses: 22,
    distance: "460 км",
    type: "mountain",
  },
  {
    id: "gobi",
    name: "Говь",
    icon: "🏜️",
    desc: "Говийн цөлийн дундах буудал",
    x: 86, y: 52,
    horses: 18,
    distance: "540 км",
    type: "desert",
  },
];

const TYPE_COLORS: Record<StationType, TypeColor> = {
  capital: { bg: "#7c2d12", border: "#f97316", glow: "rgba(249,115,22,0.4)" },
  river:   { bg: "#0c4a6e", border: "#38bdf8", glow: "rgba(56,189,248,0.4)" },
  mountain:{ bg: "#1c1917", border: "#a8a29e", glow: "rgba(168,162,158,0.4)" },
  desert:  { bg: "#451a03", border: "#d97706", glow: "rgba(217,119,6,0.4)" },
};

// ─── MapArea Props (your existing interface) ──────────────────────────────────

interface UrtuuMapProps {
  currentStationId?: string;
  doneStationIds?: string[];
}

// ─── AnimatedPath ─────────────────────────────────────────────────────────────

interface AnimatedPathProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  done: boolean;
  active: boolean;
}

function AnimatedPath({ x1, y1, x2, y2, done, active }: AnimatedPathProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame: number;
    let start: number | null = null;
    const duration = 1200 + Math.random() * 600;

    const animate = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setProgress(p);
      if (p < 1) frame = requestAnimationFrame(animate);
    };

    const timeout = setTimeout(() => {
      frame = requestAnimationFrame(animate);
    }, 300);

    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(frame);
    };
  }, []);

  const dx = x2 - x1;
  const dy = y2 - y1;
  const cx = (x1 + x2) / 2 - dy * 0.18;
  const cy = (y1 + y2) / 2 + dx * 0.18;
  const pathD = `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;

  return (
    <g>
      <path
        d={pathD}
        stroke="#3a3020"
        strokeWidth="2"
        fill="none"
        strokeDasharray="4 6"
        opacity="0.4"
      />
      {(done || active) && (
        <path
          d={pathD}
          stroke={done ? "#f59e0b" : "#86efac"}
          strokeWidth={active ? 2.5 : 1.5}
          fill="none"
          opacity={0.85 * progress}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 4px ${done ? "#f59e0b" : "#4ade80"})` }}
        />
      )}
      {active && (
        <path
          d={pathD}
          stroke="#ffffff"
          strokeWidth="1"
          fill="none"
          opacity={0.3 * progress}
          strokeDasharray="2 8"
          style={{ animation: "dash 2s linear infinite" }}
        />
      )}
    </g>
  );
}

// ─── StationNode ──────────────────────────────────────────────────────────────

interface StationNodeProps {
  station: Station;
  isSelected: boolean;
  isCurrent: boolean;
  isDone: boolean;
  onClick: (id: string) => void;
  index: number;
}

function StationNode({ station, isSelected, isCurrent, isDone, onClick, index }: StationNodeProps) {
  const [hovered, setHovered] = useState(false);
  const [visible, setVisible] = useState(false);
  const colors = TYPE_COLORS[station.type];

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), index * 180 + 200);
    return () => clearTimeout(t);
  }, [index]);

  const scale = isSelected ? 1.15 : hovered ? 1.08 : 1;
  const glow = isCurrent
    ? "0 0 0 3px #4ade80, 0 0 20px rgba(74,222,128,0.5)"
    : isDone
    ? "0 0 0 2px #f59e0b, 0 0 16px rgba(245,158,11,0.4)"
    : hovered
    ? `0 0 0 2px ${colors.border}, 0 0 14px ${colors.glow}`
    : "none";

  return (
    <div
      onClick={() => onClick(station.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "absolute",
        left: `${station.x}%`,
        top: `${station.y}%`,
        transform: `translate(-50%, -50%) scale(${scale})`,
        transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
        opacity: visible ? 1 : 0,
        cursor: "pointer",
        zIndex: isSelected ? 30 : hovered ? 20 : 10,
      }}
    >
      {isCurrent && (
        <div
          style={{
            position: "absolute", inset: -8, borderRadius: "50%",
            border: "2px solid rgba(74,222,128,0.5)",
            animation: "pulse 2s ease-in-out infinite",
          }}
        />
      )}

      <div
        style={{
          width: 54, height: 54, borderRadius: "50%",
          background: `radial-gradient(circle at 35% 35%, ${colors.border}33, ${colors.bg})`,
          border: `2px solid ${colors.border}`,
          boxShadow: glow !== "none" ? glow : `0 4px 16px ${colors.glow}`,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          position: "relative", overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute", inset: 0, borderRadius: "50%",
            background: "radial-gradient(circle at 30% 25%, rgba(255,255,255,0.12), transparent 60%)",
            pointerEvents: "none",
          }}
        />
        <span style={{ fontSize: 20, lineHeight: 1 }}>{station.icon}</span>
        {isDone && (
          <span style={{ fontSize: 9, color: "#fbbf24", marginTop: 1 }}>✓</span>
        )}
        {isCurrent && (
          <span style={{ fontSize: 8, color: "#4ade80", marginTop: 1, animation: "blink 1.2s step-end infinite" }}>◉</span>
        )}
      </div>

      <div
        style={{
          position: "absolute", top: "100%", left: "50%",
          transform: "translateX(-50%)", marginTop: 6,
          whiteSpace: "nowrap", textAlign: "center",
        }}
      >
        <div
          style={{
            background: "rgba(10,8,5,0.85)", backdropFilter: "blur(6px)",
            border: `1px solid ${colors.border}44`,
            borderRadius: 4, padding: "3px 8px",
            fontSize: 11, color: "#e7dfc8",
            fontFamily: "'Crimson Pro', 'Georgia', serif",
            letterSpacing: "0.5px",
          }}
        >
          {station.name}
        </div>
      </div>
    </div>
  );
}

// ─── DetailPanel ──────────────────────────────────────────────────────────────

interface DetailPanelProps {
  station: Station;
  onClose: () => void;
}

function DetailPanel({ station, onClose }: DetailPanelProps) {
  const colors = TYPE_COLORS[station.type];

  return (
    <div
      style={{
        position: "absolute", right: 20, top: "50%",
        transform: "translateY(-50%)",
        width: 220, zIndex: 50,
        background: "rgba(8,6,3,0.92)",
        backdropFilter: "blur(12px)",
        border: `1px solid ${colors.border}66`,
        borderRadius: 12,
        boxShadow: `0 8px 40px rgba(0,0,0,0.7), 0 0 0 1px ${colors.glow}`,
        padding: "20px 18px",
        animation: "slideIn 0.3s ease",
      }}
    >
      <button
        onClick={onClose}
        style={{
          position: "absolute", top: 10, right: 12,
          background: "none", border: "none", color: "#786b58",
          cursor: "pointer", fontSize: 16, lineHeight: 1,
        }}
      >
        ✕
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div
          style={{
            width: 40, height: 40, borderRadius: "50%",
            background: `radial-gradient(circle, ${colors.border}22, ${colors.bg})`,
            border: `1.5px solid ${colors.border}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18,
          }}
        >
          {station.icon}
        </div>
        <div>
          <div style={{ fontSize: 15, color: "#f0e8d8", fontFamily: "'Crimson Pro', Georgia, serif", fontWeight: 600 }}>
            {station.name}
          </div>
          <div style={{ fontSize: 10, color: colors.border, textTransform: "uppercase", letterSpacing: 1.5, marginTop: 1 }}>
            Уртуу буудал
          </div>
        </div>
      </div>

      <div
        style={{
          fontSize: 12, color: "#a09070", lineHeight: 1.6,
          fontFamily: "'Crimson Pro', Georgia, serif",
          marginBottom: 14, paddingBottom: 14,
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        {station.desc}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {[
          { label: "Зай",  value: station.distance, icon: "📏" },
          { label: "Морь", value: `${station.horses} толгой`, icon: "🐴" },
        ].map(({ label, value, icon }) => (
          <div
            key={label}
            style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              background: "rgba(255,255,255,0.04)", borderRadius: 6,
              padding: "6px 10px", fontSize: 11,
            }}
          >
            <span style={{ color: "#786b58" }}>{icon} {label}</span>
            <span style={{ color: "#d4c4a0", fontFamily: "Georgia, serif" }}>{value}</span>
          </div>
        ))}
      </div>

      <button
        style={{
          marginTop: 14, width: "100%",
          background: `linear-gradient(135deg, ${colors.bg}, ${colors.border}44)`,
          border: `1px solid ${colors.border}`,
          borderRadius: 8, padding: "8px 0",
          color: colors.border, fontSize: 12,
          fontFamily: "'Crimson Pro', Georgia, serif",
          cursor: "pointer", letterSpacing: 0.5,
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background =
            `linear-gradient(135deg, ${colors.border}33, ${colors.border}66)`;
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background =
            `linear-gradient(135deg, ${colors.bg}, ${colors.border}44)`;
        }}
      >
        ⚡ Буудалд хүрэх
      </button>
    </div>
  );
}

export default function UrtuuMap({
  currentStationId = "orkhon",
  doneStationIds = ["kharakhorum"],
}: UrtuuMapProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    setParticles(
      Array.from({ length: 30 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2.5 + 0.5,
        delay: Math.random() * 5,
        dur: Math.random() * 8 + 6,
      }))
    );
  }, []);

  const selectedStation = STATIONS.find((s) => s.id === selected) ?? null;

  const paths: PathData[] = [];
  for (let i = 0; i < STATIONS.length - 1; i++) {
    const a = STATIONS[i];
    const b = STATIONS[i + 1];
    paths.push({
      key: `${a.id}-${b.id}`,
      x1: a.x, y1: a.y,
      x2: b.x, y2: b.y,
      done: doneStationIds.includes(a.id) && (doneStationIds.includes(b.id) || b.id === currentStationId),
      active: a.id === currentStationId || b.id === currentStationId,
    });
  }

  const currentStation = STATIONS.find((s) => s.id === currentStationId);
  const doneCount = doneStationIds.length;
  const totalDistance = STATIONS[STATIONS.length - 1].distance;

  return (
    <div
      style={{
        width: "100%", height: "100vh",
        background: "radial-gradient(ellipse at 30% 20%, #1a1205 0%, #0d0a05 50%, #080604 100%)",
        position: "relative", overflow: "hidden",
        fontFamily: "'Crimson Pro', Georgia, serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,300;0,400;0,600;1,400&display=swap');
        @keyframes pulse   { 0%,100% { transform: scale(1);   opacity: 0.6 } 50% { transform: scale(1.3); opacity: 0.2 } }
        @keyframes blink   { 0%,100% { opacity: 1 } 50% { opacity: 0 } }
        @keyframes float   { 0%,100% { transform: translateY(0);    opacity: 0.3 } 50% { transform: translateY(-8px); opacity: 0.7 } }
        @keyframes dash    { to { stroke-dashoffset: -20 } }
        @keyframes slideIn { from { opacity: 0; transform: translateY(-50%) translateX(12px) } to { opacity: 1; transform: translateY(-50%) translateX(0) } }
        @keyframes shimmer { 0%,100% { opacity: 0.3 } 50% { opacity: 0.7 } }
      `}</style>

      {/* Background grid texture */}
      <div
        style={{
          position: "absolute", inset: 0,
          backgroundImage: `
            radial-gradient(ellipse 80% 50% at 50% 50%, rgba(120,90,30,0.06) 0%, transparent 70%),
            repeating-linear-gradient(0deg,  transparent, transparent 40px, rgba(255,255,255,0.01) 40px, rgba(255,255,255,0.01) 41px),
            repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(255,255,255,0.01) 40px, rgba(255,255,255,0.01) 41px)
          `,
          pointerEvents: "none",
        }}
      />

      {/* Floating dust particles */}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
        {particles.map((p) => (
          <circle
            key={p.id}
            cx={`${p.x}%`}
            cy={`${p.y}%`}
            r={p.size}
            fill="rgba(220,180,80,0.15)"
            style={{ animation: `float ${p.dur}s ease-in-out ${p.delay}s infinite` }}
          />
        ))}
      </svg>

      {/* Header */}
      <div
        style={{
          position: "absolute", top: 0, left: 0, right: 0,
          padding: "18px 24px",
          background: "linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)",
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
          zIndex: 40,
        }}
      >
        <div>
          <div style={{ fontSize: 22, color: "#d4b060", letterSpacing: 3, fontWeight: 300 }}>
            УРТУУ ЗАМЫН ГАЗРЫН ЗУРАГ
          </div>
          <div style={{ fontSize: 11, color: "#786b48", letterSpacing: 2, marginTop: 2 }}>
            Их Монгол Улсын Тэмдэглэгийн Систем · XIII зуун
          </div>
        </div>
        <div style={{ display: "flex", gap: 16, fontSize: 10, color: "#786b48", letterSpacing: 1.5, paddingTop: 4 }}>
          {([ 
            { color: "#f59e0b", label: "ДУУСГАСАН" },
            { color: "#4ade80", label: "ОДООГИЙН" },
            { color: "#a8a29e", label: "ХҮЛЭЭГДЭЖ БУЙ" },
          ] as const).map(({ color, label }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* SVG path layer */}
      <svg
        viewBox="0 0 100 80"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 5 }}
        preserveAspectRatio="none"
      >
        {paths.map((p) => (
          <AnimatedPath key={p.key} x1={p.x1} y1={p.y1} x2={p.x2} y2={p.y2} done={p.done} active={p.active} />
        ))}
      </svg>

      {/* Station nodes */}
      <div style={{ position: "absolute", inset: 0, zIndex: 10 }}>
        {STATIONS.map((station, i) => (
          <StationNode
            key={station.id}
            station={station}
            index={i}
            isSelected={selected === station.id}
            isCurrent={station.id === currentStationId}
            isDone={doneStationIds.includes(station.id)}
            onClick={(id) => setSelected(id === selected ? null : id)}
          />
        ))}
      </div>

      {/* Detail panel */}
      {selectedStation && (
        <DetailPanel station={selectedStation} onClose={() => setSelected(null)} />
      )}

      {/* Compass rose */}
      <div
        style={{
          position: "absolute", bottom: 24, left: 24,
          width: 60, height: 60, zIndex: 20,
          animation: "shimmer 4s ease-in-out infinite",
        }}
      >
        <svg width="60" height="60" viewBox="0 0 60 60">
          <circle cx="30" cy="30" r="28" fill="none" stroke="rgba(180,140,60,0.25)" strokeWidth="1" />
          <circle cx="30" cy="30" r="22" fill="none" stroke="rgba(180,140,60,0.15)" strokeWidth="0.5" strokeDasharray="2 4" />
          {([
            { d: "M30 6 L33 26 L30 30 L27 26 Z", fill: "#d4b060" },
            { d: "M30 54 L33 34 L30 30 L27 34 Z", fill: "#5a4a28" },
            { d: "M6 30 L26 27 L30 30 L26 33 Z", fill: "#5a4a28" },
            { d: "M54 30 L34 27 L30 30 L34 33 Z", fill: "#5a4a28" },
          ] as const).map((pt, i) => (
            <path key={i} d={pt.d} fill={pt.fill} />
          ))}
          <circle cx="30" cy="30" r="3.5" fill="#d4b060" />
          <circle cx="30" cy="30" r="1.5" fill="#0d0a05" />
          {(["Х", "З", "Ү", "Д"] as const).map((dir, i) => {
            const rad = ((i * 90 - 90) * Math.PI) / 180;
            const r = 15;
            return (
              <text
                key={dir}
                x={30 + r * Math.cos(rad)}
                y={30 + r * Math.sin(rad) + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={i === 0 ? "#d4b060" : "#786b48"}
                fontSize="5"
                fontFamily="Georgia, serif"
              >
                {dir}
              </text>
            );
          })}
        </svg>
      </div>

      {/* Scale bar */}
      <div
        style={{
          position: "absolute", bottom: 28, right: 250, zIndex: 20,
          display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
        }}
      >
        <div
          style={{
            width: 100, height: 6, borderRadius: 2,
            background: "linear-gradient(to right, #d4b060 50%, #3a3020 50%)",
            border: "1px solid rgba(180,140,60,0.4)",
          }}
        />
        <div style={{ fontSize: 9, color: "#786b48", letterSpacing: 1.5 }}>0 ——— 500 КМ</div>
      </div>

      {/* Bottom status bar */}
      <div
        style={{
          position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)",
          zIndex: 40, fontSize: 10, color: "#786b48",
          letterSpacing: 2, textTransform: "uppercase",
          background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)",
          border: "1px solid rgba(180,140,60,0.15)",
          borderRadius: 20, padding: "5px 16px",
          display: "flex", gap: 16, alignItems: "center",
          whiteSpace: "nowrap",
        }}
      >
        <span>
          📍 Одоогийн буудал:{" "}
          <span style={{ color: "#d4b060" }}>{currentStation?.name ?? "—"}</span>
        </span>
        <span style={{ opacity: 0.4 }}>|</span>
        <span>
          🐴 Нийт зам: <span style={{ color: "#d4b060" }}>{totalDistance}</span>
        </span>
        <span style={{ opacity: 0.4 }}>|</span>
        <span>
          ✓ Гүйцэтгэсэн:{" "}
          <span style={{ color: "#f59e0b" }}>
            {doneCount}/{STATIONS.length}
          </span>
        </span>
      </div>
    </div>
  );
}