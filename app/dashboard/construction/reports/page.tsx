'use client';

import { FormattedDate } from '@/components/shared/FormattedDate';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  ConstructionPageShell,
  constructionCardClass,
} from '@/components/dashboard/ConstructionPageShell';
import { PrintableSiteReport } from '@/components/print/PrintableSiteReport';
import { PrintablePayrollSummary } from '@/components/print/PrintablePayrollSummary';
import { constructionApi, Site, SiteReport, SitePayrollSummary } from '@/lib/api/construction';
import { useDateSystem } from '@/lib/context/DateSystemContext';
import { useCompanyInfo } from '@/lib/hooks/useCompanyInfo';
import {
  adMonthToBsPeriod,
  bsPeriodToAdMonth,
  getCurrentBsMonthIndex,
  getCurrentBsYear,
} from '@/lib/dates/attendance-calendar';
import { BS_YEAR_MAX, BS_YEAR_MIN, NEPALI_MONTHS } from '@/lib/dates';
import { formatNPR } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function ConstructionReportsPage() {
  const { dateSystem } = useDateSystem();
  const { companyInfo } = useCompanyInfo();
  const siteReportPrintRef = useRef<HTMLDivElement>(null);
  const payrollPrintRef = useRef<HTMLDivElement>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSite, setSelectedSite] = useState<string>('');
  const [report, setReport] = useState<SiteReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingSites, setLoadingSites] = useState(true);
  const [payrollSite, setPayrollSite] = useState('');
  const [payrollMonth, setPayrollMonth] = useState(() => new Date().getMonth() + 1);
  const [payrollYear, setPayrollYear] = useState(() => new Date().getFullYear());
  const [bsYear, setBsYear] = useState(getCurrentBsYear);
  const [bsMonthIndex, setBsMonthIndex] = useState(getCurrentBsMonthIndex);
  const [payroll, setPayroll] = useState<SitePayrollSummary | null>(null);
  const [loadingPayroll, setLoadingPayroll] = useState(false);

  const handlePrintSiteReport = useReactToPrint({
    contentRef: siteReportPrintRef,
    documentTitle: `SiteReport_${report?.site_name || 'Site'}_${new Date().toISOString().split('T')[0]}`,
  });

  const handlePrintPayroll = useReactToPrint({
    contentRef: payrollPrintRef,
    documentTitle: `Payroll_${payroll?.site_name || 'Site'}_${payroll?.year || ''}_${payroll?.month || ''}`,
  });

  const payrollPeriodLabel = useMemo(() => {
    if (!payroll) return '';
    if (dateSystem === 'BS') {
      return `${NEPALI_MONTHS[bsMonthIndex]} ${bsYear}`;
    }
    return `${new Date(2000, payroll.month - 1, 1).toLocaleString('default', { month: 'long' })} ${payroll.year}`;
  }, [payroll, dateSystem, bsMonthIndex, bsYear]);

  useEffect(() => {
    fetchSites();
  }, []);

  useEffect(() => {
    if (dateSystem === 'BS') {
      const bs = adMonthToBsPeriod(
        `${payrollYear}-${String(payrollMonth).padStart(2, '0')}`
      );
      setBsYear(bs.year);
      setBsMonthIndex(bs.monthIndex);
    } else {
      const adMonth = bsPeriodToAdMonth(bsYear, bsMonthIndex);
      setPayrollYear(Number(adMonth.slice(0, 4)));
      setPayrollMonth(Number(adMonth.slice(5, 7)));
    }
  }, [dateSystem]);

  const syncPayrollFromBs = (year: number, monthIndex: number) => {
    setBsYear(year);
    setBsMonthIndex(monthIndex);
    const adMonth = bsPeriodToAdMonth(year, monthIndex);
    setPayrollYear(Number(adMonth.slice(0, 4)));
    setPayrollMonth(Number(adMonth.slice(5, 7)));
  };

  const bsYearOptions = useMemo(() => {
    const years: number[] = [];
    for (let y = BS_YEAR_MAX; y >= BS_YEAR_MIN; y -= 1) years.push(y);
    return years;
  }, []);

  const adYearOptions = useMemo(() => {
    const years: number[] = [];
    for (let y = 2100; y >= 2020; y -= 1) years.push(y);
    return years;
  }, []);

  const fetchSites = async () => {
    try {
      setLoadingSites(true);
      const sitesData = await constructionApi.sites.list();
      setSites(Array.isArray(sitesData) ? sitesData : []);
    } catch (error: unknown) {
      console.error('Failed to fetch sites:', error);
      toast.error('Failed to load sites');
    } finally {
      setLoadingSites(false);
    }
  };

  const generateReport = async () => {
    if (!selectedSite) {
      toast.error('Please select a site');
      return;
    }

    try {
      setLoading(true);
      const reportData = await constructionApi.sites.generateReport(selectedSite);
      setReport(reportData);
    } catch (error: unknown) {
      console.error('Failed to generate report:', error);
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const loadPayrollSummary = async () => {
    if (!payrollSite) {
      toast.error('Please select a site for payroll');
      return;
    }

    try {
      setLoadingPayroll(true);
      const data = await constructionApi.attendance.payrollSummaryBySite({
        site: payrollSite,
        month: payrollMonth,
        year: payrollYear,
      });
      setPayroll(data);
    } catch (error: unknown) {
      console.error('Failed to load payroll:', error);
      toast.error('Failed to load payroll summary');
    } finally {
      setLoadingPayroll(false);
    }
  };

  const getBudgetHealthColor = (health: string) => {
    const colors: Record<string, string> = {
      green: 'text-white bg-[#22C55E]',
      yellow: 'text-white bg-yellow-500',
      red: 'text-white bg-red-500',
    };
    return colors[health] || 'text-white bg-gray-500';
  };

  return (
    <ConstructionPageShell
      title="Construction Reports"
      subtitle="Generate detailed budget and cost reports for construction sites"
      loading={loadingSites}
    >
      <div className={`${constructionCardClass} p-6 lg:p-8`}>
        <h2 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-4">
          Generate Site Report
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 items-end">
          <div className="sm:col-span-2 lg:col-span-3 xl:col-span-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Site</label>
            <select
              value={selectedSite}
              onChange={(e) => setSelectedSite(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-border rounded-md bg-white dark:bg-card focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
            >
              <option value="">Choose a site...</option>
              {sites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name} - {site.location}
                </option>
              ))}
            </select>
          </div>
          <div>
            <button
              onClick={generateReport}
              disabled={!selectedSite || loading}
              className="w-full px-6 py-2 bg-[#22C55E] text-white rounded-md hover:bg-[#16A34A] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? 'Generating...' : 'Generate Report'}
            </button>
          </div>
        </div>
      </div>

      <div className={`${constructionCardClass} p-6 lg:p-8`}>
        <h2 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-4">
          Monthly Payroll Summary
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Site</label>
            <select
              value={payrollSite}
              onChange={(e) => setPayrollSite(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-border rounded-md bg-white dark:bg-card focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
            >
              <option value="">Choose a site...</option>
              {sites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
            {dateSystem === 'BS' ? (
              <select
                value={NEPALI_MONTHS[bsMonthIndex]}
                onChange={(e) => {
                  const index = NEPALI_MONTHS.indexOf(
                    e.target.value as (typeof NEPALI_MONTHS)[number]
                  );
                  if (index >= 0) syncPayrollFromBs(bsYear, index);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                {NEPALI_MONTHS.map((month) => (
                  <option key={month} value={month}>
                    {month}
                  </option>
                ))}
              </select>
            ) : (
              <select
                value={payrollMonth}
                onChange={(e) => setPayrollMonth(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {new Date(2000, m - 1, 1).toLocaleString('default', { month: 'long' })}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
            {dateSystem === 'BS' ? (
              <select
                value={bsYear}
                onChange={(e) => syncPayrollFromBs(Number(e.target.value), bsMonthIndex)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-border rounded-md bg-white dark:bg-card"
              >
                {bsYearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            ) : (
              <select
                value={payrollYear}
                onChange={(e) => setPayrollYear(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-border rounded-md bg-white dark:bg-card"
              >
                {adYearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div>
            <button
              onClick={loadPayrollSummary}
              disabled={!payrollSite || loadingPayroll}
              className="w-full px-6 py-2 bg-[#22C55E] text-white rounded-md hover:bg-[#16A34A] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loadingPayroll ? 'Loading...' : 'Load Payroll'}
            </button>
          </div>
        </div>

        {payroll && (
          <div className="mt-6 space-y-4">
            <div className="flex flex-wrap justify-between gap-2 items-center">
              <p className="text-sm text-gray-600">
                {payroll.site_name} ·{' '}
                {dateSystem === 'BS' ? (
                  <>
                    <span className="font-medium">
                      {NEPALI_MONTHS[bsMonthIndex]} {bsYear}
                    </span>
                    <span className="text-muted-foreground">
                      {' '}
                      · {payroll.month}/{payroll.year}
                    </span>
                  </>
                ) : (
                  <>
                    {new Date(2000, payroll.month - 1, 1).toLocaleString('default', {
                      month: 'long',
                    })}{' '}
                    {payroll.year}
                  </>
                )}
              </p>
              <div className="flex items-center gap-3">
                <p className="text-lg font-bold text-gray-900">
                  Total: {formatNPR(payroll.total_payroll)}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 h-8"
                  onClick={() => handlePrintPayroll()}
                  disabled={!companyInfo}
                >
                  <Printer className="h-3.5 w-3.5" /> Export PDF
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-gray-500">Worker</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-500">Category</th>
                    <th className="px-4 py-2 text-right font-medium text-gray-500">Present</th>
                    <th className="px-4 py-2 text-right font-medium text-gray-500">Half</th>
                    <th className="px-4 py-2 text-right font-medium text-gray-500">OT</th>
                    <th className="px-4 py-2 text-right font-medium text-gray-500">Total Wage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {payroll.worker_breakdown.map((row) => (
                    <tr key={row.worker_id}>
                      <td className="px-4 py-2">{row.worker_name}</td>
                      <td className="px-4 py-2 capitalize">{row.category}</td>
                      <td className="px-4 py-2 text-right">{row.days_present}</td>
                      <td className="px-4 py-2 text-right">{row.days_half_day}</td>
                      <td className="px-4 py-2 text-right">{row.days_overtime}</td>
                      <td className="px-4 py-2 text-right font-medium">{formatNPR(row.total_wage)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {report && (
        <div className="space-y-4">
          <div className={`${constructionCardClass} p-6 lg:p-8`}>
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
              <h2 className="text-xl font-bold text-gray-900">{report.site_name}</h2>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 h-8"
                onClick={() => handlePrintSiteReport()}
                disabled={!companyInfo}
              >
                <Printer className="h-3.5 w-3.5" /> Export PDF
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Location</p>
                <p className="text-sm font-medium text-gray-900">{report.location}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Client</p>
                <p className="text-sm font-medium text-gray-900">{report.client_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Manager</p>
                <p className="text-sm font-medium text-gray-900">{report.manager}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <span className="inline-block px-2 py-1 text-xs font-medium rounded bg-[#22C55E] text-white">
                  {report.status.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          <div className={`${constructionCardClass} p-6 lg:p-8`}>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Budget Overview</h3>
              <span
                className={`px-4 py-2 rounded-lg font-medium w-fit ${getBudgetHealthColor(report.budget_health)}`}
              >
                {report.budget_health.toUpperCase()} - {report.budget_percentage.toFixed(1)}% Used
              </span>
            </div>

            <div className="mb-6">
              <div className="overflow-hidden h-4 rounded-full bg-gray-200">
                <div
                  style={{ width: `${Math.min(report.budget_percentage, 100)}%` }}
                  className={`h-full transition-all duration-500 ${
                    report.budget_percentage < 80
                      ? 'bg-[#22C55E]'
                      : report.budget_percentage < 100
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Allocated Budget</p>
                <p className="text-2xl font-bold text-gray-900">{formatNPR(report.allocated_budget)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Actual Spend</p>
                <p className="text-2xl font-bold text-gray-900">{formatNPR(report.total_actual_spend)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Remaining Budget</p>
                <p
                  className={`text-2xl font-bold ${report.remaining_budget >= 0 ? 'text-[#22C55E]' : 'text-red-600'}`}
                >
                  {formatNPR(report.remaining_budget)}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className={`${constructionCardClass} p-6 lg:p-8`}>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost Breakdown</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-muted rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Material Cost</span>
                  <span className="text-lg font-bold text-gray-900">{formatNPR(report.material_cost)}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-muted rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Labor Cost</span>
                  <span className="text-lg font-bold text-gray-900">{formatNPR(report.labor_cost)}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-muted rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Equipment Cost</span>
                  <span className="text-lg font-bold text-gray-900">{formatNPR(report.equipment_cost)}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-muted rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Other Expenses</span>
                  <span className="text-lg font-bold text-gray-900">{formatNPR(report.other_expenses)}</span>
                </div>
              </div>
            </div>

            <div className={`${constructionCardClass} p-6 lg:p-8`}>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Timeline</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Start Date:</span>
                  <span className="text-sm font-medium text-gray-900">
                    <FormattedDate value={report.start_date} />
                  </span>
                </div>
                {report.estimated_end_date && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Estimated End Date:</span>
                    <span className="text-sm font-medium text-gray-900">
                      <FormattedDate value={report.estimated_end_date} />
                    </span>
                  </div>
                )}
                {report.actual_end_date && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Actual End Date:</span>
                    <span className="text-sm font-medium text-gray-900">
                      <FormattedDate value={report.actual_end_date} />
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {companyInfo && report && (
        <div className="hidden">
          <PrintableSiteReport ref={siteReportPrintRef} report={report} companyInfo={companyInfo} />
        </div>
      )}
      {companyInfo && payroll && (
        <div className="hidden">
          <PrintablePayrollSummary
            ref={payrollPrintRef}
            payroll={payroll}
            companyInfo={companyInfo}
            periodLabel={payrollPeriodLabel}
          />
        </div>
      )}
    </ConstructionPageShell>
  );
}
