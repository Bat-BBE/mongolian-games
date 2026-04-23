"use client";

import { useEffect, useState, useCallback } from "react";
import { LuX as X } from "react-icons/lu";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useApp } from "@/components/AppContext";
import { HEROES, loadPlayer, savePlayer, type Hero } from "@/components/hero-select/hero-data";
import { mergeHeroesFromApi } from "@/components/hero-select/map-from-api";
import { getContentHeroes } from "@/lib/api";
import { HERO_STRINGS } from "@/components/hero-select/hero-strings";
import type { HeroId, Lang } from "@/components/hero-select/hero-strings";
import { StarField } from "@/components/hero-select/StarField";
import { HeroToast } from "@/components/hero-select/HeroToast";
import { NameEntryScreen } from "@/components/hero-select/NameEntryScreen";
import { HeroChooseScreen } from "@/components/hero-select/HeroChooseScreen";

export default function HeroSelectPage() {
  const { language, heroSelectOpen, setHeroSelectOpen } = useApp();
  const lang = language as Lang;
  const t = HERO_STRINGS[lang];

  const [screen, setScreen]         = useState<"name" | "hero">("name");
  const [playerName, setPlayerName] = useState("");
  const [selectedId, setSelectedId] = useState<HeroId>("shikhikhutag");
  const [toast, setToast]           = useState({ msg: "", visible: false });
  const [heroes, setHeroes]         = useState<Hero[]>(HEROES);

  const roster =
    Array.isArray(heroes) && heroes.length > 0 ? heroes : HEROES;
  const selectedHero =
    roster.find((h) => h.id === selectedId) ?? roster[0]!;
  const activeColor  = screen === "hero" ? selectedHero.color : "#C8A84B";

  useEffect(() => {
    const saved = loadPlayer();
    if (saved) {
      setPlayerName(saved.name);
      setSelectedId(saved.heroId);
      setScreen("hero");
    }
  }, []);

  useEffect(() => {
    if (screen !== "hero") return;
    let cancelled = false;
    void (async () => {
      try {
        const { heroes: rows } = await getContentHeroes();
        if (cancelled) return;
        setHeroes(mergeHeroesFromApi(Array.isArray(rows) ? rows : []));
      } catch {
        if (!cancelled) setHeroes(HEROES);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [screen]);

  const save = useCallback((name: string, heroId: HeroId) => {
    savePlayer({ name, heroId });
  }, []);

  const showToast = (msg: string) => {
    setToast({ msg, visible: true });
    setTimeout(() => setToast((p) => ({ ...p, visible: false })), 2800);
  };

  /* ── Handlers ── */
  const handleEnter = () => {
    const v = playerName.trim();
    if (!v) return;
    save(v, selectedId);
    setScreen("hero");
  };

  const handlePlay = () => {
    if (!selectedHero.available) return;
    save(playerName, selectedId);
    showToast(
      t.toast(
        playerName,
        lang === "mn" ? selectedHero.nameMn : selectedHero.nameEn,
      ),
    );
    // navigate to game: router.push('/game')
  };

  const handleGuest = () => {
    const name = lang === "mn" ? "Зочин" : "Guest";
    showToast(
      t.toast(name, lang === "mn" ? selectedHero.nameMn : selectedHero.nameEn),
    );
  };

  return (
    <>
      <Dialog open={heroSelectOpen} onOpenChange={setHeroSelectOpen}>
        <DialogContent
          className="p-0 border-0 bg-transparent shadow-none max-w-lg w-full overflow-visible"
          style={{ background: "transparent" }}
        >
          {/* Accessibility title (visually hidden) */}
          <DialogTitle className="sr-only">
            {screen === "name" ? t.gameTitle1 : t.chooseHero}
          </DialogTitle>

          {/* ── Full-screen backdrop + starfield ── */}
          <div className="fixed inset-0 z-[199] pointer-events-none">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <StarField color={activeColor} />
            {/* Hero-colored radial glow */}
            <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 1 }}>
              <div
                className="w-[600px] h-[600px] rounded-full blur-[130px] transition-all duration-700"
                style={{ background: `radial-gradient(ellipse, ${activeColor}14 0%, transparent 70%)` }}
              />
            </div>
          </div>

          {/* ── Glass panel ── */}
          <div
            className="relative z-[200] w-full rounded-[2rem] overflow-hidden"
            style={{
              background: "linear-gradient(145deg, rgba(20,16,4,0.92) 0%, rgba(6,4,1,0.97) 100%)",
              backdropFilter: "blur(30px)",
              WebkitBackdropFilter: "blur(30px)",
              border: `1px solid ${activeColor}30`,
              boxShadow: `0 0 60px ${activeColor}18, inset 0 1px 0 ${activeColor}18`,
              transition: "border-color 0.5s, box-shadow 0.5s",
            }}
          >
            {/* Close button */}
            <button
              onClick={() => setHeroSelectOpen(false)}
              className="absolute top-4 right-4 z-10 p-1 rounded-full transition-colors duration-200"
              style={{ color: "rgba(255,255,255,0.3)" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.8)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.3)")}
            >
              <X className="w-4 h-4" />
            </button>

            {/* Active screen */}
            {screen === "name" ? (
              <NameEntryScreen
                t={t}
                playerName={playerName}
                setPlayerName={setPlayerName}
                onEnter={handleEnter}
              />
            ) : (
              <HeroChooseScreen
                t={t}
                lang={lang}
                heroes={roster}
                playerName={playerName}
                selectedId={selectedId}
                setSelectedId={setSelectedId}
                onPlay={handlePlay}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <HeroToast msg={toast.msg} visible={toast.visible} />
    </>
  );
}