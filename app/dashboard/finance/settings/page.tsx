"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { tenantApi } from "@/lib/api/tenant";
import toast from "react-hot-toast";
import { Save, User, DollarSign, Download, Trash2, AlertTriangle, Play } from "lucide-react";
import { DashHeader } from "@/components/dashboard/dash-header";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ProfilePhotoUpload } from "@/components/profile-photo-upload";
import { DateSystemPreferenceCard } from "@/components/settings/DateSystemPreferenceCard";
import { getMediaUrl } from "@/lib/utils";
import { useOnboarding } from "@/lib/context/OnboardingContext";
import {
  getPreferences,
  setPreferencesForScope,
  exportAllData,
  clearAllData,
  DEFAULT_PREFERENCES,
  type PFPreferences,
} from "@/lib/personal-finance/store";

const CURRENCIES = [
  { value: "NPR", label: "NPR - Nepalese Rupee" },
  { value: "USD", label: "USD - US Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - British Pound" },
  { value: "INR", label: "INR - Indian Rupee" },
  { value: "AUD", label: "AUD - Australian Dollar" },
  { value: "CAD", label: "CAD - Canadian Dollar" },
];

const TIMEZONES = [
  { value: "Asia/Kathmandu", label: "Asia/Kathmandu (UTC+5:45)" },
  { value: "UTC", label: "UTC (UTC+0:00)" },
  { value: "America/New_York", label: "America/New_York (EST/EDT)" },
  { value: "Europe/London", label: "Europe/London (GMT/BST)" },
  { value: "Asia/Kolkata", label: "Asia/Kolkata (IST)" },
  { value: "Australia/Sydney", label: "Australia/Sydney (AEST/AEDT)" },
];

