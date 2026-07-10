"use client";

import { useState, useEffect } from "react";
import { Key, Shield, Smartphone, ChevronRight, Fingerprint } from "lucide-react";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { userApi } from "@/lib/api/user";
import type { NotificationPreferences } from "@/lib/types/user";
import toast from "react-hot-toast";
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

export default function SecurityPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [prefsLoading, setPrefsLoading] = useState(true);
  const [securityPrefs, setSecurityPrefs] = useState<Pick<NotificationPreferences, "login_alerts" | "security_log_exports">>({
    login_alerts: true,
    security_log_exports: false,
  });

  useEffect(() => {
    userApi.getNotificationPreferences()
      .then((prefs) => {
        setSecurityPrefs({
          login_alerts: prefs.login_alerts,
          security_log_exports: prefs.security_log_exports,
        });
      })
      .catch(() => toast.error("Failed to load security preferences"))
      .finally(() => setPrefsLoading(false));
  }, []);

  const handleSecurityToggle = async (key: "login_alerts" | "security_log_exports") => {
    const newValue = !securityPrefs[key];
    setSecurityPrefs((prev) => ({ ...prev, [key]: newValue }));
    try {
      await userApi.updateNotificationPreferences({ [key]: newValue });
      toast.success("Preference updated");
    } catch {
      setSecurityPrefs((prev) => ({ ...prev, [key]: !newValue }));
      toast.error("Failed to update preference");
    }
  };

  const handlePasswordChange = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    setIsLoading(true);
    try {
      await userApi.changePassword({ current_password: currentPassword, new_password: newPassword });
      toast.success("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: unknown) {
      const err = error as { response?: { data?: Record<string, string[]> & { detail?: string } } };
      const errorMessage =
        err.response?.data?.current_password?.[0] ||
        err.response?.data?.new_password?.[0] ||
        err.response?.data?.detail ||
        "Failed to change password";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SettingsPageShell
      title="Security"
      subtitle="Password, two-factor authentication, and session management"
      loading={prefsLoading}
      loadingMessage="Loading security settings…"
    >
      <SettingsPageContent>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <SettingsCard className="xl:col-span-2">
            <SettingsCardHeader icon={Key} title="Change password" description="Use a strong password with at least 8 characters" />
            <SettingsCardBody>
              <form onSubmit={handlePasswordChange} className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl">
                <div className="md:col-span-2">
                  <SettingsField label="Current password">
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className={settingsInputClass}
                      required
                    />
                  </SettingsField>
                </div>
                <SettingsField label="New password" hint="Minimum 8 characters">
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className={settingsInputClass}
                    required
                  />
                </SettingsField>
                <SettingsField label="Confirm new password">
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className={settingsInputClass}
                    required
                  />
                </SettingsField>
                <div className="md:col-span-2 pt-2">
                  <Button type="submit" disabled={isLoading}>
                    
                    {isLoading ? "Updating..." : "Update password"}
                  </Button>
                </div>
              </form>
            </SettingsCardBody>
          </SettingsCard>

          <div className="space-y-6">
            <SettingsCard>
              <SettingsCardBody className="space-y-4">
                <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
                  <Smartphone className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Multi-factor authentication</h3>
                  <p className="text-xs text-gray-500 mt-1">Add an extra layer of security to your account.</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => toast("2FA setup is coming soon")}
                >
                  Configure 2FA
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </SettingsCardBody>
            </SettingsCard>

            <SettingsCard>
              <SettingsCardBody className="space-y-4">
                <div className="w-10 h-10 rounded-lg bg-[#22C55E]/10 flex items-center justify-center">
                  <Fingerprint className="h-5 w-5 text-[#22C55E]" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Active sessions</h3>
                  <p className="text-xs text-gray-500 mt-1">Review devices where you are signed in.</p>
                </div>
                <Link
                  href="/settings/sessions"
                  className="inline-flex w-full h-9 items-center justify-between rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  View sessions
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </SettingsCardBody>
            </SettingsCard>
          </div>
        </div>

        <SettingsCard>
          <SettingsCardHeader icon={Shield} title="Security notifications" description="Alerts about sign-ins and account activity" />
          <SettingsCardBody className="py-2">
            <>
              <SettingsToggleRow
                title="Login alerts"
                description="Email me when a new device signs in"
                checked={securityPrefs.login_alerts}
                onChange={() => handleSecurityToggle("login_alerts")}
              />
              <SettingsToggleRow
                title="Security log exports"
                description="Weekly summary of security-related actions"
                checked={securityPrefs.security_log_exports}
                onChange={() => handleSecurityToggle("security_log_exports")}
              />
            </>
          </SettingsCardBody>
        </SettingsCard>
      </SettingsPageContent>
    </SettingsPageShell>
  );
}
