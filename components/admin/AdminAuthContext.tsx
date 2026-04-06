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
import { adminLogin, ADMIN_TOKEN_STORAGE_KEY } from "@/lib/api";

type AdminAuthContextValue = {
  token: string | null;
  /** sessionStorage уншсаны дараа true — redirect-оос өмнө хүлээнэ */
  isReady: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  setToken: (t: string | null) => void;
};

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    try {
      const t = sessionStorage.getItem(ADMIN_TOKEN_STORAGE_KEY);
      if (t) setTokenState(t);
    } catch {
      /* ignore */
    } finally {
      setIsReady(true);
    }
  }, []);

  const setToken = useCallback((t: string | null) => {
    setTokenState(t);
    try {
      if (t) sessionStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, t);
      else sessionStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const login = useCallback(
    async (username: string, password: string) => {
      const { token: jwt } = await adminLogin(username.trim(), password);
      setToken(jwt);
    },
    [setToken]
  );

  const logout = useCallback(() => {
    setToken(null);
  }, [setToken]);

  const value = useMemo(
    () => ({ token, isReady, login, logout, setToken }),
    [token, isReady, login, logout, setToken]
  );

  return (
    <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
  );
}

export function useAdminAuth(): AdminAuthContextValue {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) {
    throw new Error("useAdminAuth must be used within AdminAuthProvider");
  }
  return ctx;
}
