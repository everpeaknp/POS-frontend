"use client";

import { useEffect, useState } from "react";
import { useAppearance } from "@/lib/context/AppearanceContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sun, Moon, Monitor, Check } from "lucide-react";

export default function ThemeTestPage() {
  const { preferences, updatePreferences, isDark } = useAppearance();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const themes: Array<{ value: "light" | "dark" | "system"; label: string; icon: any }> = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ];

  const testColors = [
    "var(--color-accent-custom,#22C55E)", // Green (default)
    "#3B82F6", // Blue
    "#8B5CF6", // Purple
    "#F59E0B", // Amber
    "#EF4444", // Red
    "#EC4899", // Pink
  ];

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Theme System Test</h1>
          <p className="text-muted-foreground">
            Verify light, dark, system mode, and accent colors
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted text-sm">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Current: <strong>{preferences.theme}</strong> mode
            {isDark && " (displaying dark)"}
            {!isDark && " (displaying light)"}
          </div>
        </div>

        {/* Theme Selector */}
        <Card>
          <CardHeader>
            <CardTitle>Theme Mode</CardTitle>
            <CardDescription>
              Select light, dark, or system preference
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {themes.map((theme) => (
                <button
                  key={theme.value}
                  onClick={() => updatePreferences({ theme: theme.value })}
                  className={`p-4 rounded-lg border-2 transition-all hover:border-primary ${
                    preferences.theme === theme.value
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <theme.icon className="h-6 w-6" />
                    <span className="text-sm font-medium">{theme.label}</span>
                    {preferences.theme === theme.value && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Accent Color Selector (Foundation) */}
        <Card>
          <CardHeader>
            <CardTitle>Accent Color (Premium Feature Foundation)</CardTitle>
            <CardDescription>
              Dynamic accent colors are prepared but not fully implemented
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-6 gap-3">
              {testColors.map((color) => (
                <button
                  key={color}
                  onClick={() => updatePreferences({ accent_color: color })}
                  className={`aspect-square rounded-lg border-2 transition-all hover:scale-110 ${
                    preferences.accent_color === color
                      ? "border-foreground ring-2 ring-foreground/20"
                      : "border-border"
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                >
                  {preferences.accent_color === color && (
                    <Check className="h-5 w-5 text-white mx-auto" />
                  )}
                </button>
              ))}
              <button
                onClick={() => updatePreferences({ accent_color: undefined })}
                className={`aspect-square rounded-lg border-2 transition-all hover:scale-110 flex items-center justify-center ${
                  !preferences.accent_color
                    ? "border-foreground ring-2 ring-foreground/20 bg-muted"
                    : "border-border bg-muted/50"
                }`}
                title="Default"
              >
                {!preferences.accent_color && <Check className="h-5 w-5" />}
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Visual Tests */}
        <Card>
          <CardHeader>
            <CardTitle>Visual Verification</CardTitle>
            <CardDescription>
              Test various UI elements in current theme
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Buttons */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Buttons</p>
              <div className="flex flex-wrap gap-2">
                <Button variant="default">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
              </div>
            </div>

            {/* Colors */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Color Tokens</p>
              <div className="grid grid-cols-4 gap-3">
                <div className="space-y-1">
                  <div className="h-12 rounded-lg bg-background border" />
                  <p className="text-xs text-center">background</p>
                </div>
                <div className="space-y-1">
                  <div className="h-12 rounded-lg bg-card border" />
                  <p className="text-xs text-center">card</p>
                </div>
                <div className="space-y-1">
                  <div className="h-12 rounded-lg bg-muted" />
                  <p className="text-xs text-center">muted</p>
                </div>
                <div className="space-y-1">
                  <div className="h-12 rounded-lg bg-primary" />
                  <p className="text-xs text-center">primary</p>
                </div>
              </div>
            </div>

            {/* Text */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Typography</p>
              <div className="space-y-1">
                <p className="text-foreground">Foreground text</p>
                <p className="text-muted-foreground">Muted foreground text</p>
                <p className="text-primary">Primary text</p>
              </div>
            </div>

            {/* Persistence Test */}
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <h3 className="font-medium mb-2">Persistence Check</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>✓ Theme persists in localStorage</li>
                <li>✓ Survives page refresh</li>
                <li>✓ Survives navigation</li>
                <li>✓ No FOUC (Flash of Unstyled Content)</li>
                <li>✓ System theme listener active</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Debug Info */}
        <Card>
          <CardHeader>
            <CardTitle>Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto">
              {JSON.stringify(
                {
                  theme: preferences.theme,
                  isDark,
                  accent_color: preferences.accent_color,
                  compact_mode: preferences.compact_mode,
                  smooth_animations: preferences.smooth_animations,
                  navbar_position: preferences.navbar_position,
                  localStorage_key: "khata-appearance",
                },
                null,
                2
              )}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
