"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { getFirebaseAuth, isFirebaseAuthConfigured } from "@/lib/firebase";
import { syncAppUserSimple } from "@/lib/api";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  authConfigured: boolean;
  syncError: string | null;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncError, setSyncError] = useState<string | null>(null);

  const authConfigured = isFirebaseAuthConfigured();

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      if (!u) {
        setSyncError(null);
        return;
      }
      void (async () => {
        try {
          setSyncError(null);
          const email = u.email?.trim();
          if (!email) {
            setSyncError("Google account has no email");
            return;
          }
          await syncAppUserSimple({
            email,
            displayName: u.displayName ?? undefined,
          });
        } catch (e) {
          setSyncError(e instanceof Error ? e.message : "PostgreSQL sync failed");
        }
      })();
    });
    return () => unsub();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (!auth) {
      throw new Error("Firebase Auth is not configured (.env.local)");
    }
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  }, []);

  const signOutUser = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (!auth) return;
    await signOut(auth);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      authConfigured,
      syncError,
      signInWithGoogle,
      signOutUser,
    }),
    [user, loading, authConfigured, syncError, signInWithGoogle, signOutUser]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
