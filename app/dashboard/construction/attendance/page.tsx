"use client";

import { FormattedDate } from "@/components/shared/FormattedDate";
import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Plus,
  HardHat,
  Search,
  CalendarDays,
  TrendingUp,
  Clock,
  UserX,
  ClipboardCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ConstructionPageShell,
  constructionCardClass,
  constructionStatCardClass,
} from "@/components/dashboard/ConstructionPageShell";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  AttendanceMonthCalendar,
  getWeekdayLabelForPeriod,
  type DaySummary,
} from "@/components/hr/AttendanceMonthCalendar";
import { DateSystemToggle } from "@/components/shared/DateSystemToggle";
import { useDateSystem } from "@/lib/context/DateSystemContext";
import {
  adMonthToBsPeriod,
  bsPeriodToAdMonth,
  getAdMonthOptions,
  getAttendanceDateRange,
  getCurrentAdMonth,
  getCurrentBsMonthIndex,
  getCurrentBsYear,
  getPeriodDays,
  getPeriodLabel,
  getTodayDayInPeriod,
  isWeekendIso,
  resolveDayIso,
  type CalendarPeriod,
} from "@/lib/dates/attendance-calendar";
import { BS_YEAR_MAX, BS_YEAR_MIN, NEPALI_MONTHS } from "@/lib/dates";
import { constructionApi, type Attendance, type Site, type Worker } from "@/lib/api/construction";
import { formatNPR } from "@/lib/utils";
import toast from "react-hot-toast";

