"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/AuthContext";
import { Button } from "@/components/ui/button";
import { LuLogIn as LogInIcon, LuUserPlus as UserPlusIcon } from "react-icons/lu";

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
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-10 bg-background text-foreground">
      <div className="w-full max-w-4xl grid gap-6 lg:gap-0 lg:grid-cols-2 rounded-3xl overflow-hidden border border-primary/20 bg-card/90 shadow-[0_24px_80px_-20px_color-mix(in_oklch,var(--primary)_18%,transparent)] backdrop-blur-sm">
        <div
          className="p-8 sm:p-10 space-y-6 flex flex-col justify-center"
          style={{
            background:
              "linear-gradient(165deg, color-mix(in oklch, var(--card) 100%, transparent) 0%, color-mix(in oklch, var(--card) 88%, #0f1428) 100%)",
          }}
        >
          <div className="space-y-2 text-center lg:text-left">
            <p className="font-display text-[0.58rem] tracking-[0.35em] uppercase text-[var(--gold-bright)] opacity-80">
              MTGA
            </p>
            <h1 className="font-display text-xl sm:text-2xl tracking-wide text-foreground">
              Нэвтрэх
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Google-ээр нэвтэрнэ. PostgreSQL-тэй уялдуулахад токен шаардлагагүй
              (имэйлээр simple-sync).
            </p>
          </div>

          {!authConfigured && (
            <p className="text-sm text-amber-200/90 rounded-xl bg-amber-950/40 border border-amber-800/50 p-3">
              Firebase вэб түлхүүр дутуу. Төслийн үндсэн{" "}
              <code className="text-xs">.env.local</code> дээр{" "}
              <code className="text-xs">NEXT_PUBLIC_FIREBASE_*</code> утгуудыг
              Firebase Console-оос хуулж оруулна уу. Жишээ:{" "}
              <code className="text-xs">env.local.example</code>.
            </p>
          )}

          {loading && (
            <p className="text-center lg:text-left text-sm text-muted-foreground">
              Ачаалж байна…
            </p>
          )}

          {!loading && user && (
            <div className="space-y-4">
              <p className="text-sm text-center lg:text-left">
                Нэвтэрсэн:{" "}
                <span className="text-[var(--gold-bright)]">{user.email}</span>
              </p>
              {syncError && (
                <p className="text-xs text-red-300/90">
                  PostgreSQL sync: {syncError}
                  <span className="block mt-1 text-muted-foreground">
                    Express асаасан эсэх, <code>NEXT_PUBLIC_API_URL</code> шалгана
                    уу.
                  </span>
                </p>
              )}
              <div className="flex flex-col sm:flex-row gap-2 justify-center lg:justify-start">
                <Link
                  href="/home"
                  className="btn-gold inline-flex items-center justify-center px-6 py-2.5 rounded-xl text-sm no-underline"
                >
                  Үргэлжлүүлэх
                </Link>
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
              <button
                type="button"
                className="w-full btn-gold rounded-xl h-11 border-0 gap-2 inline-flex items-center justify-center disabled:opacity-60"
                disabled={busy}
                onClick={() => void onGoogle()}
              >
                <LogInIcon className="size-4 opacity-90" />
                {busy ? "Түр хүлээнэ үү…" : "Google-ээр нэвтрэх"}
              </button>
              {(err || syncError) && (
                <p className="text-xs text-red-300 text-center">
                  {err ?? syncError}
                </p>
              )}
            </div>
          )}

          <p className="text-center lg:text-left text-xs text-muted-foreground pt-2">
            <Link href="/" className="underline hover:text-[var(--gold-bright)] transition-colors">
              Нүүр рүү буцах
            </Link>
          </p>
        </div>

        <div
          className="relative flex flex-col justify-center items-center text-center p-8 sm:p-10 gap-5 border-t lg:border-t-0 lg:border-l border-primary/15"
          style={{
            background:
              "linear-gradient(200deg, color-mix(in oklch, oklch(28% 0.06 155) 18%, transparent) 0%, color-mix(in oklch, var(--card) 95%, #0a0e18) 100%)",
          }}
        >
          <div
            className="absolute inset-0 opacity-[0.07] pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cg stroke='%237cb342' stroke-width='1'%3E%3Cpath d='M20 118 Q22 88 20 70'/%3E%3Cpath d='M40 118 Q42 92 39 72'/%3E%3Cpath d='M60 118 Q58 86 61 66'/%3E%3Cpath d='M80 118 Q82 94 79 74'/%3E%3Cpath d='M100 118 Q98 90 101 68'/%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: "120px 120px",
            }}
          />
          <UserPlusIcon
            className="size-12 text-primary opacity-90 relative z-10"
            strokeWidth={1.25}
          />
          <div className="relative z-10 space-y-2 max-w-xs">
            <h2 className="font-display text-lg text-foreground">
              Шинэ тоглогч уу?
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Бүртгэл үүсгээд баатар сонгож, газрын зураг дээр аяллаа эхлүүлээрэй.
            </p>
          </div>
          <Link
            href="/register"
            className="relative z-10 btn-emerald px-8 h-11 rounded-xl inline-flex items-center justify-center gap-2 text-sm no-underline"
          >
            <UserPlusIcon className="size-4" />
            Бүртгүүлэх
          </Link>
        </div>
      </div>
    </main>
  );
}
