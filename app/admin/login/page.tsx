"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdminAuth } from "@/components/admin/AdminAuthContext";
import { ModeToggle } from "@/components/ui/mode-toggle";

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, token, isReady } = useAdminAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isReady) return;
    if (token) router.replace("/admin");
  }, [isReady, token, router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      await login(username, password);
      router.replace("/admin");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Нэвтрэхэд алдаа");
    } finally {
      setBusy(false);
    }
  };

  if (!isReady) {
    return (
      <div className="admin-root min-h-screen flex items-center justify-center bg-[var(--admin-bg)] text-[var(--admin-muted)] text-sm">
        Ачаалж байна…
      </div>
    );
  }

  return (
    <div className="admin-root admin-login-screen relative min-h-screen flex flex-col items-center justify-center px-4 py-12 text-[var(--admin-text)]">
      <div className="fixed top-4 right-4 z-10">
        <ModeToggle />
      </div>
      <div className="admin-panel w-full max-w-[420px] p-8 sm:p-9">
        <header className="flex flex-col items-center text-center pb-8 border-b border-[var(--admin-border)]">
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
            <span className="admin-logo font-display text-3xl font-bold tracking-tight">
              MTGA
            </span>
          </div>
          <h1 className="mt-4 text-lg font-medium tracking-tight text-[var(--admin-text)]">
            Админ нэвтрэлт
          </h1>
          <p className="mt-1.5 max-w-[280px] text-xs leading-relaxed text-[var(--admin-muted)]">
            Зөвхөн урьдчилан тохируулсан эрхтэй хэрэглэгчид нэвтэрнэ.
          </p>
        </header>

        <form onSubmit={(e) => void onSubmit(e)} className="space-y-4 pt-8">
          <div className="space-y-1.5">
            <Label
              htmlFor="adm-user"
              className="text-[13px] text-[var(--admin-muted)]"
            >
              Нэвтрэх нэр
            </Label>
            <Input
              id="adm-user"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="h-10 border-[var(--admin-border)] bg-[var(--admin-elevated)] text-[var(--admin-text)] placeholder:text-[var(--admin-subtle)] focus-visible:border-[var(--admin-border-strong)] focus-visible:ring-[3px] focus-visible:ring-ring/45"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label
              htmlFor="adm-pass"
              className="text-[13px] text-[var(--admin-muted)]"
            >
              Нууц үг
            </Label>
            <Input
              id="adm-pass"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-10 border-[var(--admin-border)] bg-[var(--admin-elevated)] text-[var(--admin-text)] placeholder:text-[var(--admin-subtle)] focus-visible:border-[var(--admin-border-strong)] focus-visible:ring-[3px] focus-visible:ring-ring/45"
              placeholder="••••••••"
              required
            />
          </div>
          {err && (
            <p className="text-sm rounded-lg border border-destructive/40 bg-destructive/10 text-destructive px-3 py-2">
              {err}
            </p>
          )}
          <Button type="submit" className="w-full h-10 font-medium shadow-md" disabled={busy}>
            {busy ? "Нэвтэрч байна…" : "Нэвтрэх"}
          </Button>
        </form>

        <p className="text-center text-xs text-[var(--admin-muted)] pt-2">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-1 text-[var(--admin-muted)] underline-offset-4 hover:text-primary hover:underline"
          >
            ← Нүүр хуудас
          </Link>
        </p>
      </div>
    </div>
  );
}
