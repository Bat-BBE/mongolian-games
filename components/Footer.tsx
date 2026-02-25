"use client";

import { useApp } from "./AppContext";

export default function Footer() {
  const { t } = useApp();
  const linkHrefs = ["#", "#", "#"];

  return (
    <footer className="bg-background border-t border-border py-5 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
        <div className="flex items-center space-x-3">
          <span className="text-2xl font-display font-black text-primary tracking-tighter">
            MTGA
          </span>

          <div className="h-6 w-px bg-border mx-2" />

          <span className="font-heritage text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
            {t.footer.subtitle}
          </span>
        </div>

        <div className="flex gap-10 text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
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
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
          {t.footer.copy}
        </p>

      </div>
    </footer>
  );
}