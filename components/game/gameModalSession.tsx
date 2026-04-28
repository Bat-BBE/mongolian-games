"use client";

import {
  createContext,
  useContext,
  type ReactNode,
} from "react";
import { getMatchLobbyIntroText, type LobbyIntroLang } from "./onlineRoomLobbyCopy";

export type GameModalSessionValue = {
  stationSlug: string;
  appUserInPostgres: boolean;
  authConfigured: boolean;
};

const GameModalSessionContext = createContext<GameModalSessionValue | null>(
  null,
);

export function GameModalSessionProvider({
  value,
  children,
}: {
  value: GameModalSessionValue;
  children: ReactNode;
}) {
  return (
    <GameModalSessionContext.Provider value={value}>
      {children}
    </GameModalSessionContext.Provider>
  );
}

export function useGameModalSession(): GameModalSessionValue | null {
  return useContext(GameModalSessionContext);
}

/** Match-лобби тайлбар — зөвхөн `GameModal` доторх тоглоомуудаас дуудна. */
export function useMatchLobbyIntro(lang: LobbyIntroLang): string {
  const v = useContext(GameModalSessionContext);
  if (!v) {
    return "";
  }
  return getMatchLobbyIntroText({
    stationSlug: v.stationSlug,
    appUserInPostgres: v.appUserInPostgres,
    authConfigured: v.authConfigured,
    lang,
  });
}
