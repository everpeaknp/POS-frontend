"use client";

import { Palette, Globe, Monitor, Sun, Moon, Laptop, ChevronDown, PanelLeft, PanelTop } from "lucide-react";
import toast from "react-hot-toast";
import { useAppearance } from "@/lib/context/AppearanceContext";
import type { AppearancePreferences } from "@/lib/types/user";
import { SettingsPageShell } from "@/components/settings/SettingsPageShell";
import {
  SettingsCard,
  SettingsCardBody,
  SettingsCardHeader,
  SettingsField,
  SettingsPageContent,
  SettingsToggleRow,
  settingsInputClass,
} from "@/components/settings/settings-ui";

export default function AppearancePage() {
  const { preferences, loading, updatePreferences } = useAppearance();

  const handleThemeChange = async (theme: AppearancePreferences["theme"]) => {
    try {
      await updatePreferences({ theme });
      toast.success("Theme updated");
    } catch {
      toast.error("Failed to update theme");
    }
  };

  const handleLanguageChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const language = e.target.value as AppearancePreferences["language"];
    try {
      await updatePreferences({ language });
      toast.success("Language updated");
    } catch {
      toast.error("Failed to update language");
    }
  };

  const handleTimezoneChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const timezone = e.target.value;
    try {
      await updatePreferences({ timezone });
      toast.success("Timezone updated");
    } catch {
      toast.error("Failed to update timezone");
    }
  };

  const handleNavbarPositionChange = async (
    navbar_position: AppearancePreferences["navbar_position"]
  ) => {
    try {
      await updatePreferences({ navbar_position });
      toast.success("Navigation position updated");
    } catch {
      toast.error("Failed to update navigation position");
    }
  };

  const handleToggle = async (key: "compact_mode" | "smooth_animations") => {
    const newValue = !preferences[key];
    try {
      await updatePreferences({ [key]: newValue });
      toast.success("Preference updated");
    } catch {
      toast.error("Failed to update preference");
    }
  };

  const themes = [
    { name: "Light", value: "light" as const, icon: Sun, preview: "bg-white border-gray-200 dark:bg-zinc-800 dark:border-zinc-700" },
    { name: "Dark", value: "dark" as const, icon: Moon, preview: "bg-gray-900 border-gray-800" },
    { name: "System", value: "system" as const, icon: Laptop, preview: "bg-gradient-to-br from-white to-gray-300 border-gray-200 dark:from-zinc-800 dark:to-zinc-950 dark:border-zinc-700" },
  ];

  const navbarPositions = [
    {
      name: "Left",
      value: "left" as const,
      icon: PanelLeft,
      description: "Vertical bar left of the sidebar",
    },
    {
      name: "Top",
      value: "top" as const,
      icon: PanelTop,
      description: "Horizontal bar above content",
    },
  ];

  return (
    <SettingsPageShell
      title="Appearance"
      subtitle="Theme, language, timezone, and display preferences"
      loading={loading}
      loadingMessage="Loading appearance settings…"
    >
      <SettingsPageContent>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <SettingsCard>
            <SettingsCardHeader icon={Palette} title="Theme" description="Choose how Khata looks on your device" />
            <SettingsCardBody>
              <div className="grid grid-cols-3 gap-4">
                {themes.map((theme) => (
                    <button
                      key={theme.value}
                      type="button"
                      onClick={() => handleThemeChange(theme.value)}
                      className={`rounded-xl p-1 transition-all ${
                        preferences.theme === theme.value
                          ? "ring-2 ring-[#22C55E] ring-offset-2 ring-offset-background"
                          : "hover:opacity-90"
                      }`}
                    >
                      <div className={`h-20 rounded-lg border mb-2 flex items-center justify-center ${theme.preview}`}>
                        <theme.icon
                          className={`h-5 w-5 ${
                            preferences.theme === theme.value ? "text-[#22C55E]" : "text-muted-foreground"
                          }`}
                        />
                      </div>
                      <span
                        className={`text-xs font-medium ${
                          preferences.theme === theme.value ? "text-[#22C55E]" : "text-muted-foreground"
                        }`}
                      >
                        {theme.name}
                      </span>
                    </button>
                  ))}
              </div>
            </SettingsCardBody>
          </SettingsCard>

          <SettingsCard>
            <SettingsCardHeader icon={Globe} title="Regional settings" description="Language and timezone" />
            <SettingsCardBody className="space-y-5">
              <>
                <SettingsField label="Language">
                    <div className="relative">
                      <select
                        value={preferences.language}
                        onChange={handleLanguageChange}
                        className={`${settingsInputClass} appearance-none pr-10`}
                      >
                        <option value="en-US">English (US)</option>
                        <option value="en-GB">English (UK)</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                        <option value="hi">Hindi</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </SettingsField>

                  <SettingsField label="Timezone">
                    <div className="relative">
                      <select
                        value={preferences.timezone}
                        onChange={handleTimezoneChange}
                        className={`${settingsInputClass} appearance-none pr-10`}
                      >
                        <option value="UTC">UTC (GMT+0:00)</option>
                        <option value="America/New_York">Eastern Time (GMT-5:00)</option>
                        <option value="America/Chicago">Central Time (GMT-6:00)</option>
                        <option value="America/Denver">Mountain Time (GMT-7:00)</option>
                        <option value="America/Los_Angeles">Pacific Time (GMT-8:00)</option>
                        <option value="Europe/London">London (GMT+0:00)</option>
                        <option value="Europe/Paris">Paris (GMT+1:00)</option>
                        <option value="Asia/Dubai">Dubai (GMT+4:00)</option>
                        <option value="Asia/Kolkata">IST (GMT+5:30)</option>
                        <option value="Asia/Kathmandu">Nepal (GMT+5:45)</option>
                        <option value="Asia/Singapore">Singapore (GMT+8:00)</option>
                        <option value="Asia/Tokyo">Tokyo (GMT+9:00)</option>
                        <option value="Australia/Sydney">Sydney (GMT+10:00)</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </SettingsField>
                </>
            </SettingsCardBody>
          </SettingsCard>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <SettingsCard>
            <SettingsCardHeader
              icon={PanelLeft}
              title="App bar"
              description="Where the theme, account, and notification icons sit"
            />
            <SettingsCardBody>
              <div className="grid grid-cols-2 gap-4">
                {navbarPositions.map((pos) => (
                  <button
                    key={pos.value}
                    type="button"
                    onClick={() => handleNavbarPositionChange(pos.value)}
                    className={`rounded-xl p-1 text-left transition-all ${
                      preferences.navbar_position === pos.value
                        ? "ring-2 ring-[#22C55E] ring-offset-2 ring-offset-background"
                        : "hover:opacity-90"
                    }`}
                  >
                    <div className="h-24 rounded-lg border border-border bg-muted/40 mb-2 p-2.5 overflow-hidden">
                      {pos.value === "left" ? (
                        <div className="flex h-full gap-1.5">
                          <div className="w-2.5 rounded bg-white border border-gray-200 dark:bg-[#162232] dark:border-transparent" />
                          <div className="w-5 rounded bg-[#1E2A3B] flex flex-col gap-1 p-1">
                            <div className="h-1 rounded-sm bg-[#22C55E]/80" />
                            <div className="h-1 rounded-sm bg-white/30" />
                            <div className="h-1 rounded-sm bg-white/20" />
                          </div>
                          <div className="flex-1 rounded bg-background border border-border/60" />
                        </div>
                      ) : (
                        <div className="flex h-full gap-1.5">
                          <div className="w-5 rounded bg-[#1E2A3B] flex flex-col gap-1 p-1">
                            <div className="h-1 rounded-sm bg-[#22C55E]/80" />
                            <div className="h-1 rounded-sm bg-white/30" />
                            <div className="h-1 rounded-sm bg-white/20" />
                          </div>
                          <div className="flex flex-1 flex-col gap-1.5 min-h-0">
                            <div className="h-2.5 rounded bg-white border border-gray-200 dark:bg-[#162232] dark:border-transparent" />
                            <div className="flex-1 rounded bg-background border border-border/60" />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 px-1">
                      <pos.icon
                        className={`h-3.5 w-3.5 ${
                          preferences.navbar_position === pos.value
                            ? "text-[#22C55E]"
                            : "text-muted-foreground"
                        }`}
                      />
                      <span
                        className={`text-xs font-medium ${
                          preferences.navbar_position === pos.value
                            ? "text-[#22C55E]"
                            : "text-muted-foreground"
                        }`}
                      >
                        {pos.name}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground px-1 mt-0.5">{pos.description}</p>
                  </button>
                ))}
              </div>
            </SettingsCardBody>
          </SettingsCard>

          <SettingsCard>
            <SettingsCardHeader icon={Monitor} title="Display" description="Interface density and motion" />
            <SettingsCardBody className="py-2">
              <>
                <SettingsToggleRow
                  title="Compact mode"
                  description="Show more information in less space"
                  checked={preferences.compact_mode}
                  onChange={() => handleToggle("compact_mode")}
                />
                <SettingsToggleRow
                  title="Smooth animations"
                  description="Enable interface transitions"
                  checked={preferences.smooth_animations}
                  onChange={() => handleToggle("smooth_animations")}
                />
              </>
            </SettingsCardBody>
          </SettingsCard>
        </div>
      </SettingsPageContent>
    </SettingsPageShell>
  );
}
