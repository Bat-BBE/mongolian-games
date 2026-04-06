"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdminAuth } from "@/components/admin/AdminAuthContext";

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
      <div className="min-h-screen bg-[#050608] flex items-center justify-center text-slate-500 text-sm">
        Ачаалж байна…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050608] flex flex-col items-center justify-center px-4 py-12">
      <div
        className="w-full max-w-md rounded-2xl border border-white/10 p-8 space-y-6"
        style={{
          background:
            "linear-gradient(145deg, rgba(20,16,4,0.6) 0%, rgba(6,4,1,0.85) 100%)",
        }}
      >
        <div className="text-center space-y-1">
          <p className="font-display text-lg tracking-[0.2em] text-[var(--gold-bright)]">MTGA</p>
          <h1 className="text-xl font-medium text-slate-100">Админ нэвтрэлт</h1>
          <p className="text-xs text-slate-500">
            Нэвтрэх нэр, нууц үгийг <code className="text-slate-400">server/.env</code> дотор тохируулна.
          </p>
        </div>

        <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="adm-user">Нэвтрэх нэр</Label>
            <Input
              id="adm-user"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-black/40 border-white/15"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="adm-pass">Нууц үг</Label>
            <Input
              id="adm-pass"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-black/40 border-white/15"
              required
            />
          </div>
          {err && (
            <p className="text-sm text-red-300/95 rounded-lg bg-red-950/40 border border-red-900/50 px-3 py-2">
              {err}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Нэвтэрч байна…" : "Нэвтрэх"}
          </Button>
        </form>

        <p className="text-center text-xs text-slate-500">
          <Link href="/" className="text-[var(--gold-bright)]/80 hover:underline">
            ← Нүүр рүү
          </Link>
        </p>
      </div>
    </div>
  );
}
