"use client";

import { useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";
import { getDesktopPlatform, isElectron } from "@/lib/desktop";

/**
 * Global toasts. On Electron/Windows, offset clear of the title bar + caption buttons
 * (native overlay always paints above the page — z-index cannot win).
 */
export function ThemeAwareToaster() {
  const [isDark, setIsDark] = useState(false);
  const [desktop, setDesktop] = useState(false);
  const [isWin, setIsWin] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setIsDark(root.classList.contains("dark"));
    sync();

    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setDesktop(isElectron());
    setIsWin(getDesktopPlatform() === "win32");
  }, []);

  const containerStyle: React.CSSProperties = desktop
    ? {
        // Below title bar (env height fallback 40) + gap
        top: "calc(env(titlebar-area-height, 40px) + 12px)",
        // Clear native min/max/close strip on Windows (~138px)
        right: isWin
          ? "max(138px, calc(100vw - env(titlebar-area-width, 100vw) - env(titlebar-area-x, 0px) + 12px))"
          : 16,
        zIndex: 99999,
      }
    : {
        top: 16,
        right: 16,
      };

  return (
    <Toaster
      position="top-right"
      containerStyle={containerStyle}
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
