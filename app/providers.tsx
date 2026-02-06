"use client";

import { ThemeProvider } from "next-themes";
import { ReactNode, useEffect, useState } from "react";

export function Providers({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Хэрэглэгч сонгосон theme хадгалах
  useEffect(() => {
    const savedTheme = localStorage.getItem("mtga-theme");
    if (savedTheme) {
      document.documentElement.classList.remove("light", "dark");
      document.documentElement.classList.add(savedTheme);
    }
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark" 
      enableSystem={false} 
      disableTransitionOnChange={false}
      storageKey="mtga-theme"
    >
      {children}
    </ThemeProvider>
  );
}