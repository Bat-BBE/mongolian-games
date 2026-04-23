"use client";

import { useApp } from "./AppContext";

export default function Footer() {
  const { t } = useApp();
  const linkHrefs = ["#", "#", "#"];

  return (
    <footer className="bg-background border-t border-border py-4 sm:py-5 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 sm:gap-6">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <span
            className="font-display font-black tracking-tighter"
            style={{
              fontSize: "clamp(1rem, 3vw, 1.5rem)",
              color: "var(--primary)",
            }}
          >
            MTGA
          </span>

          <div className="h-6 w-px bg-border mx-1 sm:mx-2" />

          <span
            className="font-body tracking-[0.25em] uppercase"
            style={{
              fontSize: "clamp(0.45rem, 1.2vw, 0.65rem)",
              color: "var(--muted-foreground)",
            }}
          >
            {t.footer.subtitle}
          </span>
        </div>

        <div
          className="flex gap-2 sm:gap-4 uppercase tracking-widest font-bold justify-center md:justify-start"
          style={{
            fontSize: "clamp(0.45rem, 1vw, 0.65rem)",
            color: "var(--muted-foreground)",
          }}
        >
          {t.footer.links.map((link, i) => (
            <a
              key={i}
              href={linkHrefs[i]}
              className="hover:text-primary transition-colors duration-300"
            >
              {link}
            </a>
          ))}
        </div>

        <p
          className="uppercase tracking-widest text-center md:text-left mt-2 md:mt-0"
          style={{
            fontSize: "clamp(0.45rem, 1vw, 0.65rem)",
            color: "var(--muted-foreground)",
          }}
        >
          {t.footer.copy}
        </p>
      </div>
    </footer>
  );
}