"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDesktopWorkspace } from "@/lib/context/DesktopWorkspaceContext";

/**
 * Global shortcuts for desktop workspace (Electron).
 * Does not register when running as a normal website.
 */
export function DesktopHotkeys() {
  const router = useRouter();
  const {
    enabled,
    setPaletteOpen,
    setSearchOpen,
    setDiagnosticsOpen,
    goBack,
    goForward,
  } = useDesktopWorkspace();

  useEffect(() => {
    if (!enabled) return;

    const onKey = (e: KeyboardEvent) => {
      const meta = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      // Ctrl+Shift+D — diagnostics
      if (meta && e.shiftKey && key === "d") {
        e.preventDefault();
        setDiagnosticsOpen(true);
        return;
      }

      // Ctrl+Shift+P — command palette
      if (meta && e.shiftKey && key === "p") {
        e.preventDefault();
        setSearchOpen(false);
        setPaletteOpen(true);
        return;
      }

      // Ctrl+K — quick page search
      if (meta && !e.shiftKey && key === "k") {
        e.preventDefault();
        setPaletteOpen(false);
        setSearchOpen(true);
        return;
      }

      // Alt+Left / Alt+Right — history
      if (e.altKey && e.key === "ArrowLeft") {
        e.preventDefault();
        goBack();
        return;
      }
      if (e.altKey && e.key === "ArrowRight") {
        e.preventDefault();
        goForward();
        return;
      }

      // Ctrl+T — home dashboard
      if (meta && key === "t") {
        e.preventDefault();
        router.push("/dashboard");
        return;
      }

      // F5 reload
      if (e.key === "F5") {
        e.preventDefault();
        window.location.reload();
      }

      // F11 fullscreen
      if (e.key === "F11") {
        e.preventDefault();
        if (!document.fullscreenElement) void document.documentElement.requestFullscreen();
        else void document.exitFullscreen();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    enabled,
    setPaletteOpen,
    setSearchOpen,
    setDiagnosticsOpen,
    goBack,
    goForward,
    router,
  ]);

  return null;
}
