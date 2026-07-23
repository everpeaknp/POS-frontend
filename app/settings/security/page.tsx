"use client";

import { useState, useEffect } from "react";
import {
  Key,
  Smartphone,
  Monitor,
  Trash2,
  MapPin,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { userApi } from "@/lib/api/user";
import type { Session } from "@/lib/types/user";
import { useAuth } from "@/lib/context/AuthContext";
import toast from "react-hot-toast";
import { SettingsPageShell } from "@/components/settings/SettingsPageShell";
import {
  SettingsCard,
  SettingsCardBody,
  SettingsCardHeader,
  SettingsField,
  SettingsNotice,
  SettingsPageContent,
  settingsInputClass,
} from "@/components/settings/settings-ui";

export default function SecurityPage() {
  const { logout, user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const data = await userApi.getSessions();
      setSessions(data);
    } catch {
      toast.error("Failed to load sessions");
    } finally {
      setSessionsLoading(false);
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
      await userApi.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      toast.success("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: Record<string, string[]> & { detail?: string } };
      };
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

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await userApi.revokeSession(sessionId);
      toast.success("Session revoked");
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch {
      toast.error("Failed to revoke session");
    }
  };

  const handleRevokeOthers = async () => {
    try {
      const result = await userApi.revokeOtherSessions();
      toast.success(result.message);
      await loadSessions();
    } catch {
      toast.error("Failed to revoke sessions");
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
      const err = error as {
        response?: { data?: { password?: string[]; detail?: string } };
      };
      toast.error(
        err.response?.data?.password?.[0] ||
          err.response?.data?.detail ||
          "Failed to delete account"
      );
    } finally {
      setDeleting(false);
    }
  };

  const getDeviceIcon = (device: string) => {
    if (
      device.toLowerCase().includes("iphone") ||
      device.toLowerCase().includes("mobile")
    ) {
      return Smartphone;
    }
    return Monitor;
  };

  return (
    <SettingsPageShell
      title="Security"
      subtitle="Password, active sessions, and account deletion"
      loading={sessionsLoading}
      loadingMessage="Loading security settings…"
    >
      <SettingsPageContent>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 xl:items-stretch">
          <SettingsCard className="xl:col-span-2">
            <SettingsCardHeader
              icon={Key}
              title="Change password"
              description="Use a strong password with at least 8 characters"
            />
            <SettingsCardBody>
              <form
                onSubmit={handlePasswordChange}
                className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl"
                autoComplete="on"
              >
                {/* Gives password managers a username target so they don't fill the sidebar search */}
                <input
                  type="text"
                  name="username"
                  autoComplete="username"
                  value={user?.email || user?.username || ""}
                  readOnly
                  tabIndex={-1}
                  aria-hidden
                  className="sr-only"
                />
                <div className="md:col-span-2">
                  <SettingsField label="Current password">
                    <input
                      type="password"
                      name="current-password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className={settingsInputClass}
                      autoComplete="current-password"
                      required
                    />
                  </SettingsField>
                </div>
                <SettingsField label="New password" hint="Minimum 8 characters">
                  <input
                    type="password"
                    name="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className={settingsInputClass}
                    autoComplete="new-password"
                    required
                  />
                </SettingsField>
                <SettingsField label="Confirm new password">
                  <input
                    type="password"
                    name="confirm-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className={settingsInputClass}
                    autoComplete="new-password"
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

          <SettingsCard variant="danger" className="xl:h-full flex flex-col">
            <SettingsCardHeader
              variant="danger"
              icon={Trash2}
              title="Delete account"
              description="This cannot be undone"
            />
            <SettingsCardBody className="flex flex-1 flex-col justify-between gap-5">
              <p className="text-sm leading-relaxed text-red-800/80 dark:text-red-300/80">
                Deactivates your account immediately, signs you out, and revokes all sessions.
                Restoring access requires admin help.
              </p>
              <div className="space-y-3">
                <SettingsField label="Confirm with password">
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    className={settingsInputClass}
                    autoComplete="current-password"
                  />
                </SettingsField>
                <Button
                  variant="destructive"
                  className="w-full h-10"
                  onClick={handleDeleteAccount}
                  disabled={deleting || !deletePassword}
                >
                  {deleting ? "Deleting..." : "Delete account"}
                </Button>
              </div>
            </SettingsCardBody>
          </SettingsCard>
        </div>

        <SettingsCard>
          <SettingsCardHeader
            icon={Monitor}
            title="Active sessions"
            description="Review devices where you are signed in and revoke unknown access"
          />
          <SettingsCardBody className="p-0">
            {sessions.length === 0 ? (
              <div className="py-16 text-center text-sm text-muted-foreground">
                No active sessions found
              </div>
            ) : (
              <div className="divide-y divide-border">
                {sessions.map((session) => {
                  const Icon = getDeviceIcon(session.device);
                  const lastActive = new Date(session.last_active).toLocaleString();

                  return (
                    <div
                      key={session.id}
                      className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-accent/60 transition-colors"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-11 h-11 rounded-lg bg-muted border border-border flex items-center justify-center text-muted-foreground shrink-0">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium text-foreground">
                              {session.device}
                            </p>
                            {session.is_current && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[#22C55E] bg-[#22C55E]/10 rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
                                Current
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {session.location}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Activity className="w-3 h-3" /> {session.ip_address}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground/80 mt-1">
                            Last active: {lastActive}
                          </p>
                        </div>
                      </div>

                      {!session.is_current && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRevokeSession(session.id)}
                          className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10 shrink-0"
                          aria-label="Revoke session"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {sessions.length > 1 && (
              <div className="px-6 py-4 border-t border-border bg-muted/40">
                <Button
                  variant="ghost"
                  className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                  onClick={handleRevokeOthers}
                >
                  Sign out all other sessions
                </Button>
              </div>
            )}
          </SettingsCardBody>
        </SettingsCard>

        <SettingsNotice variant="warning">
          If you see a device you do not recognize, revoke it immediately and change your
          password above.
        </SettingsNotice>
      </SettingsPageContent>
    </SettingsPageShell>
  );
}
