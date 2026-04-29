"use client";

import type { InventoryRewardEvent } from "./useInventoryGrant";

type Props = {
  rewardEvents: InventoryRewardEvent[];
  sessionGain: { coins: number; gems: number };
};

export default function InventoryRewardOverlay({
  rewardEvents,
  sessionGain,
}: Props) {
  const showSession = sessionGain.coins > 0 || sessionGain.gems > 0;

  return (
    <>
      <style>{`
        @keyframes inv-reward-float {
          0%   { opacity: 0; transform: translateY(10px) scale(0.98); }
          15%  { opacity: 1; transform: translateY(0px)  scale(1); }
          70%  { opacity: 1; transform: translateY(-18px) scale(1.02); }
          100% { opacity: 0; transform: translateY(-32px) scale(1.03); }
        }
      `}</style>
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 20,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 18,
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          {rewardEvents.map((e) => (
            <div
              key={e.id}
              style={{
                marginBottom: 8,
                display: "flex",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  padding: "8px 12px",
                  borderRadius: 999,
                  border:
                    e.kind === "coins"
                      ? "1px solid rgba(240,192,64,0.55)"
                      : "1px solid rgba(96,192,255,0.55)",
                  background:
                    e.kind === "coins"
                      ? "linear-gradient(135deg, rgba(200,160,48,0.26), rgba(240,192,64,0.12))"
                      : "linear-gradient(135deg, rgba(96,192,255,0.22), rgba(180,220,255,0.10))",
                  color: e.kind === "coins" ? "#f0c040" : "#bfe6ff",
                  fontSize: 13,
                  fontWeight: 900,
                  letterSpacing: 1.2,
                  fontFamily:
                    "var(--font-inter), -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
                  boxShadow:
                    e.kind === "coins"
                      ? "0 10px 40px rgba(200,160,48,0.18)"
                      : "0 10px 40px rgba(96,192,255,0.14)",
                  animation: "inv-reward-float 1.25s ease forwards",
                }}
              >
                {e.text}
              </div>
            </div>
          ))}
        </div>

        {showSession ? (
          <div
            style={{
              position: "absolute",
              top: 18,
              right: 18,
              padding: "10px 12px",
              borderRadius: 14,
              background: "rgba(6,4,2,0.78)",
              border: "1px solid rgba(200,160,48,0.22)",
              backdropFilter: "blur(14px)",
              boxShadow: "0 10px 40px rgba(0,0,0,0.55)",
              color: "white",
              fontFamily:
                "var(--font-inter), -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 10,
                fontSize: 12,
                color: "#ddd",
              }}
            >
              <span style={{ color: "#f0c040", fontWeight: "bold" }}>
                🪙 +{sessionGain.coins}
              </span>
              <span style={{ color: "#bfe6ff", fontWeight: "bold" }}>
                💎 +{sessionGain.gems}
              </span>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
