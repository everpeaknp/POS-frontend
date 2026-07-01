"use client";

import Link from "next/link";
import { Settings, Users, Lock, CreditCard, Zap, FileText } from "lucide-react";
import { DashHeader } from "@/components/dashboard/dash-header";
import { DateSystemPreferenceCard } from "@/components/settings/DateSystemPreferenceCard";

const settingsCards = [
  {
    icon: Settings,
    title: "Organization Settings",
    description: "Business info, address, preferences",
    href: "/dashboard/settings/org",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: Users,
    title: "Users & Roles",
    description: "Manage team members and roles",
    href: "/dashboard/settings/users",
    color: "bg-purple-50 text-purple-600",
  },
  {
    icon: Lock,
    title: "Permissions",
    description: "Role-based access control",
    href: "/dashboard/settings/permissions",
    color: "bg-green-50 text-green-600",
  },
  {
    icon: CreditCard,
    title: "Billing & Subscription",
    description: "Manage your plan and payments",
    href: "/dashboard/settings/billing",
    color: "bg-amber-50 text-amber-600",
  },
  {
    icon: Zap,
    title: "Integrations",
    description: "Connect third-party services",
    href: "/dashboard/settings/integrations",
    color: "bg-red-50 text-red-600",
  },
  {
    icon: FileText,
    title: "Audit Logs",
    description: "Track all system activity",
    href: "/dashboard/settings/audit",
    color: "bg-indigo-50 text-indigo-600",
  },
];

export default function SettingsPage() {
  return (
    <div className="flex flex-col min-h-full">
      <DashHeader 
        title="Organization Settings" 
        subtitle="Manage your organization settings, team members, and permissions" 
      />
      <div className="flex-1 p-6">
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> These settings apply to your entire organization. 
            For personal account settings, visit{" "}
            <Link href="/settings" className="underline font-semibold hover:text-blue-900">
              User Settings
            </Link>
          </p>
        </div>

        <DateSystemPreferenceCard />
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl">
          {settingsCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.title}
                href={card.href}
                className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:border-[#22C55E]/30 hover:shadow-md transition-all"
              >
                <div className={`w-10 h-10 rounded-lg ${card.color} flex items-center justify-center mb-3`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-gray-800 text-sm">{card.title}</h3>
                <p className="text-xs text-gray-500 mt-1">{card.description}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
