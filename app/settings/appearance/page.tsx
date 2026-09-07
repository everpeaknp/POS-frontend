"use client";

import { useState } from "react";
import { Palette, Globe, Monitor, Sun, Moon, Laptop, ChevronDown, PanelLeft, PanelTop, Square, RotateCcw, Check, Eye, Settings, ChevronRight, XCircle, Tags } from "lucide-react";
import toast from "react-hot-toast";
import { useAppearance } from "@/lib/context/AppearanceContext";
import { BORDER_RADIUS_PRESETS } from "@/lib/theme";
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
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ThemePreview } from "@/components/settings/ThemePreview";

const ACCENT_COLORS = [
  { name: "Blue", value: "#3B82F6" },
  { name: "Indigo", value: "#6366F1" },
  { name: "Violet", value: "#8B5CF6" },
  { name: "Purple", value: "#A855F7" },
  { name: "Rose", value: "#F43F5E" },
  { name: "Pink", value: "#EC4899" },
  { name: "Orange", value: "#F97316" },
  { name: "Amber", value: "#F59E0B" },
  { name: "Green", value: "var(--color-accent-custom,#22C55E)" },
  { name: "Emerald", value: "#10B981" },
  { name: "Cyan", value: "#06B6D4" },
];

const SIDEBAR_NAVBAR_COLORS = [
  { name: "Navy", value: "#1E2A3B" },
  { name: "Charcoal", value: "#1F2937" },
  { name: "Midnight", value: "#0F172A" },
  { name: "Slate", value: "#334155" },
  { name: "Indigo", value: "#312E81" },
  { name: "Plum", value: "#4C1D4C" },
  { name: "Forest", value: "#1B4332" },
  { name: "Wine", value: "#4C0519" },
  { name: "Espresso", value: "#3B2F2F" },
  { name: "Black", value: "#111111" },
  { name: "White", value: "#FFFFFF" },
];

const BORDER_RADIUS_OPTIONS = [
  { name: "Sharp", value: BORDER_RADIUS_PRESETS.none },
  { name: "Small", value: BORDER_RADIUS_PRESETS.small },
  { name: "Default", value: BORDER_RADIUS_PRESETS.default },
  { name: "Large", value: BORDER_RADIUS_PRESETS.large },
  { name: "Full", value: BORDER_RADIUS_PRESETS.full },
];

