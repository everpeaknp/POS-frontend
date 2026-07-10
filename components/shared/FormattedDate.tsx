"use client";

import { useMemo } from "react";
import { adStringToBs, formatAdDate, formatBsDate } from "nepali-calender-saroj";
import { useDateSystem } from "@/lib/context/DateSystemContext";
import { formatIsoDateLocal, parseIsoDateLocal } from "@/lib/dates";

interface FormattedDateProps {
  value: string | Date | null | undefined;
  fallback?: string;
  className?: string;
}

export function FormattedDate({ value, fallback, className }: FormattedDateProps) {
  const { formatDate, dateSystem } = useDateSystem();

  const dual = useMemo(() => {
    if (dateSystem !== "BS" || value === null || value === undefined || value === "") {
      return null;
    }

    const adDate =
      value instanceof Date ? value : parseIsoDateLocal(String(value).split("T")[0]);
    if (!adDate || Number.isNaN(adDate.getTime())) return null;

    const bs = adStringToBs(formatIsoDateLocal(adDate));
    if (!bs) return null;

    return {
      bs: formatBsDate(bs.year, bs.month, bs.day, false),
      ad: formatAdDate(adDate),
    };
  }, [dateSystem, value]);

  if (dual) {
    return (
      <span className={className}>
        <span className="font-medium">{dual.bs}</span>
        <span className="text-muted-foreground"> · {dual.ad}</span>
      </span>
    );
  }

  return <span className={className}>{formatDate(value, fallback)}</span>;
}
