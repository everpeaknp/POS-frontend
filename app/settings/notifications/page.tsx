"use client";

import { useState, useEffect } from "react";
import { Bell, Mail, Package, CreditCard, Users, AlertCircle, Loader2 } from "lucide-react";
import { userApi } from "@/lib/api/user";
import type { NotificationPreferences } from "@/lib/types/user";
import toast from "react-hot-toast";
import { SettingsPageShell } from "@/components/settings/SettingsPageShell";
import {
  SettingsCard,
  SettingsCardBody,
  SettingsCardHeader,
  SettingsPageContent,
  SettingsToggleRow,
} from "@/components/settings/settings-ui";

export default function NotificationsPage() {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email_order_updates: true,
    email_payment_reminders: true,
    email_inventory_alerts: true,
    email_team_activity: true,
    push_desktop: false,
    push_mobile: false,
    push_sound: false,
    login_alerts: true,
    security_log_exports: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const prefs = await userApi.getNotificationPreferences();
      setPreferences(prefs);
    } catch (error) {
      console.error("Failed to load preferences:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (key: keyof NotificationPreferences) => {
    const newValue = !preferences[key];
    setPreferences((prev) => ({ ...prev, [key]: newValue }));

    try {
      await userApi.updateNotificationPreferences({ [key]: newValue });
      toast.success("Preference updated");
    } catch {
      setPreferences((prev) => ({ ...prev, [key]: !newValue }));
      toast.error("Failed to update preference");
    }
  };

  const emailSettings = [
    { title: "Order updates", description: "Status changes on sales and purchase orders", icon: Package, key: "email_order_updates" as const },
    { title: "Payment reminders", description: "Reminders for pending payments", icon: CreditCard, key: "email_payment_reminders" as const },
    { title: "Inventory alerts", description: "Low stock and inventory updates", icon: AlertCircle, key: "email_inventory_alerts" as const },
    { title: "Team activity", description: "Updates from your team members", icon: Users, key: "email_team_activity" as const },
  ];

  const pushSettings = [
    { title: "Desktop notifications", description: "Show alerts in your browser", icon: Bell, key: "push_desktop" as const },
    { title: "Mobile notifications", description: "Push alerts on mobile devices", icon: Bell, key: "push_mobile" as const },
    { title: "Sound alerts", description: "Play a sound for important alerts", icon: Bell, key: "push_sound" as const },
  ];

  return (
    <SettingsPageShell
      title="Notifications"
      subtitle="Choose how you want to be notified about business activity"
    >
      <SettingsPageContent>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <SettingsCard>
            <SettingsCardHeader icon={Mail} title="Email notifications" description="Messages sent to your inbox" />
            <SettingsCardBody className="py-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-[#22C55E]" />
                </div>
              ) : (
                emailSettings.map((item) => (
                  <SettingsToggleRow
                    key={item.key}
                    title={item.title}
                    description={item.description}
                    icon={item.icon}
                    checked={preferences[item.key]}
                    onChange={() => handleToggle(item.key)}
                  />
                ))
              )}
            </SettingsCardBody>
          </SettingsCard>

          <SettingsCard>
            <SettingsCardHeader icon={Bell} title="Push notifications" description="Real-time alerts in the app" />
            <SettingsCardBody className="py-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-[#22C55E]" />
                </div>
              ) : (
                pushSettings.map((item) => (
                  <SettingsToggleRow
                    key={item.key}
                    title={item.title}
                    description={item.description}
                    icon={item.icon}
                    checked={preferences[item.key]}
                    onChange={() => handleToggle(item.key)}
                  />
                ))
              )}
            </SettingsCardBody>
          </SettingsCard>
        </div>
      </SettingsPageContent>
    </SettingsPageShell>
  );
}
