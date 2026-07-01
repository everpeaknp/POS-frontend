import NepaliDate from "nepali-date-converter";
import type { DateCalendarSystem } from "./constants";
import { parseIsoDateLocal } from "./convert";

export function formatDisplayDate(
  value: string | Date | null | undefined,
  system: DateCalendarSystem,
  options?: { fallback?: string }
): string {
  const fallback = options?.fallback ?? "—";
  if (value === null || value === undefined || value === "") return fallback;

  let ad: Date | null;
  if (value instanceof Date) {
    ad = value;
  } else {
    ad = parseIsoDateLocal(String(value));
  }
  if (!ad || Number.isNaN(ad.getTime())) return fallback;

  if (system === "BS") {
    return NepaliDate.fromAD(ad).format("DD MMMM YYYY");
  }

  return ad.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDisplayDateTime(
  value: string | Date | null | undefined,
  system: DateCalendarSystem,
  options?: { fallback?: string }
): string {
  const fallback = options?.fallback ?? "—";
  if (value === null || value === undefined || value === "") return fallback;

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;

  const datePart = formatDisplayDate(date, system, { fallback: "" });
  const timePart = date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (!datePart) return fallback;
  return `${datePart}, ${timePart}`;
}
