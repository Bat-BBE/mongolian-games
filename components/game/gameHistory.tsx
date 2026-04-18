"use client";

import { SHAgAI_SIDES, ShagaiSide } from "./shagai";
import { useState } from "react";

export interface ThrowRecord {
  side: ShagaiSide;
  timestamp: Date;
  throwNumber: number;
}

interface GameHistoryProps {
  history: ThrowRecord[];
}

const SIDE_ORDER: ShagaiSide[] = ["horse", "sheep", "goat", "camel"];

export default function GameHistory({ history }: GameHistoryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const total = history.length;

  if (total === 0) return null;

  const recentFive = [...history].reverse().slice(0, 5);

  return (
    <div
      style={{
        position: "absolute",
        bottom: 20,
        left: "50%",
        transform: "translateX(-50%)",
        width: isExpanded ? 560 : 380,
        background: "rgba(8,6,3,0.88)",
        border: "1px solid rgba(200,160,48,0.25)",
        borderRadius: 16,
        padding: "14px 18px",
        backdropFilter: "blur(14px)",
        boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
        fontFamily: "var(--font-inter), -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
        color: "white",
        zIndex: 10,
        transition: "width 0.35s ease",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <div style={{ color: "#c8a030", fontSize: 12, letterSpacing: 3 }}>
          📜 ТҮҮХ <span style={{ opacity: 0.6 }}>({total} шидэлт)</span>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            background: "rgba(200,160,48,0.1)",
            border: "1px solid rgba(200,160,48,0.25)",
            color: "#c8a030",
            borderRadius: 8,
            padding: "3px 12px",
            fontSize: 11,
            cursor: "pointer",
            fontFamily: "var(--font-inter), -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
            letterSpacing: 1,
          }}
        >
          {isExpanded ? "Хураах ▲" : "Дэлгэрэнгүй ▼"}
        </button>
      </div>

      <div
        style={{
          display: "flex",
          gap: 6,
          marginBottom: isExpanded ? 14 : 0,
          flexWrap: "wrap",
        }}
      >
        {recentFive.map((rec, i) => {
          const info = SHAgAI_SIDES[rec.side];
          return (
            <div
              key={i}
              title={`${rec.throwNumber}. ${info.name}`}
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: "rgba(200,160,48,0.1)",
                border: "1px solid rgba(200,160,48,0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
              }}
            >
              {info.symbol}
            </div>
          );
        })}
        {total > 5 && (
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: "rgba(255,255,255,0.05)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#666",
              fontSize: 11,
            }}
          >
            +{total - 5}
          </div>
        )}
      </div>

      {isExpanded && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 10,
          }}
        >
          {SIDE_ORDER.map((side) => {
            const info = SHAgAI_SIDES[side];
            const count = history.filter((h) => h.side === side).length;
            const pct = total > 0 ? (count / total) * 100 : 0;
            return (
              <div
                key={side}
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(200,160,48,0.2)",
                  borderRadius: 10,
                  padding: "10px 8px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 26, marginBottom: 4 }}>
                  {info.symbol}
                </div>
                <div
                  style={{ color: "#c8a030", fontSize: 12, letterSpacing: 1 }}
                >
                  {info.name}
                </div>
                <div
                  style={{
                    color: "white",
                    fontSize: 22,
                    fontWeight: "bold",
                    margin: "4px 0",
                  }}
                >
                  {count}
                </div>
                <div style={{ color: "#666", fontSize: 11 }}>
                  {pct.toFixed(1)}%
                </div>
                <div
                  style={{
                    height: 3,
                    background: "rgba(255,255,255,0.06)",
                    borderRadius: 2,
                    marginTop: 6,
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${pct}%`,
                      background: "#c8a030",
                      borderRadius: 2,
                      transition: "width .5s",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
