"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bell,
  Mail,
  Package,
  CreditCard,
  Users,
  AlertCircle,
  Shield,
  Smartphone,
  Volume2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { SettingsPageShell } from "@/components/settings/SettingsPageShell";
import {
  SettingsCard,
  SettingsCardBody,
  SettingsCardHeader,
  SettingsPageContent,
  SettingsToggleRow,
  SettingsNotice,
} from "@/components/settings/settings-ui";
import { useNotificationPreferences } from "@/lib/context/NotificationPreferencesContext";
import type { NotificationPreferences } from "@/lib/types/user";
import { notificationsAPI, type AppNotification } from "@/lib/api/notifications";
import {
  getBrowserNotificationPermission,
  getBrowserNotificationSupport,
  requestBrowserNotificationPermission,
} from "@/lib/notifications/browser";

const EMAIL_KEYS: Array<keyof NotificationPreferences> = [
  "email_order_updates",
  "email_payment_reminders",
  "email_inventory_alerts",
  "email_team_activity",
];

export default function NotificationsPage() {
  const { preferences, loading, savingKey, refresh, updatePreferences } =
    useNotificationPreferences();
  const [loadError, setLoadError] = useState<string | null>(null);
  const [recentNotifications, setRecentNotifications] = useState<AppNotification[]>([]);
  const [recentLoading, setRecentLoading] = useState(true);
  const [browserPermission, setBrowserPermission] = useState(
    getBrowserNotificationPermission()
  );

  useEffect(() => {
    setBrowserPermission(getBrowserNotificationPermission());
  }, [preferences.push_desktop]);

  const loadRecent = async () => {
    setRecentLoading(true);
    try {
      const data = await notificationsAPI.list();
      setRecentNotifications(data.slice(0, 5));
    } catch {
      setRecentNotifications([]);
    } finally {
      setRecentLoading(false);
    }
  };

  useEffect(() => {
    void refresh().catch(() => {
      setLoadError("Failed to load notification preferences");
    });
  }, [refresh]);

  useEffect(() => {
    if (!loading && !loadError) {
      void loadRecent();
    }
  }, [loading, loadError]);

  const handleRefresh = async () => {
    setLoadError(null);
    try {
      await refresh();
      await loadRecent();
    } catch {
      setLoadError("Failed to load notification preferences");
      toast.error("Failed to load notification preferences");
    }
  };

  const handleToggle = async (key: keyof NotificationPreferences) => {
    const newValue = !preferences[key];

    if (key === "push_desktop" && newValue) {
      const permission = await requestBrowserNotificationPermission();
      setBrowserPermission(permission);
      if (permission !== "granted") {
        toast.error("Browser notification permission was not granted");
        return;
      }
    }

    try {
      await updatePreferences({ [key]: newValue });
      toast.success("Preference updated");
    } catch {
      toast.error("Failed to update preference");
    }
  };

  const setAllEmail = async (enabled: boolean) => {
    const payload = EMAIL_KEYS.reduce(
      (acc, key) => {
        acc[key] = enabled;
        return acc;
      },
      {} as Partial<NotificationPreferences>
    );

    try {
      await updatePreferences(payload);
      toast.success(enabled ? "All email notifications enabled" : "All email notifications disabled");
    } catch {
      toast.error("Failed to update email preferences");
    }
  };

  const emailSettings = [
    {
      title: "Order updates",
      description: "Status changes on sales and purchase orders",
      icon: Package,
      key: "email_order_updates" as const,
    },
    {
      title: "Payment reminders",
      description: "Reminders for pending payments",
      icon: CreditCard,
      key: "email_payment_reminders" as const,
    },
    {
      title: "Inventory alerts",
      description: "Low stock, budget, and inventory updates",
      icon: AlertCircle,
      key: "email_inventory_alerts" as const,
    },
    {
      title: "Team activity",
      description: "Updates from your team members",
      icon: Users,
      key: "email_team_activity" as const,
    },
  ];

  const pushSettings = [
    {
      title: "Desktop notifications",
      description: "Show browser alerts while Khata is open",
      icon: Bell,
      key: "push_desktop" as const,
    },
    {
      title: "Mobile notifications",
      description: "Push alerts on mobile devices when available",
      icon: Smartphone,
      key: "push_mobile" as const,
    },
    {
      title: "Sound alerts",
      description: "Play a sound for important desktop alerts",
      icon: Volume2,
      key: "push_sound" as const,
    },
  ];

  const securitySettings = [
    {
      title: "Login alerts",
      description: "In-app alert when a new device signs in",
      icon: Shield,
      key: "login_alerts" as const,
    },
    {
      title: "Security log exports",
      description: "Weekly summary of security-related actions",
      icon: Shield,
      key: "security_log_exports" as const,
    },
  ];

  const permissionLabel =
    browserPermission === "granted"
      ? "Browser notifications are allowed"
      : browserPermission === "denied"
        ? "Browser notifications are blocked in your browser settings"
        : browserPermission === "unsupported"
          ? "This browser does not support desktop notifications"
          : "Browser permission not requested yet";

  const pageLoading = loading || recentLoading;

  return (
    <SettingsPageShell
      title="Notifications"
      subtitle="Choose how you want to be notified about business activity"
      loading={pageLoading}
      loadingMessage="Loading notification settings…"
    >
      <SettingsPageContent>
        {loadError && (
          <SettingsNotice variant="warning">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span>{loadError}</span>
              <Button type="button" size="sm" variant="outline" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Retry
              </Button>
            </div>
          </SettingsNotice>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <SettingsCard>
            <SettingsCardHeader
              icon={Mail}
              title="Email notifications"
              description="Saved for email delivery when outbound mail is configured"
              action={
                <div className="flex gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => setAllEmail(true)}>
                    Enable all
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => setAllEmail(false)}>
                    Disable all
                  </Button>
                </div>
              }
            />
            <SettingsCardBody className="py-2">
              {emailSettings.map((item) => (
                <SettingsToggleRow
                  key={item.key}
                  title={item.title}
                  description={item.description}
                  icon={item.icon}
                  checked={preferences[item.key]}
                  disabled={savingKey === item.key}
                  onChange={() => handleToggle(item.key)}
                />
              ))}
            </SettingsCardBody>
          </SettingsCard>

          <SettingsCard>
            <SettingsCardHeader
              icon={Bell}
              title="Push notifications"
              description="Real-time alerts in the app and browser"
            />
            <SettingsCardBody className="space-y-4">
              <SettingsNotice variant={browserPermission === "granted" ? "success" : "info"}>
                {permissionLabel}
              </SettingsNotice>
              <div className="py-0">
                {pushSettings.map((item) => (
                  <SettingsToggleRow
                    key={item.key}
                    title={item.title}
                    description={item.description}
                    icon={item.icon}
                    checked={preferences[item.key]}
                    disabled={
                      savingKey === item.key ||
                      (item.key === "push_desktop" && !getBrowserNotificationSupport())
                    }
                    onChange={() => handleToggle(item.key)}
                  />
                ))}
              </div>
            </SettingsCardBody>
          </SettingsCard>
        </div>

        <SettingsCard>
          <SettingsCardHeader
            icon={Shield}
            title="Security notifications"
            description="Alerts about sign-ins and account activity"
          />
          <SettingsCardBody className="py-2">
            {securitySettings.map((item) => (
              <SettingsToggleRow
                key={item.key}
                title={item.title}
                description={item.description}
                icon={item.icon}
                checked={preferences[item.key]}
                disabled={savingKey === item.key}
                onChange={() => handleToggle(item.key)}
              />
            ))}
          </SettingsCardBody>
        </SettingsCard>

        <SettingsCard>
          <SettingsCardHeader
            icon={Bell}
            title="Recent notifications"
            description="Latest in-app alerts for your account"
          />
          <SettingsCardBody>
            {recentNotifications.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No notifications yet. Budget alerts and login alerts will appear here.
              </p>
            ) : (
              <div className="space-y-3">
                {recentNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`rounded-lg border px-4 py-3 ${
                      notification.is_read
                        ? "border-border bg-muted/30"
                        : "border-[#22C55E]/30 bg-[#22C55E]/5"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">{notification.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
                        <p className="text-[10px] text-muted-foreground/80 mt-2">
                          {new Date(notification.created_at).toLocaleString()}
                        </p>
                      </div>
                      {!notification.is_read && (
                        <span className="text-[10px] font-semibold uppercase text-[#22C55E]">
                          New
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/settings/sessions"
                className="text-sm text-[#22C55E] hover:underline"
              >
                Manage active sessions
              </Link>
              <button
                type="button"
                onClick={loadRecent}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Refresh list
              </button>
            </div>
          </SettingsCardBody>
        </SettingsCard>
      </SettingsPageContent>
    </SettingsPageShell>
  );
}
