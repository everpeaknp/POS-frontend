'use client';

import { KhataSpinner } from "@/components/shared/KhataSpinner";

import { FormattedDate } from "@/components/shared/FormattedDate";
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  ConstructionPageShell,
  constructionCardClass,
  constructionStatCardClass,
} from '@/components/dashboard/ConstructionPageShell';
import { constructionApi, Site } from '@/lib/api/construction';
import { formatNPR } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function SiteDetailPage() {
  const router = useRouter();
  const params = useParams();
  const siteId = params.id as string;

  const [site, setSite] = useState<Site | null>(null);
  const [siteDashboard, setSiteDashboard] = useState<{
    workers?: { total_active?: number };
    attendance?: { present?: number; absent?: number; half_day?: number; overtime?: number };
    material_consumption?: { last_30_days?: number };
    daily_logs?: { total?: number };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (siteId) {
      fetchSite();
    }
  }, [siteId]);

  const fetchSite = async () => {
    try {
      setLoading(true);
      const [siteData, dashboardData] = await Promise.all([
        constructionApi.sites.get(siteId),
        constructionApi.sites.dashboard(siteId),
      ]);
      setSite(siteData);
      setSiteDashboard(dashboardData);
    } catch (error: any) {
      console.error('Failed to fetch site:', error);
      toast.error('Failed to load site details');
      router.push('/dashboard/construction/sites');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await constructionApi.sites.delete(siteId);
      toast.success('Site deleted successfully');
      router.push('/dashboard/construction/sites');
    } catch (error: any) {
      console.error('Failed to delete site:', error);
      toast.error(error.response?.data?.detail || 'Failed to delete site');
      setDeleting(false);
      setDeleteModalOpen(false);
    }
  };

  const getBudgetHealthColor = (percentage: number) => {
    if (percentage < 80) return 'text-green-600 bg-green-50 border-green-200';
    if (percentage < 100) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getBudgetHealthLabel = (percentage: number) => {
    if (percentage < 80) return 'Healthy';
    if (percentage < 100) return 'Warning';
    return 'Over Budget';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'planned':
        return 'bg-blue-100 text-blue-800';
      case 'on_hold':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <ConstructionPageShell title="Site Details" subtitle="Loading site information…" loading />
    );
  }

  if (!site) {
    return (
      <ConstructionPageShell title="Site Not Found" subtitle="This site could not be loaded">
        <div className={`${constructionCardClass} p-12 text-center`}>
          <p className="text-gray-500">Site not found</p>
          <Link
            href="/dashboard/construction/sites"
            className="mt-4 inline-block text-[#22C55E] hover:text-[#16A34A]"
          >
            Back to Sites
          </Link>
        </div>
      </ConstructionPageShell>
    );
  }

  return (
    <ConstructionPageShell
      title={site.name}
      subtitle={[site.location, site.client_name ? `Client: ${site.client_name}` : null]
        .filter(Boolean)
        .join(' · ')}
      showBack
      backHref="/dashboard/construction/sites"
      backLabel="Back to Sites"
      action={
        <div className="flex gap-2">
          <Link href={`/dashboard/construction/sites/${siteId}/edit`}>
            <Button size="sm" className="h-9 bg-[#22C55E] hover:bg-[#16A34A] text-white">
              Edit Site
            </Button>
          </Link>
          <Button
            size="sm"
            variant="destructive"
            className="h-9"
            onClick={() => setDeleteModalOpen(true)}
          >
            Delete
          </Button>
        </div>
      }
    >
      <div className="space-y-4 w-full">
        {siteDashboard && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className={constructionStatCardClass}>
              <p className="text-xs text-gray-500 dark:text-muted-foreground">Active Workers</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-foreground">{siteDashboard.workers?.total_active ?? 0}</p>
            </div>
            <div className={constructionStatCardClass}>
              <p className="text-xs text-gray-500 dark:text-muted-foreground">Present (7 days)</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{siteDashboard.attendance?.present ?? 0}</p>
            </div>
            <div className={constructionStatCardClass}>
              <p className="text-xs text-gray-500 dark:text-muted-foreground">Material Logs (30d)</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-foreground">{siteDashboard.material_consumption?.last_30_days ?? 0}</p>
            </div>
            <div className={constructionStatCardClass}>
              <p className="text-xs text-gray-500 dark:text-muted-foreground">Daily Logs</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-foreground">{siteDashboard.daily_logs?.total ?? 0}</p>
            </div>
          </div>
        )}

        <div className={`${constructionCardClass} p-6`}>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-foreground mb-4">Budget Overview</h2>
        
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm font-medium text-gray-700">Budget Status</span>
          <span
            className={`px-3 py-1 rounded text-sm font-medium border ${getBudgetHealthColor(
              site.budget_percentage ?? 0
            )}`}
          >
            {getBudgetHealthLabel(site.budget_percentage ?? 0)}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="relative pt-1 mb-6">
          <div className="flex mb-2 items-center justify-between">
            <div>
              <span className="text-xs font-semibold inline-block text-gray-600">
                {(site.budget_percentage ?? 0).toFixed(1)}% Used
              </span>
            </div>
          </div>
          <div className="overflow-hidden h-4 mb-4 text-xs flex rounded bg-gray-200">
            <div
              style={{ width: `${Math.min(site.budget_percentage ?? 0, 100)}%` }}
              className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-500 ${
                (site.budget_percentage ?? 0) < 80
                  ? 'bg-green-500'
                  : (site.budget_percentage ?? 0) < 100
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
              }`}
            ></div>
          </div>
        </div>

        {/* Budget Numbers */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Allocated Budget</p>
            <p className="text-xl font-bold text-gray-900">{formatNPR(site.allocated_budget)}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Actual Spend</p>
            <p className="text-xl font-bold text-gray-900">{formatNPR(site.actual_spend ?? 0)}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Remaining</p>
            <p className={`text-xl font-bold ${(site.remaining_budget ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatNPR(site.remaining_budget ?? 0)}
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Budget Used</p>
            <p className="text-xl font-bold text-gray-900">{(site.budget_percentage ?? 0).toFixed(1)}%</p>
          </div>
        </div>

        {/* Alert for Over Budget */}
        {(site.budget_percentage ?? 0) > 80 && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-sm font-medium text-red-800">
                {(site.budget_percentage ?? 0) > 100
                  ? `Over budget by ${formatNPR((site.actual_spend ?? 0) - site.allocated_budget)}`
                  : `Approaching budget limit`}
              </span>
            </div>
          </div>
        )}
        </div>

        <div className={`${constructionCardClass} p-6`}>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Cost Breakdown</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-700">Material Cost</span>
              <span className="font-semibold text-gray-900">{formatNPR(site.material_cost ?? 0)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-700">Labor Cost</span>
              <span className="font-semibold text-gray-900">{formatNPR(site.labor_cost ?? 0)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-700">Other Expenses</span>
              <span className="font-semibold text-gray-900">{formatNPR(site.other_expenses ?? 0)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border-t-2 border-green-200">
              <span className="text-gray-700 font-medium">Total Actual Spend</span>
              <span className="font-bold text-gray-900">{formatNPR(site.actual_spend ?? 0)}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={`${constructionCardClass} p-6`}>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Site Information</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Manager</p>
                <p className="font-medium text-gray-900">{site.manager_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Warehouse</p>
                <p className="font-medium text-gray-900">{site.warehouse_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(site.status)}`}>
                  {site.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          <div className={`${constructionCardClass} p-6`}>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Start Date</p>
                <p className="font-medium text-gray-900"><FormattedDate value={site.start_date} /></p>
              </div>
              {site.estimated_end_date && (
                <div>
                  <p className="text-sm text-gray-500">Estimated End Date</p>
                  <p className="font-medium text-gray-900"><FormattedDate value={site.estimated_end_date} /></p>
                </div>
              )}
              {site.actual_end_date && (
                <div>
                  <p className="text-sm text-gray-500">Actual End Date</p>
                  <p className="font-medium text-gray-900"><FormattedDate value={site.actual_end_date} /></p>
                </div>
              )}
            </div>
          </div>
        </div>

        {site.description && (
          <div className={`${constructionCardClass} p-6`}>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{site.description}</p>
          </div>
        )}
      </div>

      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${constructionCardClass} p-6 max-w-md w-full`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Site</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete <span className="font-semibold">{site.name}</span>? 
              This will permanently remove the site and all associated data.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModalOpen(false)}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {deleting && (
                  <KhataSpinner variant="onPrimary" />
                )}
                {deleting ? 'Deleting...' : 'Delete Site'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConstructionPageShell>
  );
}
