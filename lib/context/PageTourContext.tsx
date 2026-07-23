"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type PageTourContextValue = {
  active: boolean;
  startPageTour: () => void;
  endPageTour: () => void;
};

const PageTourContext = createContext<PageTourContextValue | undefined>(
  undefined
);

export function PageTourProvider({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState(false);

  const startPageTour = useCallback(() => setActive(true), []);
  const endPageTour = useCallback(() => setActive(false), []);

  const value = useMemo(
    () => ({ active, startPageTour, endPageTour }),
    [active, startPageTour, endPageTour]
  );

  return (
    <PageTourContext.Provider value={value}>{children}</PageTourContext.Provider>
  );
}

export function usePageTour() {
  const ctx = useContext(PageTourContext);
  if (!ctx) {
    throw new Error("usePageTour must be used within PageTourProvider");
  }
  return ctx;
}

export function usePageTourOptional() {
  return useContext(PageTourContext);
}