const STATUS_LEGEND = [
  { key: "present", label: "Present", short: "P", className: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400" },
  { key: "absent", label: "Absent", short: "A", className: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400" },
  { key: "half_day", label: "Half day", short: "H", className: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400" },
  { key: "overtime", label: "Overtime", short: "O", className: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400" },
] as const;

function sameId(a: string | number | null | undefined, b: string | number | null | undefined) {
  if (a === null || a === undefined || a === "") return false;
  if (b === null || b === undefined || b === "") return false;
  return String(a) === String(b);
}

function getStatusDisplay(status: string) {
  const match = STATUS_LEGEND.find((item) => item.key === status);
  return match
    ? { label: match.label, short: match.short, color: match.className }
    : { label: "No record", short: "-", color: "bg-gray-50 text-gray-400 dark:bg-muted/50 dark:text-muted-foreground" };
}

function MarkAttendanceFab({ site }: { site: string }) {
  const href =
    site !== "All"
      ? `/dashboard/construction/attendance/mark?site=${encodeURIComponent(site)}`
      : "/dashboard/construction/attendance/mark";

  return (
    <Link
      href={href}
      className="fixed bottom-8 right-8 w-14 h-14 bg-[#22C55E] hover:bg-[#16A34A] text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-4 focus:ring-green-300 z-50"
      aria-label="Mark attendance"
    >
      <Plus className="h-6 w-6" />
    </Link>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  iconClass,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  iconClass: string;
}) {
  return (
    <div className={constructionStatCardClass}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-gray-500 dark:text-muted-foreground font-medium">{label}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-foreground mt-1">{value}</p>
        </div>
        <div className={`w-10 h-10 rounded-lg shrink-0 flex items-center justify-center ${iconClass}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function computeStats(
  attendanceData: Record<string, Attendance[]>,
  workers: Worker[],
  period: CalendarPeriod,
  site: string,
) {
  const { start, end } = getAttendanceDateRange(period);
  let present = 0;
  let absent = 0;
  let halfDay = 0;
  let overtime = 0;
  const markedDates = new Set<string>();

  workers.forEach((worker) => {
    const records = attendanceData[String(worker.id)] || [];
    records.forEach((record) => {
      if (record.date < start || record.date > end) return;
      if (site !== "All" && !sameId(record.site, site)) return;

      markedDates.add(record.date);
      switch (record.status) {
        case "present":
          present += 1;
          break;
        case "absent":
          absent += 1;
          break;
        case "half_day":
          halfDay += 1;
          break;
        case "overtime":
          overtime += 1;
          break;
        default:
          break;
      }
    });
  });

  const marked = present + absent + halfDay + overtime;
  const avgAttendance =
    marked > 0 ? Math.round(((present + overtime + halfDay * 0.5) / marked) * 100) : 0;

  return {
    working_days: markedDates.size,
    avg_attendance: avgAttendance,
    overtime_days: overtime,
    absences: absent,
  };
}

export default function ConstructionAttendancePage() {
  const { dateSystem } = useDateSystem();
  const [adMonth, setAdMonth] = useState(getCurrentAdMonth());
  const [bsYear, setBsYear] = useState(getCurrentBsYear());
  const [bsMonthIndex, setBsMonthIndex] = useState(getCurrentBsMonthIndex());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [site, setSite] = useState("All");
  const [sites, setSites] = useState<Site[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [attendanceData, setAttendanceData] = useState<Record<string, Attendance[]>>({});
  const [loading, setLoading] = useState(true);

  const period: CalendarPeriod =
    dateSystem === "AD"
      ? { system: "AD", yearMonth: adMonth }
      : { system: "BS", year: bsYear, monthIndex: bsMonthIndex };

  const handlePeriodChange = (next: CalendarPeriod) => {
    if (next.system === "AD") {
      setAdMonth(next.yearMonth);
      const bs = adMonthToBsPeriod(next.yearMonth);
      setBsYear(bs.year);
      setBsMonthIndex(bs.monthIndex);
      return;
    }
    setBsYear(next.year);
    setBsMonthIndex(next.monthIndex);
    setAdMonth(bsPeriodToAdMonth(next.year, next.monthIndex));
  };

  const periodKey =
    period.system === "AD" ? period.yearMonth : `${period.year}-${period.monthIndex}`;

  useEffect(() => {
    if (dateSystem === "BS") {
      const bs = adMonthToBsPeriod(adMonth);
      setBsYear(bs.year);
      setBsMonthIndex(bs.monthIndex);
    } else {
      setAdMonth(bsPeriodToAdMonth(bsYear, bsMonthIndex));
    }
  }, [dateSystem]);

  useEffect(() => {
    setSelectedDay(getTodayDayInPeriod(period) ?? 1);
  }, [periodKey, dateSystem]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const currentPeriod: CalendarPeriod =
        dateSystem === "AD"
          ? { system: "AD", yearMonth: adMonth }
          : { system: "BS", year: bsYear, monthIndex: bsMonthIndex };
      const { start, end } = getAttendanceDateRange(currentPeriod);

      const [sitesData, workersData, attData] = await Promise.all([
        constructionApi.sites.list({ status: "active" }),
        constructionApi.workers.list({ status: "active" }),
        constructionApi.attendance.list({
          date__gte: start,
          date__lte: end,
          ...(site !== "All" ? { site } : {}),
        }),
      ]);

      setSites(Array.isArray(sitesData) ? sitesData : []);
      setWorkers(Array.isArray(workersData) ? workersData : []);

      const grouped: Record<string, Attendance[]> = {};
      (Array.isArray(attData) ? attData : []).forEach((record) => {
        const workerId = String(record.worker);
        if (!grouped[workerId]) grouped[workerId] = [];
        grouped[workerId].push(record);
      });
      setAttendanceData(grouped);
    } catch (error) {
      console.error("Failed to load attendance data:", error);
      toast.error("Failed to load attendance data");
    } finally {
      setLoading(false);
    }
  }, [adMonth, bsYear, bsMonthIndex, dateSystem, site]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredWorkers = useMemo(() => {
    const query = search.toLowerCase();
    return workers.filter((worker) => {
      const matchesSearch =
        worker.name.toLowerCase().includes(query) ||
        String(worker.id).toLowerCase().includes(query) ||
        worker.category.toLowerCase().includes(query) ||
        (worker.assigned_site_name || "").toLowerCase().includes(query);

      const matchesSite =
        site === "All" ||
        !worker.assigned_site ||
        sameId(worker.assigned_site, site);

      return matchesSearch && matchesSite;
    });
  }, [workers, search, site]);

  const getAttendanceForDay = useCallback(
    (workerId: string, day: number) => {
      const records = attendanceData[workerId] || [];
      const dateStr = resolveDayIso(period, day);
      return records.find(
        (r) => r.date === dateStr && (site === "All" || sameId(r.site, site)),
      );
    },
    [attendanceData, period, site],
  );

  const getDaySummary = useCallback(
    (day: number): DaySummary => {
      const summary: DaySummary = {
        present: 0,
        absent: 0,
        late: 0,
        leave: 0,
        halfDay: 0,
        unmarked: 0,
        total: filteredWorkers.length,
      };

      filteredWorkers.forEach((worker) => {
        const record = getAttendanceForDay(String(worker.id), day);
        if (!record) {
          summary.unmarked += 1;
          return;
        }
        switch (record.status) {
          case "present":
            summary.present += 1;
            break;
          case "absent":
            summary.absent += 1;
            break;
          case "half_day":
            summary.halfDay += 1;
            break;
          case "overtime":
            summary.present += 1;
            break;
          default:
            summary.unmarked += 1;
        }
      });

      return summary;
    },
    [filteredWorkers, getAttendanceForDay],
  );

  const getPresentCount = (workerId: string) => {
    const records = attendanceData[workerId] || [];
    const { start, end } = getAttendanceDateRange(period);
    return records.filter(
      (r) =>
        (r.status === "present" || r.status === "overtime") &&
        r.date >= start &&
        r.date <= end &&
        (site === "All" || sameId(r.site, site)),
    ).length;
  };

  const stats = useMemo(
    () => computeStats(attendanceData, filteredWorkers, period, site),
    [attendanceData, filteredWorkers, period, site],
  );

  const daysInMonth = getPeriodDays(period);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const monthLabel = getPeriodLabel(period);
  const hasActiveFilters = Boolean(search) || site !== "All";
  const selectedDayIso = selectedDay ? resolveDayIso(period, selectedDay) : null;
  const bsYearOptions = useMemo(() => {
    const years: number[] = [];
    for (let y = BS_YEAR_MAX; y >= BS_YEAR_MIN; y -= 1) years.push(y);
    return years;
  }, []);

  const markHref = (date?: string) => {
    const params = new URLSearchParams();
    if (date) params.set("date", date);
    if (site !== "All") params.set("site", site);
    const qs = params.toString();
    return `/dashboard/construction/attendance/mark${qs ? `?${qs}` : ""}`;
  };

  if (!loading && workers.length === 0 && !hasActiveFilters) {
    return (
      <>
        <ConstructionPageShell title="Attendance" subtitle="Worker attendance tracking">
          <EmptyState
            icon={HardHat}
            title="No workers to track"
            description="Add workers first, then mark daily attendance for your construction sites"
            actionLabel="Add Worker"
            actionHref="/dashboard/construction/workers/new"
          />
        </ConstructionPageShell>
        <MarkAttendanceFab site={site} />
      </>
    );
  }

  return (
    <>
      <ConstructionPageShell
        title="Attendance"
        subtitle={
          loading
            ? "Loading attendance..."
            : `${monthLabel} · ${filteredWorkers.length} worker${filteredWorkers.length === 1 ? "" : "s"}`
        }
        loading={loading}
        toolbar={
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search workers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 w-52 text-sm border-gray-200 bg-white dark:bg-card dark:border-border"
              />
            </div>
            <Select value={site} onValueChange={(v) => setSite(v ?? "All")}>
              <SelectTrigger className="h-9 w-48 text-sm border-gray-200 bg-white dark:bg-card dark:border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Sites</SelectItem>
                {sites.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {dateSystem === "AD" ? (
              <Select value={adMonth} onValueChange={(v) => v && handlePeriodChange({ system: "AD", yearMonth: v })}>
                <SelectTrigger className="h-9 w-44 text-sm border-gray-200 bg-white dark:bg-card dark:border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getAdMonthOptions().map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <>
                <Select
                  value={NEPALI_MONTHS[bsMonthIndex]}
                  onValueChange={(v) => {
                    const index = NEPALI_MONTHS.indexOf(v as (typeof NEPALI_MONTHS)[number]);
                    if (index >= 0) {
                      handlePeriodChange({ system: "BS", year: bsYear, monthIndex: index });
                    }
                  }}
                >
                  <SelectTrigger className="h-9 w-36 text-sm border-gray-200 bg-white dark:bg-card dark:border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NEPALI_MONTHS.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={String(bsYear)}
                  onValueChange={(v) =>
                    handlePeriodChange({ system: "BS", year: Number(v), monthIndex: bsMonthIndex })
                  }
                >
                  <SelectTrigger className="h-9 w-28 text-sm border-gray-200 bg-white dark:bg-card dark:border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {bsYearOptions.map((y) => (
                      <SelectItem key={y} value={String(y)}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}
            <DateSystemToggle />
            <Link href={markHref()} className="hidden sm:block">
              <Button
                size="sm"
                variant="outline"
                className="h-9 gap-1.5 border-gray-200 dark:border-border"
              >
                <ClipboardCheck className="h-4 w-4" />
                Mark today
              </Button>
            </Link>
          </>
        }
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard
              label="Working days"
              value={stats.working_days}
              icon={CalendarDays}
              iconClass="bg-green-50 text-[#22C55E] dark:bg-green-500/10 dark:text-green-400"
            />
            <StatCard
              label="Avg attendance"
              value={`${stats.avg_attendance}%`}
              icon={TrendingUp}
              iconClass="bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
            />
            <StatCard
              label="Overtime days"
              value={stats.overtime_days}
              icon={Clock}
              iconClass="bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
            />
            <StatCard
              label="Absences"
              value={stats.absences}
              icon={UserX}
              iconClass="bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400"
            />
          </div>

          {filteredWorkers.length === 0 ? (
            <div className={`${constructionCardClass} p-12 text-center text-gray-500 dark:text-muted-foreground`}>
              No workers found matching your filters
            </div>
          ) : (
            <>
              <AttendanceMonthCalendar
                period={period}
                selectedDay={selectedDay}
                onSelectDay={setSelectedDay}
                onPeriodChange={handlePeriodChange}
                getDaySummary={getDaySummary}
              />

              {selectedDay && selectedDayIso ? (
                <div className={`${constructionCardClass} overflow-hidden`}>
                  <div className="flex flex-col gap-3 border-b border-gray-100 dark:border-border px-4 py-4 sm:px-6 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-sm font-semibold text-gray-900 dark:text-foreground">
                        {getWeekdayLabelForPeriod(period, selectedDay)},{" "}
                        <FormattedDate value={selectedDayIso} />
                      </h2>
                      <p className="text-xs text-gray-500 dark:text-muted-foreground mt-0.5">
                        Attendance for selected day
                      </p>
                    </div>
                    <Link href={markHref(selectedDayIso)}>
                      <Button size="sm" variant="outline" className="h-9 gap-1.5">
                        <ClipboardCheck className="h-4 w-4" />
                        Mark this day
                      </Button>
                    </Link>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-muted/40 border-b border-gray-100 dark:border-border">
                        <tr>
                          {["Worker", "Category", "Site", "Status", "Check in", "Check out", "Wage"].map((h) => (
                            <th
                              key={h}
                              className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-muted-foreground"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 dark:divide-border">
                        {filteredWorkers.map((worker) => {
                          const attendance = getAttendanceForDay(String(worker.id), selectedDay);
                          const display = attendance
                            ? getStatusDisplay(attendance.status)
                            : getStatusDisplay("");

                          return (
                            <tr key={worker.id} className="hover:bg-gray-50/50 dark:hover:bg-muted/20">
                              <td className="px-4 py-3 font-medium text-gray-900 dark:text-foreground">
                                <Link
                                  href={`/dashboard/construction/workers/${worker.id}`}
                                  className="hover:text-[#22C55E] transition-colors"
                                >
                                  {worker.name}
                                </Link>
                              </td>
                              <td className="px-4 py-3 text-gray-600 dark:text-muted-foreground capitalize">
                                {worker.category}
                              </td>
                              <td className="px-4 py-3 text-gray-600 dark:text-muted-foreground">
                                {attendance?.site_name || worker.assigned_site_name || "—"}
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${display.color}`}
                                >
                                  {display.label}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-gray-600 dark:text-muted-foreground">
                                {attendance?.check_in?.slice(0, 5) || "—"}
                              </td>
                              <td className="px-4 py-3 text-gray-600 dark:text-muted-foreground">
                                {attendance?.check_out?.slice(0, 5) || "—"}
                              </td>
                              <td className="px-4 py-3 text-gray-900 dark:text-foreground font-medium">
                                {attendance ? formatNPR(attendance.wage_amount) : "—"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}

              <div className={`${constructionCardClass} overflow-hidden`}>
                <div className="flex flex-col gap-4 border-b border-gray-100 dark:border-border px-4 py-4 sm:px-6 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-foreground">
                      Monthly sheet
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-muted-foreground mt-0.5">
                      Worker attendance across {monthLabel.toLowerCase()}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {STATUS_LEGEND.map((item) => (
                      <span
                        key={item.key}
                        className="inline-flex items-center gap-1.5 rounded-full border border-gray-100 dark:border-border bg-gray-50 dark:bg-muted/50 px-2.5 py-1 text-xs text-gray-600 dark:text-muted-foreground"
                      >
                        <span
                          className={`inline-flex h-5 w-5 items-center justify-center rounded text-[10px] font-semibold ${item.className}`}
                        >
                          {item.short}
                        </span>
                        {item.label}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[960px] text-sm">
                    <thead className="bg-gray-50 dark:bg-muted/40 border-b border-gray-100 dark:border-border">
                      <tr>
                        <th
                          rowSpan={2}
                          className="sticky left-0 z-20 bg-gray-50 dark:bg-muted/40 text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-muted-foreground min-w-[180px] border-r border-gray-100 dark:border-border align-bottom"
                        >
                          Worker
                        </th>
                        {days.map((day) => {
                          const dayIso = resolveDayIso(period, day);
                          const weekend = isWeekendIso(dayIso);
                          return (
                            <th
                              key={`wd-${day}`}
                              className={`text-center px-1 py-1 text-[10px] font-medium uppercase tracking-wide min-w-9 ${
                                weekend
                                  ? "text-gray-400 dark:text-muted-foreground bg-gray-100/70 dark:bg-muted/60"
                                  : "text-gray-400 dark:text-muted-foreground"
                              } ${selectedDay === day ? "bg-[#22C55E]/10" : ""}`}
                            >
                              {getWeekdayLabelForPeriod(period, day)}
                            </th>
                          );
                        })}
                        <th
                          rowSpan={2}
                          className="sticky right-0 z-20 bg-gray-50 dark:bg-muted/40 text-center px-4 py-3 text-xs font-medium text-gray-500 dark:text-muted-foreground border-l border-gray-100 dark:border-border align-bottom"
                        >
                          Present
                        </th>
                      </tr>
                      <tr>
                        {days.map((day) => {
                          const dayIso = resolveDayIso(period, day);
                          const weekend = isWeekendIso(dayIso);
                          return (
                            <th
                              key={`d-${day}`}
                              className={`text-center px-1.5 py-2 text-xs font-semibold min-w-9 ${
                                weekend
                                  ? "text-gray-400 dark:text-muted-foreground bg-gray-100/70 dark:bg-muted/60"
                                  : "text-gray-500 dark:text-muted-foreground"
                              } ${selectedDay === day ? "bg-[#22C55E]/10 ring-1 ring-inset ring-[#22C55E]/30" : ""}`}
                            >
                              {day}
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-border">
                      {filteredWorkers.map((worker) => (
                        <tr key={worker.id} className="group hover:bg-gray-50/50 dark:hover:bg-muted/20">
                          <td className="sticky left-0 z-10 bg-white dark:bg-card px-4 py-3 border-r border-gray-100 dark:border-border group-hover:bg-gray-50/50 dark:group-hover:bg-muted/20">
                            <Link
                              href={`/dashboard/construction/workers/${worker.id}`}
                              className="block min-w-0 hover:text-[#22C55E] transition-colors"
                            >
                              <span className="font-medium text-gray-900 dark:text-foreground truncate block">
                                {worker.name}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-muted-foreground truncate block capitalize">
                                {worker.category}
                              </span>
                            </Link>
                          </td>
                          {days.map((day) => {
                            const attendance = getAttendanceForDay(String(worker.id), day);
                            const display = attendance
                              ? getStatusDisplay(attendance.status)
                              : { label: "-", short: "-", color: "bg-transparent text-gray-300 dark:text-muted-foreground/60" };
                            const dayIso = resolveDayIso(period, day);
                            const weekend = isWeekendIso(dayIso);
                            const isSelected = selectedDay === day;

                            return (
                              <td
                                key={day}
                                className={`text-center px-1.5 py-2 cursor-pointer ${
                                  weekend ? "bg-gray-50/80 dark:bg-muted/30" : ""
                                } ${isSelected ? "bg-[#22C55E]/5" : ""}`}
                                onClick={() => setSelectedDay(day)}
                              >
                                <span
                                  className={`inline-flex h-7 w-7 items-center justify-center rounded-md text-[11px] font-semibold ${display.color}`}
                                  title={
                                    attendance
                                      ? `${attendance.status}${attendance.check_in ? ` · ${attendance.check_in}` : ""}`
                                      : "No record"
                                  }
                                >
                                  {display.short}
                                </span>
                              </td>
                            );
                          })}
                          <td className="sticky right-0 z-10 bg-white dark:bg-card px-4 py-3 text-center font-semibold text-gray-900 dark:text-foreground border-l border-gray-100 dark:border-border group-hover:bg-gray-50/50 dark:group-hover:bg-muted/20">
                            {getPresentCount(String(worker.id))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </ConstructionPageShell>
      <MarkAttendanceFab site={site} />
    </>
  );
}
