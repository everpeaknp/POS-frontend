"use client";

import { cn } from "@/lib/utils";

/** Base loader is 48px at scale 1. */
const SIZE_SCALE = {
  xs: 16 / 48,
  sm: 20 / 48,
  md: 24 / 48,
  lg: 40 / 48,
  xl: 64 / 48,
} as const;

export type KhataSpinnerSize = keyof typeof SIZE_SCALE;
export type KhataSpinnerVariant = "brand" | "onPrimary" | "muted";

export interface KhataSpinnerProps {
  size?: KhataSpinnerSize;
  variant?: KhataSpinnerVariant;
  /** @deprecated Layered loader has built-in animation; kept for API compatibility. */
  pulse?: boolean;
  /** @deprecated Layered loader has built-in animation; kept for API compatibility. */
  dots?: boolean;
  className?: string;
}

function inferSize(className?: string): KhataSpinnerSize {
  if (!className) return "sm";
  if (/h-16|w-16/.test(className)) return "xl";
  if (/h-10|w-10|h-8|w-8/.test(className)) return "lg";
  if (/h-6|w-6|h-5|w-5/.test(className)) return "md";
  if (/h-4|w-4|h-3\.5|w-3\.5/.test(className)) return "xs";
  return "sm";
}

export function inferKhataSpinnerVariant(
  className?: string
): KhataSpinnerVariant {
  if (!className) return "brand";
  if (/text-muted|text-gray/.test(className)) return "muted";
  if (/text-white/.test(className)) return "onPrimary";
  if (/\bmr-2\b|\bml-2\b/.test(className)) return "onPrimary";
  return "brand";
}

function layoutClassName(className?: string) {
  return className
    ?.replace(/\b[hw]-(?:\[[^\]]+\]|[\w.]+)/g, "")
    .replace(/\banimate-spin\b/g, "")
    .trim();
}

const VARIANT_CLASS: Record<KhataSpinnerVariant, string> = {
  brand: "",
  onPrimary: "khata-loader--on-primary",
  muted: "khata-loader--muted",
};

export function KhataSpinner({
  size,
  variant = "brand",
  className,
}: KhataSpinnerProps) {
  const resolvedSize = size ?? inferSize(className);
  const scale = SIZE_SCALE[resolvedSize];
  const layout = layoutClassName(className);
  const pad = 28 * scale;

  return (
    <div
      className={cn("inline-flex items-center justify-center", layout)}
      style={{ padding: pad }}
    >
      <div
        className="khata-loader-wrap"
        style={{ "--khata-loader-size": `${scale}px` } as React.CSSProperties}
      >
        <span
          role="status"
          aria-label="Loading"
          aria-live="polite"
          aria-busy="true"
          className={cn("khata-loader", VARIANT_CLASS[variant])}
          style={{ "--khata-loader-size": `${scale}px` } as React.CSSProperties}
        />
      </div>
    </div>
  );
}
