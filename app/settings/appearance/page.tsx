"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Palette, Globe, Monitor, Sun, Moon, Laptop, ChevronDown, Loader2 } from "lucide-react";
import { userApi } from "@/lib/api/user";
import type { AppearancePreferences } from "@/lib/types/user";
import toast from "react-hot-toast";

export default function AppearancePage() {
  const [preferences, setPreferences] = useState<AppearancePreferences>({
    theme: 'light',
    language: 'en-US',
    timezone: 'UTC',
    compact_mode: false,
    smooth_animations: true,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const prefs = await userApi.getAppearancePreferences();
      setPreferences(prefs);
    } catch (error) {
      console.error("Failed to load preferences:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleThemeChange = async (theme: 'light' | 'dark' | 'system') => {
    // Optimistic update
    setPreferences(prev => ({ ...prev, theme }));

    try {
      await userApi.updateAppearancePreferences({ theme });
      toast.success("Theme updated", {
        style: { borderRadius: '12px', background: '#111827', color: '#fff' }
      });
    } catch (error) {
      // Revert on error
      setPreferences(prev => ({ ...prev, theme: preferences.theme }));
      toast.error("Failed to update theme", {
        style: { borderRadius: '12px', background: '#111827', color: '#fff' }
      });
    }
  };

  const handleLanguageChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const language = e.target.value as AppearancePreferences['language'];
    
    // Optimistic update
    setPreferences(prev => ({ ...prev, language }));

    try {
      await userApi.updateAppearancePreferences({ language });
      toast.success("Language updated", {
        style: { borderRadius: '12px', background: '#111827', color: '#fff' }
      });
    } catch (error) {
      // Revert on error
      setPreferences(prev => ({ ...prev, language: preferences.language }));
      toast.error("Failed to update language", {
        style: { borderRadius: '12px', background: '#111827', color: '#fff' }
      });
    }
  };

  const handleTimezoneChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const timezone = e.target.value;
    
    // Optimistic update
    setPreferences(prev => ({ ...prev, timezone }));

    try {
      await userApi.updateAppearancePreferences({ timezone });
      toast.success("Timezone updated", {
        style: { borderRadius: '12px', background: '#111827', color: '#fff' }
      });
    } catch (error) {
      // Revert on error
      setPreferences(prev => ({ ...prev, timezone: preferences.timezone }));
      toast.error("Failed to update timezone", {
        style: { borderRadius: '12px', background: '#111827', color: '#fff' }
      });
    }
  };

  const handleToggle = async (key: 'compact_mode' | 'smooth_animations') => {
    const newValue = !preferences[key];
    
    // Optimistic update
    setPreferences(prev => ({ ...prev, [key]: newValue }));

    try {
      await userApi.updateAppearancePreferences({ [key]: newValue });
      toast.success("Preference updated", {
        style: { borderRadius: '12px', background: '#111827', color: '#fff' }
      });
    } catch (error) {
      // Revert on error
      setPreferences(prev => ({ ...prev, [key]: !newValue }));
      toast.error("Failed to update preference", {
        style: { borderRadius: '12px', background: '#111827', color: '#fff' }
      });
    }
  };
  return (
    <main className="min-h-screen bg-[#FDFDFD] text-[#111827] selection:bg-[#22C55E]/20">
      <div className="max-w-[850px] mx-auto px-6 py-16">
        
        {/* Navigation & Header */}
        <div className="mb-12">
          <Link
            href="/settings"
            className="group inline-flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-[#22C55E] transition-all mb-6"
          >
            <div className="p-1.5 rounded-lg bg-gray-50 group-hover:bg-[#22C55E]/10">
              <ArrowLeft className="h-4 w-4 stroke-[3px]" />
            </div>
            Back to Settings
          </Link>
          <h1 className="text-4xl font-black tracking-tight text-gray-900">Appearance</h1>
          <p className="text-gray-500 font-medium mt-2 leading-relaxed">
            Personalize your workspace visual density and interface theme.
          </p>
        </div>

        <div className="space-y-8">
          
          {/* Section: Interface Theme */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#22C55E]/10 flex items-center justify-center">
                <Palette className="h-4 w-4 text-[#22C55E]" strokeWidth={2.5} />
              </div>
              <h2 className="text-[16px] font-bold text-gray-900">Interface Theme</h2>
            </div>

            <div className="p-8">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-[#22C55E]" />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { name: "Light", value: "light" as const, icon: Sun, colors: "bg-white border-gray-200" },
                    { name: "Dark", value: "dark" as const, icon: Moon, colors: "bg-gray-900 border-gray-800" },
                    { name: "System", value: "system" as const, icon: Laptop, colors: "bg-gradient-to-br from-white via-gray-100 to-gray-400 border-gray-200" },
                  ].map((theme) => (
                    <button
                      key={theme.name}
                      onClick={() => handleThemeChange(theme.value)}
                      className={`group relative p-1 rounded-xl transition-all duration-300 ${
                        preferences.theme === theme.value ? "ring-2 ring-[#22C55E] ring-offset-2" : "hover:scale-[1.02]"
                      }`}
                    >
                      <div className={`h-24 rounded-lg border flex items-center justify-center mb-3 shadow-sm ${theme.colors}`}>
                        <theme.icon className={`h-6 w-6 ${preferences.theme === theme.value ? "text-[#22C55E]" : "text-gray-400 group-hover:text-gray-600"}`} />
                      </div>
                      <span className={`text-sm font-bold ${preferences.theme === theme.value ? "text-[#22C55E]" : "text-gray-500"}`}>
                        {theme.name}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Section: Localization */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.04)]">
            <div className="p-6 border-b border-gray-50 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#22C55E]/10 flex items-center justify-center">
                <Globe className="h-4 w-4 text-[#22C55E]" strokeWidth={2.5} />
              </div>
              <h2 className="text-[16px] font-bold text-gray-900">Regional Settings</h2>
            </div>

            <div className="p-8 space-y-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-[#22C55E]" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-gray-400 uppercase tracking-wider">Language</label>
                    <div className="relative">
                      <select 
                        value={preferences.language}
                        onChange={handleLanguageChange}
                        className="w-full appearance-none bg-gray-50 border border-gray-100 text-sm font-semibold rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#22C55E]/20 focus:border-[#22C55E] transition-all"
                      >
                        <option value="en-US">English (US)</option>
                        <option value="en-GB">English (UK)</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                        <option value="hi">Hindi</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-gray-400 uppercase tracking-wider">Timezone</label>
                    <div className="relative">
                      <select 
                        value={preferences.timezone}
                        onChange={handleTimezoneChange}
                        className="w-full appearance-none bg-gray-50 border border-gray-100 text-sm font-semibold rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#22C55E]/20 focus:border-[#22C55E] transition-all"
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
                        <option value="Asia/Singapore">Singapore (GMT+8:00)</option>
                        <option value="Asia/Tokyo">Tokyo (GMT+9:00)</option>
                        <option value="Australia/Sydney">Sydney (GMT+10:00)</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Section: Display Density */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.04)]">
            <div className="p-6 border-b border-gray-50 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#22C55E]/10 flex items-center justify-center">
                <Monitor className="h-4 w-4 text-[#22C55E]" strokeWidth={2.5} />
              </div>
              <h2 className="text-[16px] font-bold text-gray-900">Display Density</h2>
            </div>

            <div className="p-8 space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-[#22C55E]" />
                </div>
              ) : (
                <>
                  {[
                    { title: "Compact Mode", sub: "Maximize information density for expert users.", key: 'compact_mode' as const },
                    { title: "Smooth Animations", sub: "Enable hardware-accelerated interface transitions.", key: 'smooth_animations' as const },
                  ].map((toggle) => (
                    <div key={toggle.title} className="flex items-center justify-between group cursor-pointer p-2 -mx-2 rounded-xl hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col">
                        <span className="text-[15px] font-bold text-gray-900 leading-tight">{toggle.title}</span>
                        <span className="text-[13px] text-gray-500 font-medium mt-0.5">{toggle.sub}</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={preferences[toggle.key]}
                          onChange={() => handleToggle(toggle.key)}
                        />
                        <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#22C55E]"></div>
                      </label>
                    </div>
                  ))}
                </>
              )}
            </div>
          </section>

        </div>

        {/* Footer info */}
        <p className="mt-12 text-center text-[11px] font-black text-gray-300 uppercase tracking-[0.3em]">
          Appearance Settings • Workspace 2026
        </p>
      </div>
    </main>
  );
}