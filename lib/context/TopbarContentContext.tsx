"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type TopbarContent = {
  title?: ReactNode;
  subtitle?: string;
  actions?: ReactNode;
};

const TopbarContentStateContext = createContext<TopbarContent>({});
const TopbarContentSetContext = createContext<
  ((content: TopbarContent) => void) | undefined
>(undefined);

export function TopbarContentProvider({ children }: { children: ReactNode }) {
  const [content, setContentState] = useState<TopbarContent>({});

  const setContent = useCallback((next: TopbarContent) => {
    setContentState(next);
  }, []);

  return (
    <TopbarContentSetContext.Provider value={setContent}>
      <TopbarContentStateContext.Provider value={content}>
        {children}
      </TopbarContentStateContext.Provider>
    </TopbarContentSetContext.Provider>
  );
}

/** Read current topbar page content (for AppIconRail). */
export function useTopbarContentOptional() {
  return useContext(TopbarContentStateContext);
}

/** Registers page title/actions into the horizontal app bar while mounted. */
export function useRegisterTopbar(content: TopbarContent, enabled: boolean) {
  const setContent = useContext(TopbarContentSetContext);
  const titleKey =
    typeof content.title === "string" || typeof content.title === "number"
      ? String(content.title)
      : content.title;
  const { subtitle, actions } = content;

  useEffect(() => {
    if (!setContent || !enabled) return;
    setContent({ title: content.title, subtitle, actions });
    return () => setContent({});
    // actions intentionally included so page action buttons stay in sync
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setContent, enabled, titleKey, subtitle, actions]);
}
