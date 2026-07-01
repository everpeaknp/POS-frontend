import NepaliDate from "nepali-date-converter";

/** Parse YYYY-MM-DD as local calendar date (no UTC shift). */
export function parseIsoDateLocal(iso: string): Date | null {
  const part = iso?.split("T")[0];
  if (!part || !/^\d{4}-\d{2}-\d{2}$/.test(part)) return null;
  const [y, m, d] = part.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Format a local Date as YYYY-MM-DD (Gregorian / API storage). */
export function formatIsoDateLocal(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function todayIsoDate(): string {
  return formatIsoDateLocal(new Date());
}

export interface BsDateParts {
  year: number;
  monthIndex: number;
  day: number;
}

export function adIsoToBsParts(iso: string): BsDateParts | null {
  const ad = parseIsoDateLocal(iso);
  if (!ad) return null;
  const nd = NepaliDate.fromAD(ad);
  return { year: nd.getYear(), monthIndex: nd.getMonth(), day: nd.getDate() };
}

export function bsPartsToAdIso(year: number, monthIndex: number, day: number): string {
  const nd = new NepaliDate(year, monthIndex, day);
  return formatIsoDateLocal(nd.toJsDate());
}

export function getBsDaysInMonth(year: number, monthIndex: number): number {
  for (let day = 32; day >= 28; day -= 1) {
    const nd = new NepaliDate(year, monthIndex, day);
    if (nd.getYear() === year && nd.getMonth() === monthIndex) return day;
  }
  return 30;
}

export function isValidIsoDate(iso: string): boolean {
  return parseIsoDateLocal(iso) !== null;
}
