"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  BookMarked,
  Gamepad2,
  Home,
  LayoutDashboard,
  Menu,
  PanelLeftClose,
  PanelLeft,
  ExternalLink,
  X,
  Users,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAdminAuth } from "./AdminAuthContext";

const nav = [
  { href: "/admin", label: "Самбар", icon: LayoutDashboard, match: "exact" as const },
  { href: "/admin/games", label: "Тоглоомууд", icon: Gamepad2, match: "prefix" as const },
  { href: "/admin/content", label: "Контент", icon: BookMarked, match: "prefix" as const },
  { href: "/admin/users", label: "Хэрэглэгчид", icon: Users, match: "prefix" as const },
];

function isActive(pathname: string, href: string, match: "exact" | "prefix") {
  if (match === "exact") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAdminAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const onLogout = () => {
    logout();
    router.push("/admin/login");
  };

  return (
    <div className="min-h-screen flex bg-[#050608] text-slate-200">
      <button
        type="button"
        aria-label={mobileOpen ? "Цэс хаах" : "Цэс нээх"}
        className="fixed top-4 left-4 z-50 lg:hidden p-2.5 rounded-xl border border-white/10 bg-zinc-900/90 text-slate-200 shadow-lg"
        onClick={() => setMobileOpen((v) => !v)}
      >
        {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>

      <aside
        className={cn(
          "fixed lg:sticky top-0 z-40 h-screen flex flex-col border-r border-white/10",
          "bg-gradient-to-b from-zinc-950 to-[#050608] shadow-xl transition-[transform,width] duration-200 ease-out",
          "w-[min(280px,88vw)]",
          sidebarCollapsed ? "lg:w-[76px]" : "lg:w-[260px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0"
        )}
      >
        <div className={cn("p-4 border-b border-white/10", sidebarCollapsed && "px-2")}>
          <Link
            href="/admin"
            className="flex items-center gap-2 group"
            onClick={() => setMobileOpen(false)}
          >
            <span className="font-display font-black tracking-tighter text-[var(--gold-bright)] text-lg shrink-0">
              MTGA
            </span>
            {!sidebarCollapsed && (
              <span className="text-[10px] uppercase tracking-[0.28em] text-slate-500 group-hover:text-slate-400 transition-colors">
                Админ
              </span>
            )}
          </Link>
        </div>

        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {nav.map(({ href, label, icon: Icon, match }) => {
            const active = isActive(pathname, href, match);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors border",
                  active
                    ? "bg-amber-950/35 text-[var(--gold-bright)] border-amber-800/35"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border-transparent"
                )}
                title={sidebarCollapsed ? label : undefined}
              >
                <Icon className="size-[18px] shrink-0 opacity-90" strokeWidth={1.75} />
                {!sidebarCollapsed && <span>{label}</span>}
              </Link>
            );
          })}
        </nav>

        <div
          className={cn(
            "p-3 border-t border-white/10 space-y-2 mt-auto",
            sidebarCollapsed && "px-2"
          )}
        >
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full justify-center gap-2 h-9 text-xs border-white/15 text-slate-300"
            onClick={() => onLogout()}
          >
            <LogOut className="size-3.5" />
            {!sidebarCollapsed && "Гарах"}
          </Button>
          <div className="flex gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="hidden lg:flex shrink-0 h-9 w-9 text-slate-400"
              onClick={() => setSidebarCollapsed((c) => !c)}
              title={sidebarCollapsed ? "Сайдбар өргөтгөх" : "Хумих"}
            >
              {sidebarCollapsed ? (
                <PanelLeft className="size-4" />
              ) : (
                <PanelLeftClose className="size-4" />
              )}
            </Button>
            <Button variant="outline" size="sm" className="flex-1 text-xs gap-1.5 h-9 border-white/15" asChild>
              <Link href="/" onClick={() => setMobileOpen(false)}>
                <Home className="size-3.5" />
                {!sidebarCollapsed && <span>Сайт</span>}
                <ExternalLink className="size-3 opacity-60" />
              </Link>
            </Button>
          </div>
        </div>
      </aside>

      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/75 lg:hidden backdrop-blur-[2px]"
          aria-label="Хаах"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <main className="flex-1 min-w-0 pt-16 lg:pt-0 min-h-screen">{children}</main>
    </div>
  );
}
