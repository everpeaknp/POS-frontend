"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type ErpNavState = {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  pendingInvitationsCount?: number;
};

type ErpNavContextValue = {
  nav: ErpNavState;
  setNav: (nav: ErpNavState) => void;
};

const ErpNavStateContext = createContext<ErpNavState>({});
const ErpNavSetContext = createContext<((nav: ErpNavState) => void) | undefined>(
  undefined
);

export function ErpNavProvider({ children }: { children: ReactNode }) {
  const [nav, setNavState] = useState<ErpNavState>({});
  const setNav = useCallback((next: ErpNavState) => {
    setNavState(next);
  }, []);

  return (
    <ErpNavSetContext.Provider value={setNav}>
      <ErpNavStateContext.Provider value={nav}>
        {children}
      </ErpNavStateContext.Provider>
    </ErpNavSetContext.Provider>
  );
}

export function useErpNavOptional() {
  return useContext(ErpNavStateContext);
}

export function useRegisterErpNav(nav: ErpNavState, enabled: boolean) {
  const setNav = useContext(ErpNavSetContext);

  useEffect(() => {
    if (!setNav || !enabled) return;
    setNav(nav);
    return () => setNav({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    setNav,
    enabled,
    nav.activeTab,
    nav.onTabChange,
    nav.pendingInvitationsCount,
  ]);
}

export const ERP_TABS = [
  { id: "organizations", label: "Organizations" },
  { id: "requests", label: "Requests" },
  { id: "invitation", label: "Invitations" },
] as const;

export function ErpTabsNav({
  activeTab,
  onTabChange,
  pendingInvitationsCount = 0,
  className,
}: {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  pendingInvitationsCount?: number;
  className?: string;
}) {
  if (!activeTab || !onTabChange) return null;

  return (
    <nav
      className={className}
      role="tablist"
      aria-label="Workspace sections"
    >
      {ERP_TABS.map((tab) => {
        const active = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onTabChange(tab.id)}
            className={`shrink-0 h-9 px-3.5 rounded-md text-sm font-medium transition-colors inline-flex items-center gap-2 ${
              active
                ? "bg-[#22C55E]/12 text-[#22C55E]"
                : "text-muted-foreground hover:text-foreground hover:bg-accent dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/10"
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
  );
}
