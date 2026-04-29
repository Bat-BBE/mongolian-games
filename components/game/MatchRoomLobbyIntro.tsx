"use client";

import { useApp } from "@/components/AppContext";
import { useMatchLobbyIntro } from "./gameModalSession";
import { GAME_LOBBY_INTRO_CLASS, GAME_UI_FONT_FAMILY } from "./gameUiTheme";

export function MatchRoomLobbyIntro() {
  const { language } = useApp();
  const text = useMatchLobbyIntro(language === "en" ? "en" : "mn");
  if (!text.trim()) return null;

  return (
    <p
      className={`max-w-md text-balance px-3 text-center ${GAME_LOBBY_INTRO_CLASS}`}
      style={{ fontFamily: GAME_UI_FONT_FAMILY }}
    >
      {text}
    </p>
  );
}
