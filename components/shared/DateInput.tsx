"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import { Calendar, ChevronDown } from "lucide-react";
import {
  NepaliCalendar,
  NEPALI_MONTHS_EN,
  adStringToBs,
  bsToAd,
  formatAdDate,
  formatBsDate,
  type BsDate,
} from "nepali-calender-saroj";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useDateSystem } from "@/lib/context/DateSystemContext";
import { formatIsoDateLocal, parseIsoDateLocal } from "@/lib/dates";
import "./DateInput.css";

interface DateInputProps {
  value: string;
  onChange: (isoDate: string) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
  required?: boolean;
}

function formatAdDayShort(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

function parseVisibleBsMonth(root: HTMLElement): { year: number; month: number } | null {
  const title = root.querySelector(".nc-title-main")?.textContent?.trim();
  if (!title) return null;

  const match = title.match(/^(\w+)\s+(\d{4})$/);
  if (!match) return null;

  const monthIndex = NEPALI_MONTHS_EN.indexOf(match[1]);
  if (monthIndex === -1) return null;

  return { year: Number(match[2]), month: monthIndex + 1 };
}

const PANEL_WIDTH = 300;
const PANEL_GAP = 4;
const VIEWPORT_PAD = 8;

function computePanelStyle(
  trigger: HTMLElement,
  panel: HTMLElement | null
): CSSProperties {
  const rect = trigger.getBoundingClientRect();
  const panelHeight = panel?.offsetHeight ?? 400;

  const spaceBelow = window.innerHeight - rect.bottom - VIEWPORT_PAD;
  const spaceAbove = rect.top - VIEWPORT_PAD;
  const openAbove = spaceBelow < panelHeight && spaceAbove > spaceBelow;

  let top = openAbove
    ? rect.top - panelHeight - PANEL_GAP
    : rect.bottom + PANEL_GAP;

  let left = rect.left;
  if (left + PANEL_WIDTH > window.innerWidth - VIEWPORT_PAD) {
    left = Math.max(VIEWPORT_PAD, rect.right - PANEL_WIDTH);
  }
  if (left < VIEWPORT_PAD) {
    left = VIEWPORT_PAD;
  }

  if (top + panelHeight > window.innerHeight - VIEWPORT_PAD) {
    top = Math.max(VIEWPORT_PAD, window.innerHeight - VIEWPORT_PAD - panelHeight);
  }
  if (top < VIEWPORT_PAD) {
    top = VIEWPORT_PAD;
  }

  const maxHeight = Math.max(
    200,
    openAbove ? spaceAbove - PANEL_GAP : spaceBelow - PANEL_GAP
  );

  return {
    position: "fixed",
    top,
    left,
    width: PANEL_WIDTH,
    maxHeight,
    overflowY: panelHeight > maxHeight ? "auto" : undefined,
    zIndex: 9999,
  };
}

function enhanceCalendarDayCells(root: HTMLElement) {
  const month = parseVisibleBsMonth(root);
  if (!month) return;

  root.querySelectorAll<HTMLElement>(".nc-day").forEach((cell) => {
    if (cell.dataset.khataEnhanced === "1") return;

    const day = Number(cell.textContent?.trim());
    if (!day || Number.isNaN(day)) return;

    const ad = bsToAd(month.year, month.month, day);
    if (!ad) return;

    cell.dataset.khataEnhanced = "1";
    cell.dataset.bsDay = String(day);

    const bsSpan = document.createElement("span");
    bsSpan.className = "khata-day-bs";
    bsSpan.textContent = String(day);

    const adSpan = document.createElement("span");
    adSpan.className = "khata-day-ad";
    adSpan.textContent = formatAdDayShort(ad);

    cell.replaceChildren(bsSpan, adSpan);
  });
}

export function DateInput({
  value,
  onChange,
  disabled,
  className,
  id,
  required,
}: DateInputProps) {
  const { dateSystem } = useDateSystem();

  if (dateSystem === "AD") {
    return (
      <Input
        id={id}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        required={required}
        className={cn("h-9 text-sm border-gray-200", className)}
      />
    );
  }

  return (
    <BsDateInput
      id={id}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={className}
      required={required}
    />
  );
}

function BsDateInput({
  value,
  onChange,
  disabled,
  className,
  id,
  required,
}: DateInputProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [previewBs, setPreviewBs] = useState<BsDate | null>(null);
  const [panelStyle, setPanelStyle] = useState<CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const enhancingRef = useRef(false);
  const bsValue = value ? adStringToBs(value) : null;

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    setPanelStyle(
      computePanelStyle(triggerRef.current, panelRef.current)
    );
  }, []);

  const refreshDayCells = useCallback(() => {
    if (!panelRef.current || enhancingRef.current) return;

    enhancingRef.current = true;
    enhanceCalendarDayCells(panelRef.current);
    enhancingRef.current = false;
  }, []);

  useLayoutEffect(() => {
    if (!open) return;

    updatePosition();
    const frame = requestAnimationFrame(updatePosition);

    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, previewBs, updatePosition]);

  useEffect(() => {
    if (!open) return;

    const handler = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
      setPreviewBs(null);
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (!open || !panelRef.current) return;

    refreshDayCells();

    const observer = new MutationObserver((mutations) => {
      const hasStructuralChange = mutations.some(
        (mutation) =>
          mutation.type === "childList" &&
          [...mutation.addedNodes].some(
            (node) =>
              node instanceof HTMLElement &&
              (node.classList.contains("nc-day") || node.querySelector(".nc-day"))
          )
      );

      if (hasStructuralChange) {
        refreshDayCells();
      }
    });

    const calendarRoot = panelRef.current.querySelector(".nc-card");
    if (calendarRoot) {
      observer.observe(calendarRoot, { childList: true, subtree: true });
    }

    const grid = panelRef.current.querySelector(".nc-days");
    const onHover = (event: Event) => {
      const cell = (event.target as HTMLElement).closest<HTMLElement>(".nc-day");
      if (!cell || !panelRef.current) return;

      const month = parseVisibleBsMonth(panelRef.current);
      const day = Number(cell.dataset.bsDay);
      if (!month || !day || Number.isNaN(day)) return;

      setPreviewBs({ year: month.year, month: month.month, day });
    };

    const onLeave = () => setPreviewBs(null);

    grid?.addEventListener("mouseover", onHover);
    grid?.addEventListener("mouseleave", onLeave);

    return () => {
      observer.disconnect();
      grid?.removeEventListener("mouseover", onHover);
      grid?.removeEventListener("mouseleave", onLeave);
    };
  }, [open, refreshDayCells]);

  const previewAd = previewBs
    ? bsToAd(previewBs.year, previewBs.month, previewBs.day)
    : null;

  const bsLabel = bsValue
    ? formatBsDate(bsValue.year, bsValue.month, bsValue.day, false)
    : null;
  const adDate = value ? parseIsoDateLocal(value) : null;
  const adLabel = adDate ? formatAdDate(adDate) : null;

  const calendarPanel = open ? (
    <div
      ref={panelRef}
      style={panelStyle}
      className="khata-nc-panel rounded-lg border border-gray-200 bg-white shadow-lg"
      role="dialog"
      aria-modal="true"
    >
      {previewBs && previewAd && (
        <div className="border-b border-gray-100 bg-gray-50 px-3 py-2 text-center">
          <div className="text-sm font-medium text-foreground">
            {formatBsDate(
              previewBs.year,
              previewBs.month,
              previewBs.day,
              false
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            {formatAdDate(previewAd)}
          </div>
        </div>
      )}

      <NepaliCalendar
        value={bsValue}
        onChange={(_bs, ad) => {
          if (!ad) {
            onChange("");
          } else {
            onChange(formatIsoDateLocal(ad));
          }
          setPreviewBs(null);
          setOpen(false);
        }}
        mode="light"
        showNepali={false}
        showSelectedBar
      />
    </div>
  ) : null;

  return (
    <div
      id={id}
      className={cn(
        "w-full",
        disabled && "pointer-events-none opacity-50",
        className
      )}
    >
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-required={required}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "flex h-9 w-full items-center gap-2 rounded-lg border border-input bg-background px-2.5 text-left text-sm transition-colors outline-none",
          "hover:bg-muted/40 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          open && "border-ring ring-3 ring-ring/50"
        )}
      >
        <Calendar className="size-4 shrink-0 text-muted-foreground" />
        <span className="min-w-0 flex-1 truncate">
          {bsLabel ? (
            <span className="text-foreground">
              <span className="font-medium">{bsLabel}</span>
              {adLabel && (
                <span className="text-muted-foreground">
                  {" "}
                  · {adLabel}
                </span>
              )}
            </span>
          ) : (
            <span className="text-muted-foreground">Select date</span>
          )}
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {mounted && calendarPanel
        ? createPortal(calendarPanel, document.body)
        : null}
    </div>
  );
}
