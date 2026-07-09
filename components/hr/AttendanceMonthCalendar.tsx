"use client";

import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { hrCardClass } from "@/components/dashboard/HRPageShell";
import { DateSystemToggle } from "@/components/shared/DateSystemToggle";
import { useDateSystem } from "@/lib/context/DateSystemContext";
import {
  buildMonthWeeks,
  getPeriodLabel,
  getPrimaryDayNumber,
  getSecondaryDayLabel,
  getWeekdayLabelFromIso,
  isWeekendIso,
  resolveDayIso,
  shiftAdMonth,
  shiftBsPeriod,
  getPeriodDays,
  type CalendarPeriod,
} from "@/lib/dates/attendance-calendar";
import { todayIsoDate } from "@/lib/dates";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export interface DaySummary {
  present: number;
  absent: number;
  late: number;
  leave: number;
  halfDay: number;
  unmarked: number;
  total: number;
}

interface AttendanceMonthCalendarProps {
  period: CalendarPeriod;
  selectedDay: number | null;
  onSelectDay: (day: number) => void;
  onPeriodChange: (period: CalendarPeriod) => void;
  getDaySummary: (day: number) => DaySummary;
}

function cellTint(summary: DaySummary, weekend: boolean, isFuture: boolean) {
  if (isFuture) return "bg-gray-50/50 dark:bg-muted/20 border-gray-100 dark:border-border";
  if (weekend) return "bg-gray-50 dark:bg-muted/30 border-gray-100 dark:border-border";
  if (summary.total === 0) return "bg-white dark:bg-card border-gray-100 dark:border-border";

  const marked = summary.total - summary.unmarked;
  if (marked === 0) return "bg-white dark:bg-card border-gray-100 dark:border-border";

  const rate = (summary.present + summary.late + summary.halfDay * 0.5) / summary.total;
  if (rate >= 0.85) return "bg-green-50 dark:bg-green-500/10 border-green-100 dark:border-green-500/20";
  if (rate >= 0.6) return "bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20";
  return "bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20";
}

export function AttendanceMonthCalendar({
  period,
  selectedDay,
  onSelectDay,
  onPeriodChange,
  getDaySummary,
}: AttendanceMonthCalendarProps) {
  const { dateSystem } = useDateSystem();
  const weeks = useMemo(() => buildMonthWeeks(period), [period]);
  const monthLabel = getPeriodLabel(period);
  const todayIso = todayIsoDate();

  const handlePrev = () => {
    if (period.system === "AD") {
      onPeriodChange({ system: "AD", yearMonth: shiftAdMonth(period.yearMonth, -1) });
      return;
    }
    const next = shiftBsPeriod(period.year, period.monthIndex, -1);
    onPeriodChange({ system: "BS", ...next });
  };

  const handleNext = () => {
    if (period.system === "AD") {
      onPeriodChange({ system: "AD", yearMonth: shiftAdMonth(period.yearMonth, 1) });
      return;
    }
    const next = shiftBsPeriod(period.year, period.monthIndex, 1);
    onPeriodChange({ system: "BS", ...next });
  };

  return (
    <div className={`${hrCardClass} overflow-hidden`}>
      <div className="flex flex-col gap-3 border-b border-gray-100 dark:border-border px-4 py-4 sm:px-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-foreground">Calendar</h2>
          <p className="text-xs text-gray-500 dark:text-muted-foreground mt-0.5">
            {monthLabel}
            <span className="ml-2 text-[10px] uppercase tracking-wide text-gray-400 dark:text-muted-foreground">
              {dateSystem}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DateSystemToggle />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={handlePrev}
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={handleNext}
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
          {WEEKDAYS.map((label) => (
            <div
              key={label}
              className="text-center text-[11px] font-medium text-gray-500 dark:text-muted-foreground py-1"
            >
              {label}
            </div>
          ))}
        </div>

        <div className="space-y-1 sm:space-y-2">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 gap-1 sm:gap-2">
              {week.map((day, dayIndex) => {
                if (!day) {
                  return <div key={`empty-${weekIndex}-${dayIndex}`} className="min-h-[72px] sm:min-h-[88px]" />;
                }

                const iso = resolveDayIso(period, day);
                const summary = getDaySummary(day);
                const weekend = isWeekendIso(iso);
                const isToday = iso === todayIso;
                const isFuture = iso > todayIso;
                const isSelected = selectedDay === day;
                const marked = summary.total - summary.unmarked;
                const secondaryLabel = getSecondaryDayLabel(period, day);

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => onSelectDay(day)}
                    className={`min-h-[72px] sm:min-h-[88px] rounded-lg border p-2 text-left transition-all hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E]/40 ${cellTint(
                      summary,
                      weekend,
                      isFuture
                    )} ${isSelected ? "ring-2 ring-[#22C55E] shadow-sm" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div className="min-w-0">
                        <span
                          className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                            isToday
                              ? "bg-[#22C55E] text-white"
                              : "text-gray-900 dark:text-foreground"
                          }`}
                        >
                          {getPrimaryDayNumber(period, day)}
                        </span>
                        {secondaryLabel ? (
                          <p className="text-[10px] text-gray-400 dark:text-muted-foreground mt-0.5 truncate">
                            {secondaryLabel}
                          </p>
                        ) : null}
                      </div>
                      {marked > 0 ? (
                        <span className="text-[10px] font-medium text-gray-500 dark:text-muted-foreground">
                          {summary.present + summary.late}/{summary.total}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-2 space-y-0.5">
                      {summary.absent > 0 ? (
                        <p className="text-[10px] text-red-600 dark:text-red-400">{summary.absent} absent</p>
                      ) : null}
                      {summary.late > 0 ? (
                        <p className="text-[10px] text-amber-600 dark:text-amber-400">{summary.late} late</p>
                      ) : null}
                      {summary.leave > 0 ? (
                        <p className="text-[10px] text-blue-600 dark:text-blue-400">{summary.leave} leave</p>
                      ) : null}
                      {marked === 0 && !isFuture ? (
                        <p className="text-[10px] text-gray-400 dark:text-muted-foreground">No records</p>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function getWeekdayLabelForPeriod(period: CalendarPeriod, day: number) {
  return getWeekdayLabelFromIso(resolveDayIso(period, day));
}

export { resolveDayIso, getPeriodDays };
