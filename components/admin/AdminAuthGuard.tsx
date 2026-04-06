"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAdminAuth } from "./AdminAuthContext";

export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const { token, isReady } = useAdminAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isReady) return;
    if (!token) {
      router.replace("/admin/login");
    }
  }, [isReady, token, router]);

  if (!isReady) {
    return (
      <div className="min-h-screen bg-[#050608] flex items-center justify-center text-slate-500 text-sm">
        Ачаалж байна…
      </div>
    );
  }

  if (!token) {
    return null;
  }

  return <>{children}</>;
}
