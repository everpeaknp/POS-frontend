"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { usePageTour } from "@/lib/context/PageTourContext";
import { buildPageTourSteps } from "@/lib/onboarding/page-tour";
import type { TourStep } from "@/lib/onboarding/tour-steps";

type Rect = { top: number; left: number; width: number; height: number };
type Placement = "top" | "bottom" | "left" | "right";

const CARD_W = 340;
const CARD_GAP = 16;
const ARROW = 10;

function isDisplayed(el: Element): boolean {
  let node: Element | null = el;
  while (node && node !== document.documentElement) {
    const style = window.getComputedStyle(node);
    if (style.display === "none" || style.visibility === "hidden") {
      return false;
    }
    node = node.parentElement;
  }
  const rect = el.getBoundingClientRect();
  return rect.width > 1 && rect.height > 1;
}

function isInSidebar(el: Element): boolean {
  return Boolean(el.closest('[data-tour="sidebar"]'));
}

function isEmptyChrome(el: Element): boolean {
  // Skip empty header action wrappers so we don't spotlight blank space
  if (el.getAttribute("data-page-tour") === "header-actions") {
    return el.childElementCount === 0 && !(el.textContent || "").trim();
  }
  return false;
}

function queryFirst(selectors: string[]): Element | null {
  for (const selector of selectors) {
    try {
      const nodes = Array.from(document.querySelectorAll(selector));
      const preferSidebar = selector.includes("sidebar") || /nav-/.test(selector);

      if (preferSidebar) {
        const preferred = nodes.find(
          (n) => isDisplayed(n) && isInSidebar(n) && !isEmptyChrome(n)
        );
        if (preferred) return preferred;
      } else {
        const preferred = nodes.find(
          (n) => isDisplayed(n) && !isInSidebar(n) && !isEmptyChrome(n)
        );
        if (preferred) return preferred;
      }

      const any = nodes.find((n) => isDisplayed(n) && !isEmptyChrome(n));
      if (any) return any;
    } catch {
      // invalid selector
    }
  }
  return null;
}

function expandSidebarSection(label: string) {
  const key = label.toLowerCase();
  const toggle = document.querySelector(
    `[data-tour="sidebar"] [data-tour="nav-${key}-toggle"]`
  ) as HTMLButtonElement | null;
  if (toggle && isDisplayed(toggle)) {
    const parent = toggle.closest(`[data-tour="nav-${key}"]`);
    const childLink = parent?.querySelector("a[href^='/dashboard/']");
    if (!childLink || !isDisplayed(childLink)) {
      toggle.click();
    }
  }
}

function rectFromEl(el: Element, opts?: { maxHeight?: number }): Rect {
  const r = el.getBoundingClientRect();
  const pad = 6;
  let height = Math.max(r.height + pad * 2, 8);
  if (opts?.maxHeight) {
    height = Math.min(height, opts.maxHeight);
  }
  return {
    top: Math.max(0, r.top - pad),
    left: Math.max(0, r.left - pad),
    width: Math.max(r.width + pad * 2, 8),
    height,
  };
}

function pickPlacement(rect: Rect, preferred?: TourStep["placement"]): Placement {
  const space = {
    top: rect.top,
    bottom: window.innerHeight - (rect.top + rect.height),
    left: rect.left,
    right: window.innerWidth - (rect.left + rect.width),
  };

  if (preferred && preferred !== "auto" && space[preferred] > 140) {
    return preferred;
  }

  const order: Placement[] =
    rect.width > rect.height * 1.5
      ? ["bottom", "top", "left", "right"]
      : ["right", "bottom", "left", "top"];

  return order.sort((a, b) => space[b] - space[a])[0];
}

function contentBounds(rect: Rect | null): { minLeft: number; minTop: number } {
  const sidebar = document.querySelector(
    '[data-tour="sidebar"]'
  ) as HTMLElement | null;
  const rail = document.querySelector(
    '[data-tour="app-icon-rail"]'
  ) as HTMLElement | null;

  let minLeft = 12;
  let minTop = 12;

  if (sidebar && isDisplayed(sidebar)) {
    const r = sidebar.getBoundingClientRect();
    if (!rect || rect.left >= r.right - 8) {
      minLeft = Math.max(minLeft, Math.ceil(r.right) + 12);
    }
  }

  if (rail && isDisplayed(rail) && rail.getAttribute("data-position") === "top") {
    const r = rail.getBoundingClientRect();
    if (!rect || rect.top >= r.bottom - 8) {
      minTop = Math.max(minTop, Math.ceil(r.bottom) + 12);
    }
  }

  if (rail && isDisplayed(rail) && rail.getAttribute("data-position") === "left") {
    const r = rail.getBoundingClientRect();
    if (!rect || rect.left >= r.right - 8) {
      minLeft = Math.max(minLeft, Math.ceil(r.right) + 12);
    }
  }

  return { minLeft, minTop };
}