export default function PersonalFinanceSettingsPage() {
  const { user, updateUser, refreshUser } = useAuth();
  const { startTour } = useOnboarding();
  const scope = user?.tenant?.slug ?? null;

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    workspaceName: "",
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [existingAvatarUrl, setExistingAvatarUrl] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<PFPreferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    if (user) {
      setProfile({
        firstName: user.first_name || "",
        lastName: user.last_name || "",
        phone: user.phone || "",
        workspaceName: user.tenant?.workspace_name || user.tenant?.name || "",
      });
      setExistingAvatarUrl(getMediaUrl(user.avatar));
      setAvatarFile(null);
      setRemoveAvatar(false);
    }
  }, [user]);

  useEffect(() => {
    setPrefs(getPreferences(scope));
  }, [scope]);

  const workspaceName = user?.tenant?.workspace_name || user?.tenant?.name || "Workspace";
  const subtitle = `${workspaceName} · Preferences for your personal finance`;

  const handleSaveProfile = async () => {
    if (!profile.firstName.trim()) {
      toast.error("First name is required");
      return;
    }
    setSavingProfile(true);
    try {
      await Promise.all([
        updateUser({
          first_name: profile.firstName,
          last_name: profile.lastName,
          phone: profile.phone,
          ...(avatarFile ? { avatar: avatarFile } : {}),
          ...(removeAvatar ? { remove_avatar: true } : {}),
        }),
        tenantApi.updateCurrent({ workspace_name: profile.workspaceName }),
      ]);
      await refreshUser();
      setAvatarFile(null);
      setRemoveAvatar(false);
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const initials =
    `${profile.firstName?.[0] || ""}${profile.lastName?.[0] || ""}`.trim() ||
    user?.username?.[0] ||
    "U";
  const displayAvatarUrl = removeAvatar ? null : existingAvatarUrl;

  const handleSavePrefs = () => {
    setSavingPrefs(true);
    setPreferencesForScope(scope, prefs);
    // localStorage write is synchronous; the toast just gives feedback
    setTimeout(() => {
      setSavingPrefs(false);
      toast.success("Preferences saved");
    }, 200);
  };

  const handleExport = () => {
    const snapshot = exportAllData(scope);
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `personal-finance-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success("Data exported");
  };

  const handleClearAll = () => {
    setClearing(true);
    clearAllData(scope);
    setPrefs(DEFAULT_PREFERENCES);
    setClearing(false);
    setShowClearConfirm(false);
    toast.success("All personal finance data cleared");
    // Every page reads from localStorage on mount via useSyncedList, so a
    // reload is the simplest way to make sure nothing is left showing stale
    // in-memory state from before the clear.
    window.location.reload();
  };

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Settings" subtitle={subtitle} />

      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Account Information */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <User className="h-4 w-4 text-[var(--color-accent-custom,#22C55E)]" />
              Account Information
            </h2>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="grid grid-cols-1 lg:grid-cols-[12rem_1fr] gap-8">
                <div className="flex justify-center lg:justify-start">
                  <ProfilePhotoUpload
                    layout="stacked"
                    align="center"
                    existingUrl={displayAvatarUrl}
                    initials={initials}
                    disabled={savingProfile}
                    onChange={(file) => {
                      setAvatarFile(file);
                      if (file) setRemoveAvatar(false);
                    }}
                    onRemove={() => setRemoveAvatar(true)}
                  />
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={profile.firstName}
                        onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                        placeholder="Your first name"
                        className="focus-visible:ring-0 focus-visible:border-input"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={profile.lastName}
                        onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                        placeholder="Your last name"
                        className="focus-visible:ring-0 focus-visible:border-input"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="phone">Phone Number</Label>
                      <PhoneInput
                        id="phone"
                        value={profile.phone}
                        onChange={(phone) => setProfile({ ...profile, phone })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" value={user?.email || ""} disabled className="bg-gray-50" />
                      <p className="text-xs text-gray-500">Contact support to change your login email</p>
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="workspaceName">Workspace Name</Label>
                      <Input
                        id="workspaceName"
                        value={profile.workspaceName}
                        onChange={(e) => setProfile({ ...profile, workspaceName: e.target.value })}
                        placeholder="e.g., My Finances"
                        className="focus-visible:ring-0 focus-visible:border-input"
                      />
                      <p className="text-xs text-gray-500">Shown in the sidebar and page headers</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 mt-4 border-t border-gray-100">
                <Button
                  onClick={handleSaveProfile}
                  disabled={savingProfile}
                  className="bg-[var(--color-accent-custom,#22C55E)] hover:bg-[var(--color-accent-custom-600,#16A34A)] text-white"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {savingProfile ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </section>

          {/* Currency & Formats */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-[var(--color-accent-custom,#22C55E)]" />
              Currency & Formats
            </h2>
            <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={prefs.currency} onValueChange={(v) => setPrefs({ ...prefs, currency: v ?? prefs.currency })}>
                    <SelectTrigger id="currency" className="w-full">
                      <SelectValue placeholder={CURRENCIES.find((c) => c.value === prefs.currency)?.label ?? "Select currency"} />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((curr) => (
                        <SelectItem key={curr.value} value={curr.value}>
                          {curr.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={prefs.timezone} onValueChange={(v) => setPrefs({ ...prefs, timezone: v ?? prefs.timezone })}>
                    <SelectTrigger id="timezone" className="w-full">
                      <SelectValue placeholder={TIMEZONES.find((t) => t.value === prefs.timezone)?.label ?? "Select timezone"} />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <p className="text-xs text-gray-500 -mt-2">
                Preferred currency and timezone for your personal finance (display only)
              </p>

              <div className="flex justify-end pt-2 border-t border-gray-100">
                <Button
                  onClick={handleSavePrefs}
                  disabled={savingPrefs}
                  className="bg-[var(--color-accent-custom,#22C55E)] hover:bg-[var(--color-accent-custom-600,#16A34A)] text-white"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {savingPrefs ? "Saving..." : "Save Preferences"}
                </Button>
              </div>
            </div>
          </section>

          {/* Date System (AD / BS) — shared app-wide preference, see DateSystemContext */}
          <section>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <DateSystemPreferenceCard variant="embedded" />
            </div>
          </section>

          {/* Data Management */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Download className="h-4 w-4 text-[var(--color-accent-custom,#22C55E)]" />
              Data Management
            </h2>
            <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">Export your data</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Download all your categories, accounts, transactions, budgets, and loans as JSON
                  </p>
                </div>
                <Button variant="outline" onClick={handleExport} className="shrink-0">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>

              <div className="flex items-center justify-between gap-4 pt-4 border-t border-gray-100">
                <div>
                  <p className="text-sm font-medium text-red-600">Clear all data</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Permanently erase all transactions, budgets, and loans, and reset categories/accounts to defaults
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowClearConfirm(true)}
                  className="shrink-0 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear Data
                </Button>
              </div>
            </div>
          </section>

          {/* Product Tour */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Play className="h-4 w-4 text-[var(--color-accent-custom,#22C55E)]" />
              Help & Onboarding
            </h2>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">Take the product tour</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Learn how to use Personal Finance with an interactive walkthrough
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    startTour();
                    toast.success("Product tour started!");
                  }}
                  className="shrink-0 border-[var(--color-accent-custom,#22C55E)] text-[var(--color-accent-custom,#22C55E)] hover:bg-[var(--color-accent-custom,#22C55E)]/10"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Tour
                </Button>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Clear All Data confirmation */}
      <Dialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Clear all data?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 py-2">
            This permanently deletes every transaction, budget, and loan you've recorded, and resets
            categories and accounts back to the starter defaults. This cannot be undone.
          </p>
          <div className="flex justify-end gap-2 border-t pt-4">
            <Button variant="outline" onClick={() => setShowClearConfirm(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleClearAll}
              disabled={clearing}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {clearing ? "Clearing..." : "Yes, clear everything"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
