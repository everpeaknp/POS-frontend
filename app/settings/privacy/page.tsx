"use client";

import { useState, useEffect } from "react";
import { Shield, Eye, Download, Trash2, ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { userApi } from "@/lib/api/user";
import type { PrivacyPreferences } from "@/lib/types/user";
import { useAuth } from "@/lib/context/AuthContext";
import toast from "react-hot-toast";
import { SettingsPageShell } from "@/components/settings/SettingsPageShell";
import {
  SettingsCard,
  SettingsCardBody,
  SettingsCardHeader,
  SettingsPageContent,
  SettingsToggleRow,
  settingsInputClass,
} from "@/components/settings/settings-ui";

export default function PrivacyPage() {
  const { logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [prefs, setPrefs] = useState<PrivacyPreferences>({
    profile_visibility: "organization",
    activity_status: true,
    search_indexing: false,
    data_retention_years: 1,
  });

  useEffect(() => {
    userApi.getPrivacyPreferences()
      .then(setPrefs)
      .catch(() => toast.error("Failed to load privacy settings"))
      .finally(() => setLoading(false));
  }, []);

  const updatePref = async (data: Partial<PrivacyPreferences>) => {
    const previous = prefs;
    setPrefs((prev) => ({ ...prev, ...data }));
    try {
      const updated = await userApi.updatePrivacyPreferences(data);
      setPrefs(updated);
      toast.success("Privacy settings saved");
    } catch {
      setPrefs(previous);
      toast.error("Failed to save privacy settings");
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const data = await userApi.exportUserData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "khata-user-export.json";
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Export downloaded");
    } catch {
      toast.error("Failed to export data");
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      toast.error("Enter your password to confirm deletion");
      return;
    }
    setDeleting(true);
    try {
      await userApi.deleteAccount(deletePassword);
      toast.success("Account deactivated");
      logout();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { password?: string[]; detail?: string } } };
      toast.error(err.response?.data?.password?.[0] || err.response?.data?.detail || "Failed to delete account");
    } finally {
      setDeleting(false);
    }
  };

  const selectClass = `${settingsInputClass} appearance-none pr-10 sm:w-48`;

  if (loading) {
    return (
      <SettingsPageShell title="Privacy" subtitle="Control visibility, data retention, and account deletion">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-[#22C55E]" />
        </div>
      </SettingsPageShell>
    );
  }

  return (
    <SettingsPageShell title="Privacy" subtitle="Control visibility, data retention, and account deletion">
      <SettingsPageContent>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <SettingsCard>
            <SettingsCardHeader icon={Shield} title="Privacy controls" description="Who can see your profile and activity" />
            <SettingsCardBody className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-100">
                <div>
                  <p className="text-sm font-medium text-gray-900">Profile visibility</p>
                  <p className="text-xs text-gray-500 mt-0.5">Who can view your business profile</p>
                </div>
                <div className="relative">
                  <select
                    className={selectClass}
                    value={prefs.profile_visibility}
                    onChange={(e) => updatePref({ profile_visibility: e.target.value as PrivacyPreferences["profile_visibility"] })}
                  >
                    <option value="everyone">Everyone</option>
                    <option value="organization">Organization only</option>
                    <option value="private">Private</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <SettingsToggleRow
                title="Activity status"
                description="Show when you are active in the workspace"
                checked={prefs.activity_status}
                onChange={() => updatePref({ activity_status: !prefs.activity_status })}
              />
              <SettingsToggleRow
                title="Search indexing"
                description="Allow your profile to appear in search results"
                checked={prefs.search_indexing}
                onChange={() => updatePref({ search_indexing: !prefs.search_indexing })}
              />
            </SettingsCardBody>
          </SettingsCard>

          <SettingsCard>
            <SettingsCardHeader icon={Eye} title="Data management" description="Export and retention settings" />
            <SettingsCardBody className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">Data retention</p>
                  <p className="text-xs text-gray-500 mt-0.5">Automatic cleanup of your activity logs</p>
                </div>
                <div className="relative sm:w-48">
                  <select
                    className={selectClass}
                    value={String(prefs.data_retention_years)}
                    onChange={(e) => updatePref({ data_retention_years: Number(e.target.value) as PrivacyPreferences["data_retention_years"] })}
                  >
                    <option value="1">1 year</option>
                    <option value="5">5 years</option>
                    <option value="0">Forever</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 p-4 rounded-lg bg-gray-50 border border-gray-100">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 bg-white rounded-lg border border-gray-100 text-gray-500 shrink-0">
                    <Download className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900">Download archive</p>
                    <p className="text-xs text-gray-500">Export all your account data as JSON</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting}>
                  {exporting ? "Preparing..." : "Download"}
                </Button>
              </div>
            </SettingsCardBody>
          </SettingsCard>
        </div>

        <SettingsCard variant="danger">
          <SettingsCardHeader
            variant="danger"
            icon={Trash2}
            title="Delete account"
            description="Permanently deactivate your account and revoke all sessions"
          />
          <SettingsCardBody>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="max-w-2xl space-y-3 flex-1">
                <p className="text-sm text-red-800/80">
                  This deactivates your account immediately. You will be signed out and will need admin help to restore access.
                </p>
                <Input
                  type="password"
                  placeholder="Enter your password to confirm"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                />
              </div>
              <Button variant="destructive" onClick={handleDeleteAccount} disabled={deleting}>
                {deleting ? "Deleting..." : "Delete account"}
              </Button>
            </div>
          </SettingsCardBody>
        </SettingsCard>
      </SettingsPageContent>
    </SettingsPageShell>
  );
}
