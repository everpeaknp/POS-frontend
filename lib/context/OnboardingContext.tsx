"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { tenantApi } from "@/lib/api/tenant";
import {
  markOnboardingComplete,
  markTourComplete,
  readOnboardingState,
  resetTourForReplay,
  type OnboardingState,
} from "@/lib/onboarding/storage";

type OnboardingPhase = "idle" | "overlay" | "tour" | "done";

type OnboardingContextValue = {
  phase: OnboardingPhase;
  state: OnboardingState | null;
  orgCount: number | null;
  checking: boolean;
  /** True when wizard was opened from Help Desk (existing org) */
  helpMode: boolean;
  startTour: () => void;
  replayWizard: () => void;
  clearHelpMode: () => void;
  completeOverlay: (opts?: { startTour?: boolean }) => void;
  skipOverlay: () => void;
  completeTour: () => void;
  skipTour: () => void;
  refreshOrgCount: () => Promise<number>;
};

const OnboardingContext = createContext<OnboardingContextValue | undefined>(
  undefined
);

const AUTH_PATHS = ["/auth", "/invite"];

function isAuthPath(pathname: string) {
  return AUTH_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

function isClassicOrgWizard(pathname: string) {
  return pathname === "/erp/new" || pathname.startsWith("/erp/new/");
}

function dismissKey(userId: number | string) {
  return `khata_onboarding_dismiss:${userId}`;
}

function tourPendingKey(userId: number | string) {
  return `khata_tour_pending:${userId}`;
}

function helpReplayKey(userId: number | string) {
  return `khata_help_replay:${userId}`;
}

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [state, setState] = useState<OnboardingState | null>(null);
  const [orgCount, setOrgCount] = useState<number | null>(null);
  const [checking, setChecking] = useState(true);
  const [phase, setPhase] = useState<OnboardingPhase>("idle");
  const [helpMode, setHelpMode] = useState(false);
  const phaseRef = React.useRef<OnboardingPhase>("idle");

  const setPhaseSafe = useCallback((next: OnboardingPhase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const refreshOrgCount = useCallback(async () => {
    if (!user) {
      setOrgCount(null);
      return 0;
    }
    try {
      const tenants = await tenantApi.getAll();
      const count = Array.isArray(tenants) ? tenants.length : 0;
      setOrgCount(count);
      return count;
    } catch {
      const fallback = user.tenant ? 1 : 0;
      setOrgCount(fallback);
      return fallback;
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setState(null);
      setOrgCount(null);
      setHelpMode(false);
      setPhaseSafe("idle");
      setChecking(false);
      return;
    }

    let cancelled = false;

    const bootstrap = async () => {
      const currentPhase = phaseRef.current;
      const helpReplay =
        typeof window !== "undefined" &&
        sessionStorage.getItem(helpReplayKey(user.id)) === "1";

      if (helpReplay) {
        setHelpMode(true);
      }

      // Keep help / active overlay or tour intact across route changes
      if (currentPhase === "overlay" || currentPhase === "tour") {
        setChecking(false);
        return;
      }

      let stored = readOnboardingState(user.id);
      const count = await refreshOrgCount();
      if (cancelled) return;

      const sessionDismissed =
        typeof window !== "undefined" &&
        sessionStorage.getItem(dismissKey(user.id)) === "1";
      const tourPending =
        typeof window !== "undefined" &&
        sessionStorage.getItem(tourPendingKey(user.id)) === "1";

      if (helpReplay) {
        setState(stored);
        setPhaseSafe("overlay");
        setChecking(false);
        return;
      }

      // Existing customers: never interrupt with wizard/tour
      if (count > 0 && !stored.completed) {
        stored = markTourComplete(user.id)!;
        setState(stored);
        setPhaseSafe("done");
        setChecking(false);
        return;
      }

      setState(stored);

      if (isAuthPath(pathname) || isClassicOrgWizard(pathname)) {
        setPhaseSafe("idle");
        setChecking(false);
        return;
      }

      if (!stored.completed && count === 0) {
        setPhaseSafe(sessionDismissed ? "idle" : "overlay");
        setChecking(false);
        return;
      }

      if (
        tourPending &&
        stored.completed &&
        !stored.tourCompleted &&
        count > 0
      ) {
        setPhaseSafe("tour");
        setChecking(false);
        return;
      }

      setPhaseSafe(stored.tourCompleted || stored.completed ? "done" : "idle");
      setChecking(false);
    };

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [authLoading, user, pathname, refreshOrgCount, setPhaseSafe]);

  const clearHelpMode = useCallback(() => {
    if (user && typeof window !== "undefined") {
      sessionStorage.removeItem(helpReplayKey(user.id));
    }
    setHelpMode(false);
  }, [user]);

  const skipOverlay = useCallback(() => {
    if (!user) return;
    clearHelpMode();
    if (typeof window !== "undefined") {
      sessionStorage.setItem(dismissKey(user.id), "1");
    }
    setPhaseSafe("idle");
    if (helpMode) {
      router.push("/dashboard/settings/help");
    } else {
      router.push("/erp");
    }
  }, [user, router, setPhaseSafe, clearHelpMode, helpMode]);

  const completeOverlay = useCallback(
    (opts?: { startTour?: boolean }) => {
      if (!user) return;
      clearHelpMode();
      const next = markOnboardingComplete(user.id);
      if (next) setState(next);
      setOrgCount((c) => (c && c > 0 ? c : 1));
      if (typeof window !== "undefined") {
        sessionStorage.removeItem(dismissKey(user.id));
        if (opts?.startTour !== false) {
          sessionStorage.setItem(tourPendingKey(user.id), "1");
          resetTourForReplay(user.id);
        } else {
          sessionStorage.removeItem(tourPendingKey(user.id));
        }
      }
      if (opts?.startTour !== false) {
        setPhaseSafe("tour");
        router.push("/dashboard");
      } else {
        setPhaseSafe("done");
        router.push("/dashboard");
      }
    },
    [user, router, setPhaseSafe, clearHelpMode]
  );

  const startTour = useCallback(() => {
    if (!user) return;
    clearHelpMode();
    const next = resetTourForReplay(user.id);
    setState(next ?? readOnboardingState(user.id));
    if (typeof window !== "undefined") {
      sessionStorage.setItem(tourPendingKey(user.id), "1");
    }
    setPhaseSafe("tour");
    router.push("/dashboard");
  }, [user, router, setPhaseSafe, clearHelpMode]);

  const replayWizard = useCallback(() => {
    if (!user) return;
    const next = resetTourForReplay(user.id);
    setState(next ?? readOnboardingState(user.id));
    if (typeof window !== "undefined") {
      sessionStorage.setItem(helpReplayKey(user.id), "1");
      sessionStorage.removeItem(dismissKey(user.id));
      sessionStorage.removeItem(tourPendingKey(user.id));
    }
    setHelpMode(true);
    setPhaseSafe("overlay");
  }, [user, setPhaseSafe]);

  const finishTour = useCallback(() => {
    if (!user) return;
    clearHelpMode();
    const next = markTourComplete(user.id);
    if (next) setState(next);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(tourPendingKey(user.id));
    }
    setPhaseSafe("done");
  }, [user, setPhaseSafe, clearHelpMode]);

  const value = useMemo<OnboardingContextValue>(
    () => ({
      phase,
      state,
      orgCount,
      checking,
      helpMode,
      startTour,
      replayWizard,
      clearHelpMode,
      completeOverlay,
      skipOverlay,
      completeTour: finishTour,
      skipTour: finishTour,
      refreshOrgCount,
    }),
    [
      phase,
      state,
      orgCount,
      checking,
      helpMode,
      startTour,
      replayWizard,
      clearHelpMode,
      completeOverlay,
      skipOverlay,
      finishTour,
      refreshOrgCount,
    ]
  );

  return (
    <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error("useOnboarding must be used within OnboardingProvider");
  }
  return ctx;
}
