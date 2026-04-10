"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LuBookMarked as BookMarkedIcon,
  LuMapPinned as StationsIcon,
  LuGamepad2 as Gamepad2,
  LuHouse as Home,
  LuLayoutDashboard as LayoutDashboard,
  LuMenu as Menu,
  LuPanelLeftClose as PanelLeftClose,
  LuPanelLeft as PanelLeft,
  LuExternalLink as ExternalLink,
  LuX as X,
  LuLogOut as LogOut,
  LuGem as Gem,
} from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { cn } from "@/lib/utils";
import { useAdminAuth } from "./AdminAuthContext";

const nav = [
  {
    href: "/admin",
    label: "Самбар",
    icon: LayoutDashboard,
    match: "exact" as const,
  },
  {
    href: "/admin/games",
    label: "Тоглоомууд",
    icon: Gamepad2,
    match: "prefix" as const,
  },
  {
    href: "/admin/heroes",
    label: "Баатрууд",
    icon: BookMarkedIcon,
    match: "prefix" as const,
  },
  {
    href: "/admin/stations",
    label: "Өртөөнүүд",
    icon: StationsIcon,
    match: "prefix" as const,
  },
  {
    href: "/admin/treasury",
    label: "Эрдэнэс",
    icon: Gem,
    match: "prefix" as const,
  },
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
    <div className="admin-root min-h-screen flex bg-[var(--admin-bg)] text-[var(--admin-text)]">
      <button
        type="button"
        aria-label={mobileOpen ? "Цэс хаах" : "Цэс нээх"}
        className="fixed top-4 left-4 z-50 lg:hidden p-2.5 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-elevated)] text-[var(--admin-text)] hover:bg-[var(--admin-nav-hover)] hover:text-[var(--accent-foreground)]"
        onClick={() => setMobileOpen((v) => !v)}
      >
        {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>

      <aside
        className={cn(
          "fixed lg:sticky top-0 z-40 h-screen flex flex-col border-r border-[var(--admin-border)]",
          "shadow-none transition-[transform,width] duration-200 ease-out",
          "w-[min(280px,88vw)]",
          sidebarCollapsed ? "lg:w-[72px]" : "lg:w-[248px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0",
        )}
      >
        <div
          className={cn(
            "p-3 sm:p-4 border-b border-[var(--admin-border)]",
            sidebarCollapsed && "px-2",
          )}
        >
          <div
            className={cn(
              "flex min-w-0 gap-2",
              sidebarCollapsed
                ? "flex-col items-center gap-3"
                : "items-center justify-between",
            )}
          >
            <Link
              href="/admin"
              className="flex items-center gap-2 group min-w-0"
              onClick={() => setMobileOpen(false)}
            >
              <span className="admin-logo font-display font-bold text-xl tracking-tight shrink-0">
                MTGA
              </span>
              {!sidebarCollapsed && (
                <span className="admin-badge text-[10px] uppercase tracking-[0.2em]">
                  Админ
                </span>
              )}
            </Link>
            <div
              className={cn(
                "flex items-center gap-1 shrink-0",
                sidebarCollapsed && "justify-center",
              )}
            >
              <ModeToggle />
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="hidden lg:flex h-8 w-8 text-[var(--admin-muted)] border-[var(--primary)] hover:bg-[var(--admin-nav-hover)] hover:text-[var(--accent-foreground)]"
                onClick={() => setSidebarCollapsed((c) => !c)}
                title={sidebarCollapsed ? "Нээх" : "Хаах"}
              >
                {sidebarCollapsed ? (
                  <PanelLeft className="size-4 stroke-[1.5]" />
                ) : (
                  <PanelLeftClose className="size-4 stroke-[1.5]" />
                )}
              </Button>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {nav.map(({ href, label, icon: Icon, match }) => {
            const active = isActive(pathname, href, match);
            return (
              <Link
                key={href}
                href={href}
                data-active={active}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "admin-nav-link flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors border",
                )}
                title={sidebarCollapsed ? label : undefined}
              >
                <Icon className="size-[17px] shrink-0 opacity-90 stroke-[1.5]" />
                {!sidebarCollapsed && <span>{label}</span>}
              </Link>
            );
          })}
        </nav>

        <div
          className={cn(
            "p-3 border-t border-[var(--admin-border)] space-y-2 mt-auto",
            sidebarCollapsed && "px-2",
          )}
        >
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full justify-center gap-2 h-9 text-xs border-[var(--admin-border)] text-[var(--admin-muted)] hover:bg-[var(--admin-nav-hover)] hover:text-[var(--accent-foreground)]"
            onClick={() => onLogout()}
          >
            <LogOut className="size-3.5 stroke-[1.5]" />
            {!sidebarCollapsed && "Гарах"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs gap-1.5 h-9 border-[var(--admin-border)] text-[var(--admin-muted)] hover:bg-[var(--admin-nav-hover)] hover:text-[var(--accent-foreground)]"
            asChild
          >
            <Link href="/" onClick={() => setMobileOpen(false)}>
              <Home className="size-3.5 stroke-[1.5]" />
              {!sidebarCollapsed && <span>Сайт</span>}
              <ExternalLink className="size-3 opacity-50 stroke-[1.5]" />
            </Link>
          </Button>
        </div>
      </aside>

      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/70 lg:hidden"
          aria-label="Хаах"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <main className="flex-1 min-w-0 pt-16 lg:pt-0 min-h-screen bg-[var(--admin-bg)]">
        {children}
      </main>
    </div>
  );
}
