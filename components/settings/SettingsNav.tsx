"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, Users, Lock, CreditCard, Zap, FileText } from "lucide-react";

const navItems = [
  { label: "Organization", href: "/dashboard/settings/org", icon: Settings },
  { label: "Users & Roles", href: "/dashboard/settings/users", icon: Users },
  { label: "Permissions", href: "/dashboard/settings/permissions", icon: Lock },
  { label: "Billing", href: "/dashboard/settings/billing", icon: CreditCard },
  { label: "Integrations", href: "/dashboard/settings/integrations", icon: Zap },
  { label: "Audit Logs", href: "/dashboard/settings/audit", icon: FileText },
];

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <div className="flex gap-1 border-b border-gray-100 overflow-x-auto">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              isActive
                ? "border-[#22C55E] text-[#22C55E]"
                : "border-transparent text-gray-600 hover:text-gray-800"
            }`}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
