"use client";

import "@/app/admin/admin.css";
import { usePathname } from "next/navigation";
import { AdminAuthProvider } from "./AdminAuthContext";
import { AdminAuthGuard } from "./AdminAuthGuard";
import { AdminShell } from "./AdminShell";

export function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === "/admin/login";

  return (
    <AdminAuthProvider>
      {isLogin ? (
        children
      ) : (
        <AdminAuthGuard>
          <AdminShell>{children}</AdminShell>
        </AdminAuthGuard>
      )}
    </AdminAuthProvider>
  );
}
