"use client";

import { useCallback, useState } from "react";
import { useAuth } from "@/components/AuthContext";
import { getGameProfileByEmail, syncAppUserSimple } from "@/lib/api";

export type InventoryRewardEvent = {
  id: string;
  text: string;
  kind: "coins" | "gems";
};

export function useInventoryGrant() {
  const { user } = useAuth();
  const [rewardEvents, setRewardEvents] = useState<InventoryRewardEvent[]>(
    [],
  );
  const [sessionGain, setSessionGain] = useState({ coins: 0, gems: 0 });

  const resetGrants = useCallback(() => {
    setRewardEvents([]);
    setSessionGain({ coins: 0, gems: 0 });
  }, []);

  const grant = useCallback(
    (delta: { coins?: number; gems?: number }) => {
      const email = user?.email?.trim();
      if (!email) return;

      const dCoins = delta.coins ?? 0;
      const dGems = delta.gems ?? 0;
      if (!dCoins && !dGems) return;
      setSessionGain((p) => ({
        coins: p.coins + dCoins,
        gems: p.gems + dGems,
      }));
      const now = Date.now();
      const add = (kind: "coins" | "gems", text: string) => {
        const id = `${kind}_${now}_${Math.random().toString(16).slice(2)}`;
        setRewardEvents((prev) => [...prev, { id, kind, text }]);
        setTimeout(() => {
          setRewardEvents((prev) => prev.filter((e) => e.id !== id));
        }, 1350);
      };
      if (dCoins) add("coins", `+${dCoins} 🪙`);
      if (dGems) add("gems", `+${dGems} 💎`);

      void (async () => {
        try {
          const profileRes = await getGameProfileByEmail(email);
          const current =
            profileRes?.user?.profile &&
            typeof profileRes.user.profile === "object"
              ? (profileRes.user.profile as Record<string, unknown>)
              : {};
          const invRaw = (current as { inventory?: unknown }).inventory;
          const inv =
            invRaw && typeof invRaw === "object"
              ? (invRaw as Record<string, unknown>)
              : {};
          const coins =
            typeof inv.coins === "number" ? inv.coins : Number(inv.coins ?? 0);
          const gems =
            typeof inv.gems === "number" ? inv.gems : Number(inv.gems ?? 0);
          const nextProfile = {
            ...current,
            inventory: {
              ...inv,
              coins: (Number.isFinite(coins) ? coins : 0) + dCoins,
              gems: (Number.isFinite(gems) ? gems : 0) + dGems,
            },
          } as Record<string, unknown>;

          await syncAppUserSimple({ email, profile: nextProfile });
        } catch {
        }
      })();
    },
    [user?.email],
  );

  return { grant, rewardEvents, sessionGain, resetGrants };
}
