import NepaliDate from "nepali-date-converter";
import { NEPALI_MONTHS } from "./constants";
import {
  adIsoToBsParts,
  bsPartsToAdIso,
  getBsDaysInMonth,
  parseIsoDateLocal,
  todayIsoDate,
} from "./convert";

export type CalendarPeriod =
  | { system: "AD"; yearMonth: string }
  | { system: "BS"; year: number; monthIndex: number };

export function getCurrentAdMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function getCurrentBsMonthIndex() {
  const bs = adIsoToBsParts(todayIsoDate());
  return bs?.monthIndex ?? 0;
}

export function getCurrentBsYear() {
  const bs = adIsoToBsParts(todayIsoDate());
  return bs?.year ?? 2083;
}

export function getAdDaysInMonth(yearMonth: string) {
  const [year, monthNum] = yearMonth.split("-").map(Number);
  return new Date(year, monthNum, 0).getDate();
}

export function shiftAdMonth(yearMonth: string, delta: number) {
  const [year, monthNum] = yearMonth.split("-").map(Number);
  const date = new Date(year, monthNum - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function shiftBsPeriod(year: number, monthIndex: number, delta: number) {
  let newMonth = monthIndex + delta;
  let newYear = year;
  while (newMonth < 0) {
    newMonth += 12;
    newYear -= 1;
  }
  while (newMonth > 11) {
    newMonth -= 12;
    newYear += 1;
  }
  return { year: newYear, monthIndex: newMonth };
}

export function getAdMonthLabel(yearMonth: string) {
  const [year, monthNum] = yearMonth.split("-").map(Number);
  return new Date(year, monthNum - 1, 1).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });
}

export function getBsMonthLabel(year: number, monthIndex: number) {
  return `${NEPALI_MONTHS[monthIndex]} ${year}`;
}

export function adDayToIso(yearMonth: string, day: number) {
  const [year, monthNum] = yearMonth.split("-").map(Number);
  return `${year}-${String(monthNum).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function resolveDayIso(period: CalendarPeriod, day: number) {
  if (period.system === "AD") {
    return adDayToIso(period.yearMonth, day);
  }
  return bsPartsToAdIso(period.year, period.monthIndex, day);
}

export function getPeriodDays(period: CalendarPeriod) {
  if (period.system === "AD") {
    return getAdDaysInMonth(period.yearMonth);
  }
  return getBsDaysInMonth(period.year, period.monthIndex);
}

export function getPeriodLabel(period: CalendarPeriod) {
  if (period.system === "AD") {
    return getAdMonthLabel(period.yearMonth);
  }
  return getBsMonthLabel(period.year, period.monthIndex);
}

export function getAttendanceDateRange(period: CalendarPeriod) {
  if (period.system === "AD") {
    const [year, monthNum] = period.yearMonth.split("-").map(Number);
    const endDay = getAdDaysInMonth(period.yearMonth);
    return {
      start: `${year}-${String(monthNum).padStart(2, "0")}-01`,
      end: `${year}-${String(monthNum).padStart(2, "0")}-${String(endDay).padStart(2, "0")}`,
    };
  }

  const days = getBsDaysInMonth(period.year, period.monthIndex);
  return {
    start: bsPartsToAdIso(period.year, period.monthIndex, 1),
    end: bsPartsToAdIso(period.year, period.monthIndex, days),
  };
}

export function getStatsMonthParam(period: CalendarPeriod) {
  if (period.system === "AD") {
    return period.yearMonth;
  }
  const midDay = Math.min(15, getBsDaysInMonth(period.year, period.monthIndex));
  return bsPartsToAdIso(period.year, period.monthIndex, midDay).slice(0, 7);
}

export function isWeekendIso(iso: string) {
  const date = parseIsoDateLocal(iso);
  if (!date) return false;
  const weekday = date.getDay();
  return weekday === 0 || weekday === 6;
}

export function getWeekdayLabelFromIso(iso: string) {
  const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
  const date = parseIsoDateLocal(iso);
  if (!date) return "";
  return labels[date.getDay()];
}

export function getPrimaryDayNumber(period: CalendarPeriod, day: number) {
  if (period.system === "AD") return String(day);
  return String(day);
}

export function getSecondaryDayLabel(period: CalendarPeriod, day: number): string | null {
  const iso = resolveDayIso(period, day);
  if (period.system === "AD") {
    const bs = adIsoToBsParts(iso);
    if (!bs) return null;
    return `${bs.day} ${NEPALI_MONTHS[bs.monthIndex]}`;
  }
  const ad = parseIsoDateLocal(iso);
  if (!ad) return null;
  const month = ad.toLocaleDateString("en-US", { month: "short" });
  return `${ad.getDate()} ${month}`;
}

/** @deprecated Use getSecondaryDayLabel */
export function getSecondaryDayNumber(period: CalendarPeriod, day: number) {
  return getSecondaryDayLabel(period, day);
}

export function getTodayDayInPeriod(period: CalendarPeriod) {
  const today = todayIsoDate();
  const days = getPeriodDays(period);
  for (let day = 1; day <= days; day += 1) {
    if (resolveDayIso(period, day) === today) {
      return day;
    }
  }
  return null;
}

export function buildMonthWeeks(period: CalendarPeriod) {
  let firstWeekday: number;
  let daysInMonth: number;

  if (period.system === "AD") {
    const [year, monthNum] = period.yearMonth.split("-").map(Number);
    daysInMonth = getAdDaysInMonth(period.yearMonth);
    firstWeekday = new Date(year, monthNum - 1, 1).getDay();
  } else {
    daysInMonth = getBsDaysInMonth(period.year, period.monthIndex);
    const firstIso = bsPartsToAdIso(period.year, period.monthIndex, 1);
    const [year, monthNum, dayNum] = firstIso.split("-").map(Number);
    firstWeekday = new Date(year, monthNum - 1, dayNum).getDay();
  }

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(day);
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}

export function getAdMonthOptions(count = 12) {
  const options: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const label = date.toLocaleDateString("en-US", { year: "numeric", month: "long" });
    options.push({ value, label });
  }
  return options;
}

export function adMonthToBsPeriod(yearMonth: string) {
  const bs = adIsoToBsParts(`${yearMonth}-01`);
  if (!bs) {
    return { year: getCurrentBsYear(), monthIndex: getCurrentBsMonthIndex() };
  }
  return { year: bs.year, monthIndex: bs.monthIndex };
}

export function bsPeriodToAdMonth(year: number, monthIndex: number) {
  return bsPartsToAdIso(year, monthIndex, 1).slice(0, 7);
}

export function formatBsMonthShort(year: number, monthIndex: number, day: number) {
  const nd = new NepaliDate(year, monthIndex, day);
  return nd.format("DD MMM");
}
