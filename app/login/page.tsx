"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/AuthContext";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const {
    user,
    loading,
    authConfigured,
    syncError,
    signInWithGoogle,
    signOutUser,
  } = useAuth();
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onGoogle = async () => {
    setErr(null);
    setBusy(true);
    try {
      await signInWithGoogle();
      router.push("/home");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 bg-[#050608] text-slate-200">
      <div
        className="w-full max-w-md rounded-2xl border p-8 space-y-6"
        style={{
          borderColor: "color-mix(in oklch, var(--primary) 28%, var(--border))",
          background:
            "linear-gradient(145deg, rgba(20,16,4,0.92) 0%, rgba(6,4,1,0.97) 100%)",
        }}
      >
        <div className="space-y-1 text-center">
          <h1 className="font-display text-xl tracking-[0.2em] text-[var(--gold-bright)]">
            MTGA
          </h1>
          <p className="text-sm text-slate-400">
            Google-ээр нэвтэрнэ. PostgreSQL-тэй уялдуулахад токен шаардлагагүй
            (имэйлээр simple-sync).
          </p>
        </div>

        {!authConfigured && (
          <p className="text-sm text-amber-200/90 rounded-lg bg-amber-950/40 border border-amber-800/50 p-3">
            Firebase вэб түлхүүр дутуу. Төслийн үндсэн{" "}
            <code className="text-xs">.env.local</code> дээр{" "}
            <code className="text-xs">NEXT_PUBLIC_FIREBASE_*</code> утгуудыг
            Firebase Console-оос хуулж оруулна уу. Жишээ:{" "}
            <code className="text-xs">env.local.example</code>.
          </p>
        )}

        {loading && (
          <p className="text-center text-sm text-slate-500">Ачаалж байна…</p>
        )}

        {!loading && user && (
          <div className="space-y-3 text-center">
            <p className="text-sm">
              Нэвтэрсэн:{" "}
              <span className="text-[var(--gold-bright)]">{user.email}</span>
            </p>
            {syncError && (
              <p className="text-xs text-red-300/90">
                PostgreSQL sync: {syncError}
                <span className="block mt-1 text-slate-500">
                  Express асаасан эсэх, <code>NEXT_PUBLIC_API_URL</code> шалгана уу.
                </span>
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button asChild variant="default">
                <Link href="/home">Үргэлжлүүлэх</Link>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => void signOutUser()}
              >
                Гарах
              </Button>
            </div>
          </div>
        )}

        {!loading && !user && authConfigured && (
          <div className="space-y-3">
            <Button
              type="button"
              className="w-full"
              disabled={busy}
              onClick={() => void onGoogle()}
            >
              {busy ? "Түр хүлээнэ үү…" : "Google-ээр нэвтрэх"}
            </Button>
            {(err || syncError) && (
              <p className="text-xs text-red-300 text-center">
                {err ?? syncError}
              </p>
            )}
          </div>
        )}

        <p className="text-center text-xs text-slate-500">
          <Link href="/" className="underline hover:text-slate-300">
            Нүүр рүү буцах
          </Link>
        </p>
      </div>
    </main>
  );
}
