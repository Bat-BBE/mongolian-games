"use client";

import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useApp } from "@/components/AppContext";
import { HEROES, loadPlayer, savePlayer } from "./hero-data";
import { HERO_STRINGS } from "./hero-strings";
import type { HeroId, Lang } from "./hero-strings";
import { StarField } from "./StarField";
import { HeroToast } from "./HeroToast";
import { NameEntryScreen } from "./NameEntryScreen";
import { HeroChooseScreen } from "./HeroChooseScreen";
import {getUserByEmail, registerEmail} from "@/lib/firebase-auth";

export default function HeroSelectPage() {
  const router = useRouter();
  const { language, heroSelectOpen, setHeroSelectOpen } = useApp();
  const lang = language as Lang;
  const t = HERO_STRINGS[lang];

  const [mounted, setMounted]       = useState(false);
  const [screen, setScreen]         = useState<"email" | "hero">("email");
  const [email, setEmail]           = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [selectedId, setSelectedId] = useState<HeroId>("shikhikhutag");
  const [toast, setToast]           = useState({ msg: "", visible: false });

  const selectedHero = HEROES.find((h) => h.id === selectedId)!;
  const activeColor  = screen === "hero" ? selectedHero.color : "#b38600";

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    document.body.style.overflow = heroSelectOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [heroSelectOpen]);

  // useEffect(() => {
  //   const saved = loadPlayer();
  //   if (saved) {
  //     setHeroSelectOpen(false);
  //     router.push("/home");
  //   } else {
  //     setHeroSelectOpen(true);
  //     setScreen("email");
  //   }
  // }, [router, setHeroSelectOpen]);

  useEffect(() => {
    if (!heroSelectOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setHeroSelectOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [heroSelectOpen, setHeroSelectOpen]);

  const showToast = (msg: string) => {
    setToast({ msg, visible: true });
    setTimeout(() => setToast((p) => ({ ...p, visible: false })), 2800);
  };

  const handleEnter = useCallback(async () => {
    const trimmed = email.trim();
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
    if (!valid) {
      showToast(
        lang === "mn"
          ? "И-мэйл хаягаа зөв оруулна уу"
          : "Please enter a valid email"
      );
      return;
    }
    setIsChecking(true);
    const user = await getUserByEmail(trimmed);
    setIsChecking(false);
    if (user) {
      savePlayer({
        name: trimmed,
        heroId: user.profile.heroId,
      });
      setHeroSelectOpen(false);
      router.push("/home");
      return;
    }
    setScreen("hero");
  }, [email, lang, router, setHeroSelectOpen]);

  const handlePlay = useCallback(async () => {
    if (!selectedHero.available) return;

    await registerEmail(email.trim(), selectedId);
    savePlayer({ name: email.trim(), heroId: selectedId });

    setHeroSelectOpen(false);
    router.push("/home");
  }, [email, selectedHero, selectedId, setHeroSelectOpen, router]);

  if (!mounted || !heroSelectOpen) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
        <div
          className="absolute inset-0 backdrop-blur"
          onClick={() => setHeroSelectOpen(false)}
        />

        <StarField color={activeColor} />

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none transition-all duration-700">
          <div
            className="w-[700px] h-[700px] rounded-full blur-[140px] transition-all duration-700"
            style={{ background: `radial-gradient(ellipse, ${activeColor}16 0%, transparent 70%)` }}
          />
        </div>

        <div
          className="relative w-full max-w-3xl rounded-[2rem] overflow-hidden overflow-y-auto max-h-[100vh]"
          style={{
            zIndex: 10,
            background: "var(--background)",
            backdropFilter: "blur(70px)",
            WebkitBackdropFilter: "blur(30px)",
            border: `1px solid ${activeColor}60`,
            boxShadow: `0 0 100px ${activeColor}20, 0 0 0 1px ${activeColor}10, inset 0 1px 0 ${activeColor}20`,
            transition: "border-color 0.5s, box-shadow 0.5s",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setHeroSelectOpen(false)}
            className="absolute top-4 right-4 z-20 p-1.5 rounded-full transition-all duration-200"
            style={{
              background: "var(--glass-border",
              border: "1px solid var(--popever)",
            }}
            onMouseEnter={(e) => {
              // (e.currentTarget as HTMLElement).style.color = "var(--secondary)";
              (e.currentTarget as HTMLElement).style.background = "var(--muted-foreground)";
            }}
            onMouseLeave={(e) => {
              // (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.35)";
              (e.currentTarget as HTMLElement).style.background = "var(--primary)";
            }}
          >
            <X className="w-4 h-4 text-foreground" />
          </button>

          {screen === "email" ? (
            <NameEntryScreen
              t={t}
              playerName={email}
              setPlayerName={setEmail}
              // email={email}
              // setEmail={setEmail}
              isChecking={isChecking}
              onEnter={handleEnter}
            />
          ) : (
            <HeroChooseScreen
              t={t}
              lang={lang}
              playerName={email}
              selectedId={selectedId}
              setSelectedId={setSelectedId}
              onPlay={handlePlay}
            />
          )}
        </div>
      </div>

      <HeroToast msg={toast.msg} visible={toast.visible} />
    </>,
    document.body,
  );
}