"use client";

import { useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";

export function ThemeAwareToaster() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setIsDark(root.classList.contains("dark"));
    sync();

    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: isDark ? "oklch(0.205 0 0)" : "#ffffff",
          color: isDark ? "oklch(0.985 0 0)" : "#111827",
          border: isDark ? "1px solid oklch(1 0 0 / 12%)" : "1px solid #e5e7eb",
          boxShadow: isDark
            ? "0 10px 15px -3px rgb(0 0 0 / 40%)"
            : "0 10px 15px -3px rgb(0 0 0 / 8%)",
        },
        success: {
          duration: 3000,
          iconTheme: {
            primary: "#22c55e",
            secondary: isDark ? "oklch(0.205 0 0)" : "#ffffff",
          },
        },
        error: {
          duration: 4000,
          iconTheme: {
            primary: "#ef4444",
            secondary: isDark ? "oklch(0.205 0 0)" : "#ffffff",
          },
        },
      }}
    />
  );
}