function positionCard(rect: Rect, placement: Placement) {
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const { minLeft, minTop } = contentBounds(rect);
  const maxLeft = window.innerWidth - CARD_W - 12;
  let top = 0;
  let left = 0;

  if (placement === "bottom") {
    top = rect.top + rect.height + CARD_GAP;
    left = rect.width > CARD_W * 1.4 ? rect.left + 8 : cx - CARD_W / 2;
  } else if (placement === "top") {
    top = rect.top - CARD_GAP - 210;
    left = rect.width > CARD_W * 1.4 ? rect.left + 8 : cx - CARD_W / 2;
  } else if (placement === "right") {
    top = cy - 110;
    left = rect.left + rect.width + CARD_GAP;
  } else {
    top = cy - 110;
    left = rect.left - CARD_GAP - CARD_W;
  }

  left = Math.min(Math.max(minLeft, left), maxLeft);
  top = Math.min(Math.max(minTop, top), window.innerHeight - 230);

  const aimX = Math.min(Math.max(rect.left + 24, cx), rect.left + rect.width - 24);
  const aimY = cy;

  let arrowOffset = 0;
  if (placement === "top" || placement === "bottom") {
    arrowOffset = Math.min(Math.max(28, aimX - left), CARD_W - 28);
  } else {
    arrowOffset = Math.min(Math.max(28, aimY - top), 180);
  }

  return { top, left, arrowOffset };
}

function TourArrow({
  placement,
  offset,
}: {
  placement: Placement;
  offset: number;
}) {
  const base = "absolute w-0 h-0 pointer-events-none";

  if (placement === "bottom") {
    return (
      <div
        className={base}
        style={{
          top: -ARROW,
          left: offset,
          transform: "translateX(-50%)",
          borderLeft: `${ARROW}px solid transparent`,
          borderRight: `${ARROW}px solid transparent`,
          borderBottom: `${ARROW}px solid #ffffff`,
        }}
      />
    );
  }
  if (placement === "top") {
    return (
      <div
        className={base}
        style={{
          bottom: -ARROW,
          left: offset,
          transform: "translateX(-50%)",
          borderLeft: `${ARROW}px solid transparent`,
          borderRight: `${ARROW}px solid transparent`,
          borderTop: `${ARROW}px solid #ffffff`,
        }}
      />
    );
  }
  if (placement === "right") {
    return (
      <div
        className={base}
        style={{
          left: -ARROW,
          top: offset,
          transform: "translateY(-50%)",
          borderTop: `${ARROW}px solid transparent`,
          borderBottom: `${ARROW}px solid transparent`,
          borderRight: `${ARROW}px solid #ffffff`,
        }}
      />
    );
  }
  return (
    <div
      className={base}
      style={{
        right: -ARROW,
        top: offset,
        transform: "translateY(-50%)",
        borderTop: `${ARROW}px solid transparent`,
        borderBottom: `${ARROW}px solid transparent`,
        borderLeft: `${ARROW}px solid #ffffff`,
      }}
    />
  );
}

/**
 * Spotlight tour for the currently open dashboard page.
 * Started from the help icon in the app bar.
 */