export default function AppearancePage() {
  const { preferences, loading, updatePreferences } = useAppearance();
  const [isResetting, setIsResetting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

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

  const handleToggle = async (key: "compact_mode" | "smooth_animations" | "high_contrast") => {
    const newValue = !preferences[key];
    try {
      await updatePreferences({ [key]: newValue });
      toast.success("Preference updated");
    } catch {
      toast.error("Failed to update preference");
    }
  };

  const handleAccentChange = async (color: string) => {
    try {
      await updatePreferences({ accent_color: color });
      toast.success("Accent color updated");
    } catch {
      toast.error("Failed to update accent color");
    }
  };

  const handleSidebarColorChange = async (color: string) => {
    try {
      await updatePreferences({ sidebar_color: color });
      toast.success("Sidebar color updated");
    } catch {
      toast.error("Failed to update sidebar color");
    }
  };

  const handleNavbarColorChange = async (color: string) => {
    try {
      await updatePreferences({ navbar_color: color });
      toast.success("Navbar color updated");
    } catch {
      toast.error("Failed to update navbar color");
    }
  };

  const handleBorderRadiusChange = async (value: string) => {
    try {
      await updatePreferences({ border_radius: value });
      toast.success("Border radius updated");
    } catch {
      toast.error("Failed to update border radius");
    }
  };

  const handleReset = async () => {
    setIsResetting(true);
    try {
      await updatePreferences({
        theme: "light",
        accent_color: "",
        sidebar_color: "",
        navbar_color: "",
        border_radius: "",
        compact_mode: true,
        smooth_animations: true,
        high_contrast: false,
      });
      toast.success("Settings reset to defaults");
    } catch {
      toast.error("Failed to reset settings");
    } finally {
      setIsResetting(false);
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
        {/* Theme Selection */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <SettingsCard>
            <SettingsCardHeader icon={Palette} title="Theme" description="Choose how Khata looks on your device" />
            <SettingsCardBody>
              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                {themes.map((theme) => (
                  <button
                    key={theme.value}
                    type="button"
                    onClick={() => handleThemeChange(theme.value)}
                    aria-label={`Select ${theme.name} theme`}
                    aria-pressed={preferences.theme === theme.value}
                    className={cn(
                      "group rounded-xl p-1 transition-all duration-200",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      preferences.theme === theme.value
                        ? "ring-2 ring-[var(--color-accent-custom,#22C55E)] ring-offset-2 ring-offset-background scale-[1.02]"
                        : "hover:scale-[1.02] hover:shadow-sm"
                    )}
                  >
                    <div className={cn(
                      "relative h-20 rounded-lg border mb-2 flex items-center justify-center overflow-hidden transition-all duration-200",
                      theme.preview,
                      preferences.theme !== theme.value && "group-hover:border-muted-foreground/30"
                    )}>
                      <theme.icon
                        className={cn(
                          "h-5 w-5 transition-all duration-200",
                          preferences.theme === theme.value 
                            ? "text-[var(--color-accent-custom,#22C55E)] scale-110" 
                            : "text-muted-foreground group-hover:scale-105"
                        )}
                      />
                      {preferences.theme === theme.value && (
                        <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[var(--color-accent-custom,#22C55E)] flex items-center justify-center animate-in zoom-in-50 duration-200">
                          <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                        </div>
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-xs font-medium block transition-colors duration-200",
                        preferences.theme === theme.value ? "text-[var(--color-accent-custom,#22C55E)]" : "text-muted-foreground group-hover:text-foreground"
                      )}
                    >
                      {theme.name}
                    </span>
                  </button>
                ))}
              </div>
            </SettingsCardBody>
          </SettingsCard>

          {/* Accent Color */}
          <SettingsCard>
            <SettingsCardHeader icon={Tags} title="Accent Color" description="Customize your brand color" />
            <SettingsCardBody>
              <div className="grid grid-cols-6 sm:grid-cols-11 gap-3 sm:gap-4">
                {ACCENT_COLORS.map((color) => {
                  const isActive = preferences.accent_color === color.value;
                  return (
                    <button
                      key={color.value}
                      onClick={() => handleAccentChange(color.value)}
                      type="button"
                      aria-label={`Select ${color.name} accent color`}
                      aria-pressed={isActive}
                      className={cn(
                        "group relative aspect-square rounded-xl transition-all duration-200 ease-out",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                        "hover:-translate-y-0.5 hover:scale-110 hover:shadow-lg",
                        isActive ? "scale-105 shadow-md ring-2 ring-offset-2 ring-offset-background" : "shadow-sm"
                      )}
                      style={{
                        backgroundColor: color.value,
                        "--tw-ring-color": color.value,
                      } as React.CSSProperties}
                      title={color.name}
                    >
                      {isActive && (
                        <span
                          aria-hidden="true"
                          className="absolute -inset-1.5 -z-10 rounded-xl opacity-40 blur-md transition-opacity duration-200"
                          style={{ backgroundColor: color.value }}
                        />
                      )}
                      {isActive && (
                        <div className="absolute inset-0 flex items-center justify-center animate-in zoom-in-50 duration-200">
                          <Check className="h-4 w-4 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]" strokeWidth={3} />
                        </div>
                      )}
                      <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-2 py-0.5 text-[10px] font-medium text-background opacity-0 transition-opacity duration-150 group-hover:opacity-100 pointer-events-none z-10">
                        {color.name}
                      </span>
                    </button>
                  );
                })}
              </div>
              {preferences.accent_color && (
                <div className="mt-6 pt-4 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAccentChange("")}
                    className="text-xs h-8 transition-all duration-200 hover:scale-105"
                  >
                    <XCircle className="h-3 w-3 mr-1.5" />
                    Reset to default color
                  </Button>
                </div>
              )}
            </SettingsCardBody>
          </SettingsCard>
        </div>

        {/* Sidebar & Navbar Colors */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <SettingsCard>
            <SettingsCardHeader icon={PanelLeft} title="Sidebar Color" description="Customize the navigation menu background" />
            <SettingsCardBody>
              <div className="grid grid-cols-6 sm:grid-cols-11 gap-3 sm:gap-4">
                {SIDEBAR_NAVBAR_COLORS.map((color) => {
                  const isActive = preferences.sidebar_color === color.value;
                  const isLight = color.value === "#FFFFFF";
                  return (
                    <button
                      key={color.value}
                      onClick={() => handleSidebarColorChange(color.value)}
                      type="button"
                      aria-label={`Select ${color.name} sidebar color`}
                      aria-pressed={isActive}
                      className={cn(
                        "group relative aspect-square rounded-xl transition-all duration-200 ease-out",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                        "hover:-translate-y-0.5 hover:scale-110 hover:shadow-lg",
                        isLight && "border border-gray-200 dark:border-border",
                        isActive ? "scale-105 shadow-md ring-2 ring-offset-2 ring-offset-background" : "shadow-sm"
                      )}
                      style={{
                        backgroundColor: color.value,
                        "--tw-ring-color": color.value,
                      } as React.CSSProperties}
                      title={color.name}
                    >
                      {isActive && (
                        <span
                          aria-hidden="true"
                          className="absolute -inset-1.5 -z-10 rounded-xl opacity-40 blur-md transition-opacity duration-200"
                          style={{ backgroundColor: color.value }}
                        />
                      )}
                      {isActive && (
                        <div className="absolute inset-0 flex items-center justify-center animate-in zoom-in-50 duration-200">
                          <Check
                            className={cn(
                              "h-4 w-4",
                              isLight ? "text-gray-900" : "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]"
                            )}
                            strokeWidth={3}
                          />
                        </div>
                      )}
                      <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-2 py-0.5 text-[10px] font-medium text-background opacity-0 transition-opacity duration-150 group-hover:opacity-100 pointer-events-none z-10">
                        {color.name}
                      </span>
                    </button>
                  );
                })}
              </div>
              {preferences.sidebar_color && (
                <div className="mt-6 pt-4 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSidebarColorChange("")}
                    className="text-xs h-8 transition-all duration-200 hover:scale-105"
                  >
                    <XCircle className="h-3 w-3 mr-1.5" />
                    Reset to default color
                  </Button>
                </div>
              )}
            </SettingsCardBody>
          </SettingsCard>

          <SettingsCard>
            <SettingsCardHeader icon={PanelTop} title="Navbar Color" description="Customize the app icon rail background" />
            <SettingsCardBody>
              <div className="grid grid-cols-6 sm:grid-cols-11 gap-3 sm:gap-4">
                {SIDEBAR_NAVBAR_COLORS.map((color) => {
                  const isActive = preferences.navbar_color === color.value;
                  const isLight = color.value === "#FFFFFF";
                  return (
                    <button
                      key={color.value}
                      onClick={() => handleNavbarColorChange(color.value)}
                      type="button"
                      aria-label={`Select ${color.name} navbar color`}
                      aria-pressed={isActive}
                      className={cn(
                        "group relative aspect-square rounded-xl transition-all duration-200 ease-out",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                        "hover:-translate-y-0.5 hover:scale-110 hover:shadow-lg",
                        isLight && "border border-gray-200 dark:border-border",
                        isActive ? "scale-105 shadow-md ring-2 ring-offset-2 ring-offset-background" : "shadow-sm"
                      )}
                      style={{
                        backgroundColor: color.value,
                        "--tw-ring-color": color.value,
                      } as React.CSSProperties}
                      title={color.name}
                    >
                      {isActive && (
                        <span
                          aria-hidden="true"
                          className="absolute -inset-1.5 -z-10 rounded-xl opacity-40 blur-md transition-opacity duration-200"
                          style={{ backgroundColor: color.value }}
                        />
                      )}
                      {isActive && (
                        <div className="absolute inset-0 flex items-center justify-center animate-in zoom-in-50 duration-200">
                          <Check
                            className={cn(
                              "h-4 w-4",
                              isLight ? "text-gray-900" : "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]"
                            )}
                            strokeWidth={3}
                          />
                        </div>
                      )}
                      <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-2 py-0.5 text-[10px] font-medium text-background opacity-0 transition-opacity duration-150 group-hover:opacity-100 pointer-events-none z-10">
                        {color.name}
                      </span>
                    </button>
                  );
                })}
              </div>
              {preferences.navbar_color && (
                <div className="mt-6 pt-4 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleNavbarColorChange("")}
                    className="text-xs h-8 transition-all duration-200 hover:scale-105"
                  >
                    <XCircle className="h-3 w-3 mr-1.5" />
                    Reset to default color
                  </Button>
                </div>
              )}
            </SettingsCardBody>
          </SettingsCard>
        </div>

        {/* Live Preview */}
        <SettingsCard>
          <SettingsCardHeader 
            icon={Eye} 
            title="Live Preview" 
            description="See how your theme looks in a miniature application" 
          />
          <SettingsCardBody>
            <ThemePreview />
          </SettingsCardBody>
        </SettingsCard>

        {/* App Bar & Regional Settings */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <SettingsCard>
            <SettingsCardHeader
              icon={PanelLeft}
              title="App bar"
              description="Where the theme, account, and notification icons sit"
            />
            <SettingsCardBody>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {navbarPositions.map((pos) => (
                  <button
                    key={pos.value}
                    type="button"
                    onClick={() => handleNavbarPositionChange(pos.value)}
                    aria-label={`Select ${pos.name} app bar position`}
                    aria-pressed={preferences.navbar_position === pos.value}
                    className={cn(
                      "group rounded-xl p-1 text-left transition-all duration-200",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      preferences.navbar_position === pos.value
                        ? "ring-2 ring-[var(--color-accent-custom,#22C55E)] ring-offset-2 ring-offset-background scale-[1.02]"
                        : "hover:scale-[1.02] hover:shadow-sm"
                    )}
                  >
                    <div className="relative h-24 rounded-lg border border-border bg-muted/40 mb-2 p-2.5 overflow-hidden transition-all duration-200">
                      {pos.value === "left" ? (
                        <div className="flex h-full gap-1.5">
                          <div className="w-2.5 rounded bg-white border border-gray-200 dark:bg-[#162232] dark:border-transparent transition-colors duration-200" />
                          <div className="w-5 rounded bg-[#1E2A3B] flex flex-col gap-1 p-1">
                            <div className="h-1 rounded-sm bg-[var(--color-accent-custom,#22C55E)]/80" />
                            <div className="h-1 rounded-sm bg-white/30" />
                            <div className="h-1 rounded-sm bg-white/20" />
                          </div>
                          <div className="flex-1 rounded bg-background border border-border/60 transition-colors duration-200" />
                        </div>
                      ) : (
                        <div className="flex h-full gap-1.5">
                          <div className="w-5 rounded bg-[#1E2A3B] flex flex-col gap-1 p-1">
                            <div className="h-1 rounded-sm bg-[var(--color-accent-custom,#22C55E)]/80" />
                            <div className="h-1 rounded-sm bg-white/30" />
                            <div className="h-1 rounded-sm bg-white/20" />
                          </div>
                          <div className="flex flex-1 flex-col gap-1.5 min-h-0">
                            <div className="h-2.5 rounded bg-white border border-gray-200 dark:bg-[#162232] dark:border-transparent transition-colors duration-200" />
                            <div className="flex-1 rounded bg-background border border-border/60 transition-colors duration-200" />
                          </div>
                        </div>
                      )}
                      {preferences.navbar_position === pos.value && (
                        <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[var(--color-accent-custom,#22C55E)] flex items-center justify-center animate-in zoom-in-50 duration-200">
                          <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 px-1">
                      <pos.icon
                        className={cn(
                          "h-3.5 w-3.5 transition-colors duration-200",
                          preferences.navbar_position === pos.value
                            ? "text-[var(--color-accent-custom,#22C55E)]"
                            : "text-muted-foreground group-hover:text-foreground"
                        )}
                      />
                      <span
                        className={cn(
                          "text-xs font-medium transition-colors duration-200",
                          preferences.navbar_position === pos.value
                            ? "text-[var(--color-accent-custom,#22C55E)]"
                            : "text-muted-foreground group-hover:text-foreground"
                        )}
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

        {/* Advanced Customization */}
        <div className="border-t pt-6">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            type="button"
            aria-expanded={showAdvanced}
            aria-controls="advanced-customization"
            className="w-full flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center">
                <Settings className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-medium">Advanced Customization</h3>
                <p className="text-xs text-muted-foreground">
                  Fine-tune interface behavior and accessibility
                </p>
              </div>
            </div>
            <ChevronRight
              className={cn(
                "h-5 w-5 text-muted-foreground transition-transform duration-200",
                showAdvanced && "rotate-90"
              )}
            />
          </button>

          {showAdvanced && (
            <div id="advanced-customization" className="mt-4 space-y-4 animate-in fade-in-50 slide-in-from-top-2 duration-300" role="region" aria-label="Advanced customization options">
              <SettingsCard>
                <SettingsCardHeader
                  icon={Monitor}
                  title="Interface Preferences"
                  description="Density, motion, and accessibility"
                />
                <SettingsCardBody className="py-2">
                  {/* Compact mode */}
                  <SettingsToggleRow
                    title="Compact mode"
                    description="Show more information in less space"
                    checked={!!preferences.compact_mode}
                    onChange={() => handleToggle("compact_mode")}
                  />

                  {/* Smooth animations */}
                  <SettingsToggleRow
                    title="Smooth animations"
                    description="Enable interface transitions"
                    checked={!!preferences.smooth_animations}
                    onChange={() => handleToggle("smooth_animations")}
                  />

                  {/* High Contrast */}
                  <SettingsToggleRow
                    title="High contrast"
                    description="Boost border and text contrast app-wide for better visibility."
                    checked={!!preferences.high_contrast}
                    onChange={() => handleToggle("high_contrast")}
                  />

                  {/* Keyboard Navigation */}
                  <div className="py-3 border-b border-border/60 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-foreground">
                        Keyboard Navigation
                      </label>
                      <span className="text-xs px-2 py-0.5 rounded-md bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20">
                        Always on
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Use Tab, Arrow keys, Enter, and Escape to navigate. Focus indicators are always visible.
                    </p>
                  </div>

                  {/* Screen Reader Info */}
                  <div className="py-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-foreground">
                        Screen Reader Support
                      </label>
                      <span className="text-xs px-2 py-0.5 rounded-md bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20">
                        Always on
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Khata includes ARIA labels and semantic HTML for screen reader compatibility.
                    </p>
                  </div>
                </SettingsCardBody>
              </SettingsCard>

              <SettingsCard>
                <SettingsCardHeader
                  icon={Square}
                  title="Border Radius"
                  description="Adjust corner rounding across every card, button, and input"
                />
                <SettingsCardBody>
                  <div className="grid grid-cols-5 gap-3">
                    {BORDER_RADIUS_OPTIONS.map((option) => {
                      const isActive =
                        (preferences.border_radius || BORDER_RADIUS_PRESETS.default) === option.value;
                      return (
                        <button
                          key={option.name}
                          type="button"
                          onClick={() => handleBorderRadiusChange(option.value)}
                          aria-label={`Select ${option.name} border radius`}
                          aria-pressed={isActive}
                          className={cn(
                            "group flex flex-col items-center gap-2 rounded-xl p-3 transition-all duration-200",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                            isActive
                              ? "ring-2 ring-[var(--color-accent-custom,#22C55E)] ring-offset-2 ring-offset-background bg-muted/50"
                              : "hover:bg-muted/50"
                          )}
                        >
                          <span
                            className="h-9 w-9 border-2 border-foreground/40 bg-background"
                            style={{ borderRadius: option.value }}
                            aria-hidden="true"
                          />
                          <span
                            className={cn(
                              "text-xs font-medium",
                              isActive ? "text-[var(--color-accent-custom,#22C55E)]" : "text-muted-foreground"
                            )}
                          >
                            {option.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {preferences.border_radius && (
                    <div className="mt-6 pt-4 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleBorderRadiusChange("")}
                        className="text-xs h-8 transition-all duration-200 hover:scale-105"
                      >
                        <XCircle className="h-3 w-3 mr-1.5" />
                        Reset to default radius
                      </Button>
                    </div>
                  )}
                </SettingsCardBody>
              </SettingsCard>
            </div>
          )}
        </div>

        {/* Reset to Defaults */}
        <div className="pt-6 border-t">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-sm font-medium">Reset to defaults</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Restore all appearance settings to their original values
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={isResetting}
              className="gap-2 transition-all duration-200 hover:scale-105 disabled:hover:scale-100"
              aria-label="Reset all appearance settings to default values"
            >
              <RotateCcw className={cn(
                "h-3.5 w-3.5 transition-transform duration-300",
                isResetting && "animate-spin"
              )} />
              {isResetting ? "Resetting..." : "Reset All"}
            </Button>
          </div>
        </div>
      </SettingsPageContent>
    </SettingsPageShell>
  );
}
