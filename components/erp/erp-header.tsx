"use client";

import { KhataLogo } from "@/components/khata-logo";
import { useAppearance } from "@/lib/context/AppearanceContext";
import {
  ErpTabsNav,
  useRegisterErpNav,
} from "@/lib/context/ErpNavContext";
import { useIsElectron } from "@/lib/desktop/use-is-electron";

interface ErpHeaderProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  pendingInvitationsCount?: number;
}

/**
 * ERP header — logo + tabs.
 * Top mode: merges into AppIconRail (returns null here).
 * Left mode: standalone bar, flush left.
 */
export function ErpHeader({
  activeTab,
  onTabChange,
  pendingInvitationsCount = 0,
}: ErpHeaderProps) {
  const desktop = useIsElectron();
  const { preferences } = useAppearance();
  const mergeIntoAppBar =
    !desktop && preferences.navbar_position === "top";

  useRegisterErpNav(
    { activeTab, onTabChange, pendingInvitationsCount },
    mergeIntoAppBar
  );

  if (mergeIntoAppBar) {
    return null;
  }

  const showTabs = Boolean(activeTab && onTabChange);

  return (
    <header className="bg-card border-b border-border sticky top-0 z-20 shrink-0">
      <div className="w-full px-4 sm:px-6 h-14 flex items-center gap-5">
        <div className="shrink-0">
          <KhataLogo size="md" />
        </div>

        {showTabs && (
          <ErpTabsNav
            activeTab={activeTab}
            onTabChange={onTabChange}
            pendingInvitationsCount={pendingInvitationsCount}
            className="flex items-center gap-0.5 flex-1 min-w-0 overflow-x-auto scrollbar-none"
          />
        )}

        {!showTabs && <div className="flex-1" />}
      </div>
    </header>
  );
}
