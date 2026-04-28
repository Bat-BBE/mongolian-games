"use client";

import { HomboroiRulesForModal } from "./HomboroiRulesForModal";
import { FourBonesRulesForModal } from "./fourBonesRulesForModal";
import { HorseRaceRulesForModal } from "./horseRaceRulesForModal";
import { FourPowersHowItWorks } from "./fourPowersRulesUI";
import { getHowToLines, getHowToMapHint } from "./gameHowToContent";
import { ShagaiGuessRulesForModal } from "./shagaiGuessRulesForModal";
import { StoneGuessRulesForModal } from "./stoneGuessRulesForModal";
import {
  Berkh12RulesStrip,
  TwelveShagaiRulesStrip,
} from "./shagaiStationRulesUI";
import { GAME_RULES_OL_CLASS, GAME_TEXT_META } from "./gameUiTheme";

type FourVariant = "solo" | "online";

export type GameModalRulesBodyProps = {
  gameType: string;
  isMn: boolean;
  fourPowersVariant?: FourVariant;
};

export function GameModalRulesBody({
  gameType,
  isMn,
  fourPowersVariant = "solo",
}: GameModalRulesBodyProps) {
  const lines = getHowToLines(gameType, isMn);
  const mapHint = getHowToMapHint(gameType, isMn);
  const lang = isMn ? "mn" : "en";
  const isEn = !isMn;

  if (gameType === "shagai") {
    return (
      <div className="space-y-4">
        <HomboroiRulesForModal isMn={isMn} />
        {mapHint ? (
          <p className={`border-t border-white/10 pt-3 ${GAME_TEXT_META}`}>
            {mapHint}
          </p>
        ) : null}
      </div>
    );
  }

  if (gameType === "four-powers") {
    return (
      <div className="space-y-4">
        <FourPowersHowItWorks lang={lang} variant={fourPowersVariant} />
        {mapHint ? (
          <p className={`border-t border-white/10 pt-3 ${GAME_TEXT_META}`}>
            {mapHint}
          </p>
        ) : null}
      </div>
    );
  }

  if (gameType === "four-bones") {
    return (
      <div className="space-y-4">
        <FourBonesRulesForModal isMn={isMn} />
        {mapHint ? (
          <p className={`border-t border-white/10 pt-3 ${GAME_TEXT_META}`}>
            {mapHint}
          </p>
        ) : null}
      </div>
    );
  }

  if (gameType === "horse-race") {
    return (
      <div className="space-y-4">
        <HorseRaceRulesForModal isMn={isMn} />
        {mapHint ? (
          <p className={`border-t border-white/10 pt-3 ${GAME_TEXT_META}`}>
            {mapHint}
          </p>
        ) : null}
      </div>
    );
  }

  if (gameType === "stone-guess") {
    return (
      <div className="space-y-4">
        <StoneGuessRulesForModal isMn={isMn} />
        {mapHint ? (
          <p className={`border-t border-white/10 pt-3 ${GAME_TEXT_META}`}>
            {mapHint}
          </p>
        ) : null}
      </div>
    );
  }

  if (gameType === "shagai-guess") {
    return (
      <div className="space-y-4">
        <ShagaiGuessRulesForModal isMn={isMn} />
        {mapHint ? (
          <p className={`border-t border-white/10 pt-3 ${GAME_TEXT_META}`}>
            {mapHint}
          </p>
        ) : null}
      </div>
    );
  }

  if (gameType === "twelve-shagai") {
    return (
      <div className="space-y-4">
        <TwelveShagaiRulesStrip isEn={isEn} />
        <ol className={GAME_RULES_OL_CLASS}>
          {lines.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ol>
        {mapHint ? (
          <p className={`border-t border-white/10 pt-3 ${GAME_TEXT_META}`}>
            {mapHint}
          </p>
        ) : null}
      </div>
    );
  }

  if (gameType === "berkh-12-shagai") {
    return (
      <div className="space-y-4">
        <Berkh12RulesStrip isEn={isEn} />
        <ol className={GAME_RULES_OL_CLASS}>
          {lines.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ol>
        {mapHint ? (
          <p className={`border-t border-white/10 pt-3 ${GAME_TEXT_META}`}>
            {mapHint}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <ol className={GAME_RULES_OL_CLASS}>
        {lines.map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ol>
      {mapHint ? (
        <p className={`border-t border-white/10 pt-3 ${GAME_TEXT_META}`}>
          {mapHint}
        </p>
      ) : null}
    </div>
  );
}
