"use client";

import { useDateSystem } from "@/lib/context/DateSystemContext";

interface FormattedDateProps {
  value: string | Date | null | undefined;
  fallback?: string;
  className?: string;
}

export function FormattedDate({ value, fallback, className }: FormattedDateProps) {
  const { formatDate } = useDateSystem();
  return <span className={className}>{formatDate(value, fallback)}</span>;
}
