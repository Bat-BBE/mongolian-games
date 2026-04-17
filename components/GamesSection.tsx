"use client";

import { LuDices as Dices, LuTarget as Target, LuZap as Zap, LuTrophy as Trophy, LuSwords as Swords, LuGamepad2 as Gamepad2, LuPlay as Play, LuLock as Lock } from "react-icons/lu";
import { useApp } from "./AppContext";
import { useEffect, useState } from "react";
import GameModal from "@/components/game/gameModal";
import { getApiBaseUrl, getGames, type GameRow } from "@/lib/api";

const ICONS = [Dices, Target, Zap, Trophy, Swords, Gamepad2];

const btnActive =
  "w-full py-2 px-4 rounded-lg flex items-center justify-center gap-2 bg-gradient-to-r from-gold to-amber-600 text-[oklch(0.14_0.03_55)] font-medium text-sm hover:scale-105 active:scale-95 transition-transform";
const btnLocked =
  "w-full py-2 px-4 rounded-lg flex items-center justify-center gap-2 bg-black/15 dark:bg-white/5 border border-white/12 text-muted-foreground text-sm select-none";

export default function GamesSection() {
  const { t, language } = useApp();
  const [games, setGames] = useState<GameRow[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const loadingList = games === null && !loadError;
  const [selectedGame, setSelectedGame] = useState<{ type: string; name: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const { games: rows } = await getGames();
        if (!cancelled) {
          setGames(rows);
          setLoadError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setGames(null);
          setLoadError(e instanceof Error ? e.message : "Failed to load games");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handlePlayClick = (game: GameRow) => {
    if (game.is_available) {
      const name = language === "mn" ? game.name_mn : game.name_en;
      setSelectedGame({ type: game.slug, name });
    }
  };

  const list = games ?? [];
  const visible = list.filter((g) => g.show_on_home !== false);

  return (
    <>
      <section className="relative py-24 px-6 lg:px-10 overflow-hidden bg-background" id="games">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none"
          style={{
            width: 900,
            height: 500,
            background:
              "radial-gradient(ellipse, color-mix(in oklch, var(--primary) 16%, transparent) 0%, color-mix(in oklch, var(--gold-bright) 12%, transparent) 35%, transparent 72%)",
          }}
        />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-10 animate-fade-up">
            <p
              className="font-display text-[0.62rem] tracking-[0.45em] uppercase mb-3 opacity-55"
              style={{ color: "var(--gold-bright)" }}
            >
              ❖ &nbsp; Gameplay &nbsp; ❖
            </p>
            <h2
              className="font-display font-bold uppercase tracking-widest text-gold text-gold-glow"
              style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)" }}
            >
              {t.games.heading}
            </h2>
            {t.games.intro && (
              <p className="text-muted-foreground font-body text-sm leading-relaxed mt-2">{t.games.intro}</p>
            )}
            <div className="divider-gold-solid w-48 mx-auto mt-4" />
          </div>

          {loadingList && (
            <p className="text-center text-sm text-muted-foreground mb-6">
              {language === "mn" ? "Тоглоомын жагсаалт ачаалж байна…" : "Loading games…"}
            </p>
          )}

          {loadError && (
            <p className="text-center text-sm text-destructive mb-6 max-w-xl mx-auto">
              {language === "mn" ? "Тоглоомын жагсаалт ачаалагдсангүй: " : "Could not load games: "}
              {loadError}
            </p>
          )}

          <div className="grid sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
            {visible.map((game, i) => {
              const Icon = ICONS[i % ICONS.length];
              const title = language === "mn" ? game.name_mn : game.name_en;
              const desc = language === "mn" ? game.description_mn : game.description_en;
              const isAvailable = game.is_available;
              const imageSrc =
                game.image_url && game.image_url.trim()
                  ? game.image_url.startsWith("http")
                    ? game.image_url
                    : `${getApiBaseUrl()}${game.image_url}`
                  : null;
              const articleClass = `glass-card group relative rounded-[1.75rem] overflow-hidden transition-all duration-500 ${
                isAvailable ? "hover:-translate-y-2 cursor-pointer" : "opacity-60"
              }`;

              return (
                <article key={game.id} className={articleClass}>
                  {isAvailable && (
                    <>
                      <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                        style={{
                          background:
                            "radial-gradient(ellipse 90% 55% at 50% 0%, color-mix(in oklch, var(--primary) 12%, transparent), transparent)",
                        }}
                      />
                      <div
                        className="absolute top-0 left-8 right-8 h-px opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{
                          background: "linear-gradient(90deg, transparent, var(--gold-bright), transparent)",
                        }}
                      />
                    </>
                  )}

                  <div className="p-5 relative z-10 flex flex-col h-full">
                    <div className="flex justify-between items-start mb-4">
                      <span
                        className="font-display font-black text-xs tracking-[0.35em]"
                        style={{ color: "var(--gold-bright)" }}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/10 bg-black/10 flex items-center justify-center">
                        {imageSrc ? (
                          // Using <img> intentionally (remote API/static); keeps Next config simple.
                          <img
                            alt=""
                            src={imageSrc}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="icon-vessel w-12 h-12 rounded-xl flex items-center justify-center">
                            <Icon
                              className="text-primary transition-colors duration-300"
                              strokeWidth={1.6}
                              style={{ width: "1.4rem", height: "1.4rem" }}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <h3 className="font-display font-semibold text-lg mb-2 leading-snug text-foreground group-hover:text-primary transition-colors">
                      {title}
                    </h3>
                    <p className="font-body text-sm leading-relaxed text-muted-foreground mb-5 flex-1">{desc}</p>

                    {isAvailable ? (
                      <button type="button" onClick={() => handlePlayClick(game)} className={btnActive}>
                        <Play size={14} />
                        {t.games.play}
                      </button>
                    ) : (
                      <div className={btnLocked}>
                        <Lock size={13} />
                        {t.games.lock}
                      </div>
                    )}
                  </div>

                  {isAvailable && (
                    <div
                      className="absolute bottom-0 left-8 right-8 h-px opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{
                        background:
                          "linear-gradient(90deg, transparent, color-mix(in oklch, var(--primary) 50%, transparent), transparent)",
                      }}
                    />
                  )}
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {selectedGame && (
        <GameModal
          isOpen={!!selectedGame}
          onClose={() => setSelectedGame(null)}
          gameType={selectedGame.type}
          gameName={selectedGame.name}
          stationSlug="freeplay"
          gameSlug={selectedGame.type}
        />
      )}
    </>
  );
}