export function PageTour() {
  const pathname = usePathname();
  const { active, endPageTour } = usePageTour();

  const [steps, setSteps] = useState<TourStep[]>([]);
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [ready, setReady] = useState(false);

  // Resolve which beats exist on this page (skip empty optional targets)
  useEffect(() => {
    if (!active) {
      setSteps([]);
      setIndex(0);
      setRect(null);
      setReady(false);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      const candidates = buildPageTourSteps(pathname);
      const available: TourStep[] = [];
      for (const candidate of candidates) {
        if (candidate.expandNav) expandSidebarSection(candidate.expandNav);
        if (queryFirst(candidate.selectors)) {
          available.push(candidate);
        } else if (!candidate.optional) {
          // Keep required steps even if measurement races; measure effect retries
          available.push(candidate);
        }
      }
      if (cancelled) return;
      setSteps(available.length > 0 ? available : candidates.slice(0, 1));
      setIndex(0);
    }, 50);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [active, pathname]);

  const step: TourStep | undefined = steps[index];

  const measure = useCallback((): boolean => {
    if (!step) return false;
    if (step.expandNav) expandSidebarSection(step.expandNav);
    const el = queryFirst(step.selectors);
    if (!el) {
      setRect(null);
      return false;
    }
    el.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "auto" });
    // Cap large content regions so the spotlight stays on the visible top, not the whole page
    const maxHeight =
      step.id === "page_content" || step.id === "page_modules" ? 320 : undefined;
    setRect(rectFromEl(el, { maxHeight }));
    return true;
  }, [step]);

  useEffect(() => {
    if (!active || steps.length === 0 || !step) return;
    setReady(false);
    setRect(null);

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 10;

    const tryMeasure = () => {
      if (cancelled) return;
      attempts += 1;
      const found = measure();
      if (found) {
        setReady(true);
        return;
      }
      if (attempts < maxAttempts) {
        window.setTimeout(tryMeasure, 60);
        return;
      }

      if (index < steps.length - 1) {
        setIndex((i) => i + 1);
        return;
      }
      endPageTour();
    };

    const start = window.setTimeout(() => {
      requestAnimationFrame(() => requestAnimationFrame(tryMeasure));
    }, 40);

    return () => {
      cancelled = true;
      window.clearTimeout(start);
    };
  }, [active, step, measure, index, steps.length, endPageTour, steps]);

  useLayoutEffect(() => {
    if (!active || !ready || !rect) return;
    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [active, ready, rect, measure]);

  const layout = useMemo(() => {
    if (typeof window === "undefined" || !step || !rect) {
      return {
        placement: "bottom" as Placement,
        top: 96,
        left: 280,
        arrowOffset: 40,
        showArrow: false,
      };
    }
    const placement = pickPlacement(rect, step.placement);
    const pos = positionCard(rect, placement);
    return { placement, ...pos, showArrow: true };
  }, [rect, step]);

  if (!active) return null;
  if (steps.length === 0 || !step) {
    return (
      <div className="fixed inset-0 z-[110] bg-slate-900/40" aria-hidden />
    );
  }

  if (!ready) {
    return (
      <div className="fixed inset-0 z-[110] bg-slate-900/40" aria-hidden />
    );
  }

  const isLast = index >= steps.length - 1;

  const goNext = () => {
    if (isLast) endPageTour();
    else setIndex((i) => i + 1);
  };

  return (
    <div className="fixed inset-0 z-[110]" aria-live="polite">
      {rect ? (
        <div
          className="absolute rounded-xl pointer-events-none transition-all duration-300 z-[112]"
          style={{
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            boxShadow:
              "0 0 0 5px #ffffff, 0 0 0 10px #22C55E, 0 0 0 9999px rgba(15, 23, 42, 0.72)",
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-slate-900/70 z-[111]" />
      )}

      <div className="absolute inset-0 z-[111]" aria-hidden />

      <div
        className="absolute z-[113] rounded-2xl bg-white dark:bg-card p-5 shadow-[0_20px_50px_rgba(0,0,0,0.25)]"
        style={{ top: layout.top, left: layout.left, width: CARD_W }}
        role="dialog"
        aria-labelledby="khata-page-tour-title"
      >
        {layout.showArrow && (
          <TourArrow placement={layout.placement} offset={layout.arrowOffset} />
        )}

        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#16A34A]">
          Page tip {index + 1} of {steps.length}
        </p>
        <h4
          id="khata-page-tour-title"
          className="text-xl font-medium text-gray-900 dark:text-foreground mt-1.5 mb-0 tracking-tight"
        >
          {step.title}
        </h4>
        <p className="text-sm text-gray-500 dark:text-muted-foreground leading-relaxed mt-2 mb-0">
          {step.body}
        </p>

        <div className="mt-[18px] flex items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={endPageTour}
            className="text-sm font-medium text-gray-500 hover:text-gray-800 dark:hover:text-foreground"
          >
            Close
          </button>
          <div className="flex items-center gap-2">
            {index > 0 && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-900 border-transparent"
                onClick={() => setIndex((i) => Math.max(0, i - 1))}
              >
                Back
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              className="rounded-xl bg-gradient-to-r from-[#16A34A] to-[#22C55E] hover:from-[#15803d] hover:to-[#16A34A] text-white border-transparent px-4 shadow-md shadow-green-500/20"
              onClick={goNext}
            >
              {isLast ? "Done" : "Next"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
