"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Menu, X } from "lucide-react";
import { KhataLogo } from "@/components/khata-logo";
import { useAuth } from "@/lib/context/AuthContext";
import { SETTINGS_NAV_ITEMS, isSettingsNavActive } from "@/lib/settings/nav-items";

function AccountSidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const { user } = useAuth();

  const displayName = user
    ? `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.username
    : "";
  const initials = user
    ? `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase() || user.username?.[0]?.toUpperCase() || "U"
    : "U";

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-5 border-b border-white/10 flex items-center justify-between">
        {user ? (
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-[#22C55E] flex items-center justify-center text-white font-semibold text-sm shrink-0 overflow-hidden">
              {user.avatar ? (
                <img src={user.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-white font-semibold text-sm leading-tight truncate">
                {displayName}
              </span>
              <span className="text-gray-400 text-xs leading-tight truncate">{user.email}</span>
            </div>
          </div>
        ) : (
          <KhataLogo size="md" />
        )}
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors lg:hidden" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto scrollbar-green">
        {SETTINGS_NAV_ITEMS.map((item) => {
          const active = isSettingsNavActive(pathname, item);
          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                active
                  ? "bg-[#22C55E] text-white"
                  : "text-gray-400 hover:text-white hover:bg-white/10"
              }`}
            >
              <item.icon size={17} className="shrink-0" />
              {item.label}
            </Link>
          );
        })}

        <Link
          href="/erp"
          onClick={onClose}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/10 transition-all mt-1"
        >
          <ArrowLeft size={17} className="shrink-0" />
          Back
        </Link>
      </nav>

      <div className="px-5 py-4 border-t border-white/10">
        <p className="text-xs text-gray-600">© 2025 Khata Business OS</p>
      </div>
    </div>
  );
}

export function AccountSettingsSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-[#1E2A3B] text-white shadow-lg"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="relative w-64 h-full bg-[#1E2A3B] z-50 overflow-hidden">
            <AccountSidebarContent onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <aside className="hidden lg:flex flex-col w-60 shrink-0 bg-[#1E2A3B] h-screen sticky top-0 overflow-hidden">
        <AccountSidebarContent />
      </aside>
    </>
  );
}
