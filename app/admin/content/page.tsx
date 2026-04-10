"use client";

import Link from "next/link";
import { LuBookMarked as BookMarked, LuArrowRight as ArrowRight } from "react-icons/lu";
import { Button } from "@/components/ui/button";

export default function AdminContentIndexPage() {
  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-8 text-[var(--admin-text)]">
      <header className="space-y-2">
        <p className="text-[10px] uppercase tracking-[0.35em] text-[var(--admin-subtle)]">
          PostgreSQL
        </p>
        <h1 className="font-display text-2xl md:text-3xl tracking-wide flex items-center gap-2">
          <BookMarked className="size-7 text-[var(--admin-muted)] stroke-[1.5]" />
          Контент
        </h1>
        <p className="text-sm text-[var(--admin-muted)] max-w-2xl leading-relaxed">
          Баатар, өртөө, sidebar текстүүдийг тус тусад нь засварлана.
        </p>
      </header>

      <div className="grid sm:grid-cols-2 gap-4">
        <Card
          title="Баатрууд"
          desc="Нэр, зэрэг, бонус зэрэг."
          href="/admin/heroes"
        />
        <Card
          title="Өртөөнүүд"
          desc="Quest hint/title + quest description (dynamic sidebar)."
          href="/admin/stations"
        />
      </div>
    </div>
  );
}

function Card({ title, desc, href }: { title: string; desc: string; href: string }) {
  return (
    <div className="admin-panel p-5 space-y-3">
      <div className="font-display text-sm tracking-[0.2em] uppercase text-[var(--admin-text)]">
        {title}
      </div>
      <p className="text-xs text-[var(--admin-muted)] leading-relaxed">{desc}</p>
      <Button asChild variant="secondary" size="sm" className="gap-1.5">
        <Link href={href}>
          Нээх
          <ArrowRight className="size-3.5" />
        </Link>
      </Button>
    </div>
  );
}
