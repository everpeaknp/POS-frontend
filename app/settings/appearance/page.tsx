"use client";

import { Palette, Globe, Monitor, Sun, Moon, Laptop, ChevronDown, Loader2 } from "lucide-react";
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

  return (
    <SettingsPageShell title="Appearance" subtitle="Theme, language, timezone, and display preferences">
      <SettingsPageContent>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <SettingsCard>
            <SettingsCardHeader icon={Palette} title="Theme" description="Choose how Khata looks on your device" />
            <SettingsCardBody>
              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-[#22C55E]" />
                </div>
              ) : (
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
              )}
            </SettingsCardBody>
          </SettingsCard>

          <SettingsCard>
            <SettingsCardHeader icon={Globe} title="Regional settings" description="Language and timezone" />
            <SettingsCardBody className="space-y-5">
              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-[#22C55E]" />
                </div>
              ) : (
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
              )}
            </SettingsCardBody>
          </SettingsCard>
        </div>

        <SettingsCard>
          <SettingsCardHeader icon={Monitor} title="Display" description="Interface density and motion" />
          <SettingsCardBody className="py-2">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-[#22C55E]" />
              </div>
            ) : (
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
            )}
          </SettingsCardBody>
        </SettingsCard>
      </SettingsPageContent>
    </SettingsPageShell>
  );
}
