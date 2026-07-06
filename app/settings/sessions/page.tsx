"use client";

import { useState, useEffect } from "react";
import { Monitor, Smartphone, Trash2, MapPin, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { userApi } from "@/lib/api/user";
import type { Session } from "@/lib/types/user";
import toast from "react-hot-toast";
import { SettingsPageShell } from "@/components/settings/SettingsPageShell";
import {
  SettingsCard,
  SettingsCardBody,
  SettingsCardHeader,
  SettingsNotice,
  SettingsPageContent,
} from "@/components/settings/settings-ui";

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const data = await userApi.getSessions();
      setSessions(data);
    } catch (error) {
      console.error("Failed to load sessions:", error);
      toast.error("Failed to load sessions");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await userApi.revokeSession(sessionId);
      toast.success("Session revoked");
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (error) {
      console.error("Failed to revoke session:", error);
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

  const getDeviceIcon = (device: string) => {
    if (device.toLowerCase().includes("iphone") || device.toLowerCase().includes("mobile")) {
      return Smartphone;
    }
    return Monitor;
  };

  return (
    <SettingsPageShell
      title="Sessions"
      subtitle="Devices and browsers where you are currently signed in"
      loading={isLoading}
      loadingMessage="Loading active sessions…"
    >
      <SettingsPageContent>
        <SettingsCard>
          <SettingsCardHeader
            icon={Monitor}
            title="Active sessions"
            description="Review and revoke access from unknown devices"
          />
          <SettingsCardBody className="p-0">
            {sessions.length === 0 ? (
              <div className="py-16 text-center text-sm text-muted-foreground">No active sessions found</div>
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
                            <p className="text-sm font-medium text-foreground">{session.device}</p>
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
                          <p className="text-xs text-muted-foreground/80 mt-1">Last active: {lastActive}</p>
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
          If you see a device you do not recognize, revoke it immediately and change your password in Security settings.
        </SettingsNotice>
      </SettingsPageContent>
    </SettingsPageShell>
  );
}
