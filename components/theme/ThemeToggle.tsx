"use client";

import { Moon, Sun } from "lucide-react";
import { useAppearance } from "@/lib/context/AppearanceContext";
import { getDesktopApi } from "@/lib/desktop";

/**
 * Navbar theme control — flips light ↔ dark (persists via AppearanceContext).
 */
export function ThemeToggle() {
  const { isDark, updatePreferences } = useAppearance();

  const toggle = async () => {
    const next = isDark ? "light" : "dark";
    try {
      await updatePreferences({ theme: next });
      const desktop = getDesktopApi();
      if (desktop) {
        await desktop.store.set("appearance.theme", next);
      }
    } catch {
      // AppearanceContext already rolls back optimistic update
    }
  };

  return (
    <button
      type="button"
      onClick={() => void toggle()}
      className="relative p-2 rounded-lg hover:bg-accent text-muted-foreground transition-colors"
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Light mode" : "Dark mode"}
    >
      {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
}
