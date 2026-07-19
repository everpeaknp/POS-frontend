"use client";

import { KhataLogo } from "@/components/khata-logo";
import { UserMenuDropdown } from "@/components/shared/UserMenuDropdown";
import { useIsElectron } from "@/lib/desktop/use-is-electron";

const TABS = [
  { id: "organizations", label: "Organizations" },
  { id: "requests", label: "Requests" },
  { id: "invitation", label: "Invitations" },
] as const;

interface ErpHeaderProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  pendingInvitationsCount?: number;
}

/**
 * ERP top navbar — logo + tabs + user (web).
 * On desktop, user lives in DesktopTitleBar; this stays a single clean bar.
 */
export function ErpHeader({
  activeTab,
  onTabChange,
  pendingInvitationsCount = 0,
}: ErpHeaderProps) {
  const desktop = useIsElectron();
  const showTabs = Boolean(activeTab && onTabChange);

  return (
    <header className="bg-card border-b border-border sticky top-0 z-20 shrink-0">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-14 flex items-center gap-5">
        <div className="shrink-0">
          <KhataLogo size="md" />
        </div>

        {showTabs && (
          <nav
            className="flex items-center gap-0.5 flex-1 min-w-0 overflow-x-auto scrollbar-none"
            role="tablist"
            aria-label="Workspace sections"
          >
            {TABS.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => onTabChange?.(tab.id)}
                  className={`shrink-0 h-9 px-3.5 rounded-md text-sm font-medium transition-colors inline-flex items-center gap-2 ${
                    active
                      ? "bg-[#22C55E]/12 text-[#22C55E]"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  {tab.label}
                  {tab.id === "invitation" && pendingInvitationsCount > 0 && (
                    <span className="inline-flex h-5 min-w-5 px-1 items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">
                      {pendingInvitationsCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        )}

        {!showTabs && <div className="flex-1" />}

        {!desktop && (
          <div className="shrink-0">
            <UserMenuDropdown detail="email" />
          </div>
        )}
      </div>
    </header>
  );
}
