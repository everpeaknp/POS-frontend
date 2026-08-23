"use client";

import { useDateSystemStore } from "@/lib/stores/dateSystemStore";

interface FormattedDateProps {
  value: string | Date | null | undefined;
  fallback?: string;
  className?: string;
}

export function FormattedDate({ value, fallback, className }: FormattedDateProps) {
  // Use Zustand store directly for instant reactivity
  const formatDate = useDateSystemStore((state) => state.formatDate);

  return <span className={className}>{formatDate(value, fallback)}</span>;
}
