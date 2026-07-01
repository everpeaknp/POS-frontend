'use client';

import { FormattedDate } from "@/components/shared/FormattedDate";
import { useState, useEffect } from 'react';
import { DashHeader } from '@/components/dashboard/dash-header';
import { constructionApi, Site, SiteReport } from '@/lib/api/construction';
import { formatNPR } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function ConstructionReportsPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSite, setSelectedSite] = useState<string>('');
  const [report, setReport] = useState<SiteReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingSites, setLoadingSites] = useState(true);

  useEffect(() => {
    fetchSites();
  }, []);

  const fetchSites = async () => {
    try {
      setLoadingSites(true);
      const sitesData = await constructionApi.sites.list();
      setSites(Array.isArray(sitesData) ? sitesData : []);
    } catch (error: any) {
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
    } catch (error: any) {
      console.error('Failed to generate report:', error);
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const getBudgetHealthColor = (health: string) => {
    const colors: Record<string, string> = {
      'green': 'text-white bg-[#22C55E]',
      'yellow': 'text-white bg-yellow-500',
      'red': 'text-white bg-red-500',
    };
    return colors[health] || 'text-white bg-gray-500';
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <DashHeader
        title="Construction Reports"
        subtitle="Generate detailed budget and cost reports for construction sites"
      />
      <div className="flex-1 overflow-y-auto p-6 space-y-4 w-full">
        {/* Site Selection */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 lg:p-8 w-full">
          <h2 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-4">
            Generate Site Report
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 items-end">
            <div className="sm:col-span-2 lg:col-span-3 xl:col-span-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Site
              </label>
              <select
                value={selectedSite}
                onChange={(e) => setSelectedSite(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
                disabled={loadingSites}
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

        {/* Report Display */}
        {report && (
          <div className="space-y-4 w-full">
            {/* Site Info */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 lg:p-8 w-full">
              <h2 className="text-xl font-bold text-gray-900 mb-4">{report.site_name}</h2>
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

            {/* Budget Overview */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 lg:p-8 w-full">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Budget Overview</h3>
                <span className={`px-4 py-2 rounded-lg font-medium w-fit ${getBudgetHealthColor(report.budget_health)}`}>
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
                  <p className="text-2xl font-bold text-gray-900">
                    {formatNPR(report.allocated_budget)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Actual Spend</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatNPR(report.total_actual_spend)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Remaining Budget</p>
                  <p className={`text-2xl font-bold ${report.remaining_budget >= 0 ? 'text-[#22C55E]' : 'text-red-600'}`}>
                    {formatNPR(report.remaining_budget)}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
              {/* Cost Breakdown */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 lg:p-8 w-full">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost Breakdown</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Material Cost</span>
                    <span className="text-lg font-bold text-gray-900">
                      {formatNPR(report.material_cost)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Labor Cost</span>
                    <span className="text-lg font-bold text-gray-900">
                      {formatNPR(report.labor_cost)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Equipment Cost</span>
                    <span className="text-lg font-bold text-gray-900">
                      {formatNPR(report.equipment_cost)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Other Expenses</span>
                    <span className="text-lg font-bold text-gray-900">
                      {formatNPR(report.other_expenses)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 lg:p-8 w-full">
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
      </div>
    </div>
  );
}
