"use client";

import { ModeToggle } from "./ui/mode-toggle";
import Link from "next/link";
import { useApp } from "./AppContext";
import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type CSSProperties,
  type MouseEvent,
} from "react";

export default function Header() {
  const { t, language, setLanguage } = useApp();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeLink, setActiveLink] = useState("#");
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  const navRef = useRef<HTMLElement>(null);
  const linkRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  const navLinks = [
    { name: language === "mn" ? "Нүүр" : "Home", href: "#", icon: "⌂" },
    { name: t.nav.whatIs, href: "#what-is", icon: "❖" },
    { name: t.nav.howItWorks, href: "#how-it-works", icon: "◎" },
    { name: t.nav.features, href: "#features", icon: "✦" },
    { name: t.nav.games, href: "#games", icon: "⚔" },
  ];

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 28);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setIsMobileMenuOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  const detectActive = useCallback(() => {
    const hrefs = ["#", "#what-is", "#games", "#how-it-works", "#features"];
    let current = "#";
    for (const href of hrefs) {
      if (href === "#") {
        if (window.scrollY < 100) {
          current = "#";
          break;
        }
        continue;
      }
      const el = document.querySelector<HTMLElement>(href);
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.top <= window.innerHeight / 2 && rect.bottom >= 0) {
          current = href;
        }
      }
    }
    
    setActiveLink(current);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", detectActive, { passive: true });
    detectActive();
    return () => window.removeEventListener("scroll", detectActive);
  }, [detectActive]);

  const handleLinkHover = (i: number) => {
    const el = linkRefs.current[i];
    const nav = navRef.current;
    if (!el || !nav) return;
    const nr = nav.getBoundingClientRect();
    const er = el.getBoundingClientRect();
    setIndicatorStyle({ left: er.left - nr.left, width: er.width });
  };

  const handleNavClick = (e: MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setActiveLink(href);
    setIsMobileMenuOpen(false);
    
    if (href === "#") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const goldTextStyle: CSSProperties = {
    background: "var(--grad-gold)",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundSize: "200% 200%",
    animation: "gold-shimmer 5s ease infinite",
  };

  const langBtnStyle = (active: boolean): CSSProperties =>
    active
      ? {
          background: "var(--grad-gold)",
          backgroundSize: "200% 200%",
          animation: "gold-shimmer 5s ease infinite",
          color: "oklch(0.108 0.018 52)",
          boxShadow:
            "0 3px 12px color-mix(in oklch, var(--primary) 36%, transparent)",
          padding: "clamp(4px,0.6vw,6px) clamp(8px,1vw,12px)",
          fontSize: "clamp(0.6rem,0.8vw,0.7rem)",
          letterSpacing: "clamp(0.05em,0.2vw,0.1em)",
          borderRadius: "999px",
          fontWeight: 700,
          border: "none",
          cursor: "pointer",
          transition: "all 0.3s ease",
        }
      : {
          background: "transparent",
          color: "color-mix(in oklch, var(--primary) 65%, transparent)",
          padding: "clamp(4px,0.6vw,6px) clamp(8px,1vw,12px)",
          fontSize: "clamp(0.65rem,0.8vw,0.8rem)",
          letterSpacing: "clamp(0.05em,0.2vw,0.1em)",
          borderRadius: "999px",
          fontWeight: 700,
          border: "none",
          cursor: "pointer",
          transition: "all 0.3s ease",
        };

  const LangToggle = () => (
    <div
      className="flex items-center gap-0.5 rounded-full p-0.5"
      style={{
        background: "color-mix(in oklch, var(--background) 35%, transparent)",
        border: "1px solid color-mix(in oklch, var(--primary) 20%, var(--border))",
        backdropFilter: "blur(8px)",
      }}
    >
      {(["mn", "en"] as const).map((lng) => (
        <button
          key={lng}
          onClick={() => setLanguage(lng)}
          aria-pressed={language === lng}
          style={langBtnStyle(language === lng)}
          className="font-display transition-all duration-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          {lng === "mn" ? "МН" : "EN"}
        </button>
      ))}
    </div>
  );

  return (
    <header
      className={`fixed top-0 w-full z-50 transition-all duration-500 ${
        isScrolled ? "py-2" : "py-3 md:py-5"
      }`}
      style={{
        background: isScrolled
          ? "background"
          : "background",
        borderBottom: isScrolled
          ? "1px solid color-mix(in oklch, var(--primary) 18%, var(--border))"
          : "background",
        boxShadow: isScrolled
          ? "0 4px 32px -8px color-mix(in oklch, var(--primary) 12%, transparent)"
          : "background",
      }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-[2px] pointer-events-none"
        style={{
          background:
            "repeating-linear-gradient(90deg, var(--gold-dark) 0px, var(--gold-bright) 5px, #8B0000 5px, #8B0000 10px, var(--gold-bright) 10px, var(--gold-dark) 15px)",
          opacity: isScrolled ? 0.55 : 0.32,
          transition: "opacity 0.5s ease",
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
        <Link
          href="#"
          onClick={(e) => handleNavClick(e, "#")}
          className="flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
          aria-label="MTGA – нүүр хуудас"
        >
          <div className="relative flex-shrink-0">
            <div
              className="absolute inset-0 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              style={{ background: "color-mix(in oklch, var(--primary) 28%, transparent)" }}
            />
            <div className="relative px-1.5 py-0.5">
              <span
                className="absolute top-0 left-0 w-2.5 h-2.5 pointer-events-none"
                style={{
                  borderTop: "1.5px solid var(--gold-bright)",
                  borderLeft: "1.5px solid var(--gold-bright)",
                  opacity: 0.7,
                }}
              />
              <span
                className="absolute bottom-0 right-0 w-2.5 h-2.5 pointer-events-none"
                style={{
                  borderBottom: "1.5px solid var(--gold-bright)",
                  borderRight: "1.5px solid var(--gold-bright)",
                  opacity: 0.7,
                }}
              />
              <span
                className="font-display font-black tracking-tighter select-none"
                style={{ fontSize: "clamp(1.3rem, 3vw, 1.5rem)", ...goldTextStyle }}
              >
                MTGA
              </span>
            </div>
            <div
              className="absolute -bottom-0.5 left-0 right-0 h-px origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 pointer-events-none"
              style={{
                background: "linear-gradient(90deg, var(--gold-dark), var(--gold-light), var(--gold-dark))",
              }}
            />
          </div>

          <div
            className="hidden md:block w-px h-7 flex-shrink-0"
            style={{
              background: "linear-gradient(to bottom, transparent, var(--gold-bright) 50%, transparent)",
              opacity: 0.28,
            }}
          />

          <span
            className="hidden md:block font-heritage italic leading-tight"
            style={{
              fontSize: "clamp(0.7rem, 1.2vw, 0.7rem)",
              color: "color-mix(in oklch, var(--foreground) 62%, transparent)",
              maxWidth: "260px",
            }}
          >
            {t.nav.title}
          </span>
        </Link>

        <nav
          ref={navRef}
          className="hidden lg:flex items-center gap-1 relative"
          onMouseLeave={() => setIndicatorStyle({ left: 0, width: 0 })}
        >
          <div
            className="absolute top-0 bottom-0 rounded-full pointer-events-none transition-all duration-300 ease-out"
            style={{
              left: indicatorStyle.left,
              width: indicatorStyle.width || 0,
              background: "color-mix(in oklch, var(--primary) 10%, transparent)",
              border: "1px solid color-mix(in oklch, var(--primary) 22%, transparent)",
              opacity: indicatorStyle.width ? 1 : 0,
            }}
          />

          {navLinks.map((link, i) => (
            <a
              key={link.href}
              ref={(el) => {
                linkRefs.current[i] = el;
              }}
              href={link.href}
              onMouseEnter={() => handleLinkHover(i)}
              onClick={(e) => handleNavClick(e, link.href)}
              className="relative px-4 py-2 rounded-full font-display font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              style={{
                fontSize: "clamp(0.7rem, 1vw, 1rem)",
                letterSpacing: "clamp(0.04em,0.15vw,0.06em)",
                color:
                  activeLink === link.href
                    ? "var(--gold-bright)"
                    : "color-mix(in oklch, var(--foreground) 72%, transparent)",
              }}
            >
              {link.name}
              {activeLink === link.href && (
                <span
                  className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                style={{ background: "var(--gold-bright)" }}
                />
              )}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-2.5">
          <LangToggle />
          <ModeToggle />

          <button
            onClick={() => setIsMobileMenuOpen((v) => !v)}
            aria-label={isMobileMenuOpen ? "Цэс хаах" : "Цэс нээх"}
            aria-expanded={isMobileMenuOpen}
            className="lg:hidden w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            style={{
              background: isMobileMenuOpen
                ? "color-mix(in oklch, var(--primary) 18%, transparent)"
                : "color-mix(in oklch, var(--primary) 8%, transparent)",
              border: "1px solid color-mix(in oklch, var(--primary) 24%, var(--border))",
            }}
          >
            <span className="relative w-4 h-3 flex flex-col justify-between">
              <span
                className="block h-px w-full rounded-full transition-all duration-300 origin-center"
                style={{
                  background: "var(--gold-bright)",
                  transform: isMobileMenuOpen ? "rotate(45deg) translate(2px, 5px)" : "none",
                }}
              />
              <span
                className="block h-px rounded-full transition-all duration-300"
                style={{
                  background: "var(--gold-bright)",
                  width: isMobileMenuOpen ? "0%" : "75%",
                  opacity: isMobileMenuOpen ? 0 : 1,
                }}
              />
              <span
                className="block h-px w-full rounded-full transition-all duration-300 origin-center"
                style={{
                  background: "var(--gold-bright)",
                  transform: isMobileMenuOpen ? "rotate(-45deg) translate(2px, -5px)" : "none",
                }}
              />
            </span>
          </button>
        </div>
      </div>

      <div
        className={`fixed inset-0 z-40 transition-opacity duration-300 lg:hidden ${
          isMobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        style={{
          background: "color-mix(in oklch, oklch(0% 0 0) 70%, transparent)",
          backdropFilter: "blur(4px)",
        }}
        onClick={() => setIsMobileMenuOpen(false)}
      />
      <nav
        className={`fixed top-0 right-0 z-50 flex h-full w-[78vw] max-w-xs flex-col border-l transition-transform duration-300 lg:hidden ${
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{
          background: "color-mix(in oklch, var(--background) 98%, black 2%)",
          borderColor: "color-mix(in oklch, var(--primary) 26%, var(--border))",
          boxShadow: "-18px 0 40px color-mix(in oklch, black 85%, transparent)",
        }}
      >
        <div 
          className="flex items-center justify-between px-6 pt-6 pb-4 border-b"
          style={{
            borderColor: "color-mix(in oklch, var(--primary) 18%, var(--border))"
          }}
        >
          <span
            className="font-display text-sm font-semibold uppercase tracking-[0.26em]"
            style={{ color: "color-mix(in oklch, var(--foreground) 80%, transparent)" }}
          >
            {t.nav.title}
          </span>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Цэс хаах"
            className="w-15 h-7 rounded-full flex items-center justify-center"
            style={{
              border: "1px solid color-mix(in oklch, var(--primary) 26%, var(--border))",
              background: "color-mix(in oklch, var(--primary) 8%, transparent)"
            }}
          >
            <span className="relative w-3.5 h-3.5">
              <span 
                className="absolute inset-0 rotate-45 rounded-full"
                style={{
                  background: "var(--gold-bright)",
                  width: "2px",
                  height: "14px",
                  left: "6px"
                }}
              />
              <span 
                className="absolute inset-0 -rotate-45 rounded-full"
                style={{
                  background: "var(--gold-bright)",
                  width: "2px",
                  height: "14px",
                  left: "6px"
                }}
              />
            </span>
          </button>
        </div>

        <ul className="flex flex-col gap-1 px-4 pt-4 pb-6">
          {navLinks.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="flex items-center justify-between rounded-full px-4 py-3 font-display text-sm uppercase tracking-[0.18em] transition-colors"
                style={{
                  color:
                    activeLink === link.href
                      ? "var(--gold-bright)"
                      : "color-mix(in oklch, var(--foreground) 78%, transparent)",
                  background:
                    activeLink === link.href
                      ? "color-mix(in oklch, var(--primary) 12%, transparent)"
                      : "transparent",
                }}
              >
                <span>{link.name}</span>
                <span
                  className="ml-3 text-xs opacity-70"
                  aria-hidden="true"
                >
                  {link.icon}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}