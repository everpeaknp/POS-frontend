import type { LucideIcon } from "lucide-react";
import {
  User,
  Key,
  Bell,
  Palette,
  CreditCard,
} from "lucide-react";

export type SettingsNavItem = {
  id: string;
  label: string;
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  exact?: boolean;
};

export const SETTINGS_NAV_ITEMS: SettingsNavItem[] = [
  {
    id: "profile",
    label: "Profile",
    title: "Account Profile",
    description: "Manage your public presence, bio, and personal details.",
    href: "/settings/profile",
    icon: User,
  },
  {
    id: "security",
    label: "Security",
    title: "Password & Security",
    description: "Secure your account with MFA, credentials, and active sessions.",
    href: "/settings/security",
    icon: Key,
  },
  {
    id: "notifications",
    label: "Notifications",
    title: "Notification Center",
    description: "Configure how and when you want to be alerted.",
    href: "/settings/notifications",
    icon: Bell,
  },
  {
    id: "appearance",
    label: "Appearance",
    title: "Interface & Appearance",
    description: "Customize your workspace theme and display density.",
    href: "/settings/appearance",
    icon: Palette,
  },
  {
    id: "billing",
    label: "Billing",
    title: "Billing & Subscription",
    description: "Organization plan, eSewa payments, and payment history.",
    href: "/settings/billing",
    icon: CreditCard,
  },
];

export function isSettingsNavActive(pathname: string, item: SettingsNavItem): boolean {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
