import { KhataSpinner } from "@/components/shared/KhataSpinner";
'use client';

import { FormattedDate } from "@/components/shared/FormattedDate";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Building2, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  ConstructionPageShell,
  constructionCardClass,
  constructionFilterPillActive,
  constructionFilterPillInactive,
} from '@/components/dashboard/ConstructionPageShell';
import { EmptyState } from '@/components/shared/EmptyState';
import { constructionApi, Site } from '@/lib/api/construction';
import { formatNPR } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function SitesPage() {
  const router = useRouter();
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [siteToDelete, setSiteToDelete] = useState<Site | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchSites();
  }, [filter]);

  const fetchSites = async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? { status: filter } : {};
      const sitesData = await constructionApi.sites.list(params);
      // Ensure we have an array
      setSites(Array.isArray(sitesData) ? sitesData : []);
    } catch (error: any) {
      console.error('Failed to fetch sites:', error);
      toast.error('Failed to load construction sites');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, site: Site) => {
    e.stopPropagation();
    setSiteToDelete(site);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!siteToDelete) return;

    try {
      setDeleting(true);
      await constructionApi.sites.delete(siteToDelete.id);
      toast.success('Site deleted successfully');
      setSites(sites.filter(s => s.id !== siteToDelete.id));
      setDeleteModalOpen(false);
      setSiteToDelete(null);
    } catch (error: any) {
      console.error('Failed to delete site:', error);
      toast.error(error.response?.data?.detail || 'Failed to delete site');
    } finally {
      setDeleting(false);
    }
  };

  const handleEditClick = (e: React.MouseEvent, siteId: string) => {
    e.stopPropagation();
    router.push(`/dashboard/construction/sites/${siteId}/edit`);
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
      <ConstructionPageShell
        title="Construction Sites"
        subtitle="Manage construction projects with budget tracking and cost monitoring"
        loading
        loadingMessage="Loading sites…"
      />
    );
  }

  if (sites.length === 0 && filter === 'all') {
    return (
      <ConstructionPageShell
        title="Construction Sites"
        subtitle="Manage construction projects with budget tracking and cost monitoring"
      >
        <EmptyState
            icon={Building2}
            title="No construction sites yet"
            description="Create your first site to track budget, labor, and progress."
            actionLabel="New Site"
            actionHref="/dashboard/construction/sites/new"
          />
      </ConstructionPageShell>
    );
  }

  return (
    <ConstructionPageShell
      title="Construction Sites"
      subtitle="Manage construction projects with budget tracking and cost monitoring"
      toolbar={
        <div className="flex flex-wrap gap-2">
          {['all', 'active', 'planned', 'on_hold', 'completed'].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                filter === status
                  ? constructionFilterPillActive
                  : constructionFilterPillInactive
              }`}
            >
              {status === 'all' ? 'All Sites' : status.replace('_', ' ')}
            </button>
          ))}
        </div>
      }
      action={
        <Link href="/dashboard/construction/sites/new">
          <Button size="sm" className="h-9 bg-[#22C55E] hover:bg-[#16A34A] text-white gap-1.5">
            <Plus className="h-4 w-4" />
            New Site
          </Button>
        </Link>
      }
    >
      {sites.length === 0 ? (
        <div className={`${constructionCardClass} p-12 text-center`}>
          <p className="text-gray-500">No sites found matching your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 w-full">
          {sites.map((site) => (
            <div
              key={site.id}
              className={`${constructionCardClass} hover:shadow-md hover:border-[#22C55E]/20 transition-all cursor-pointer w-full overflow-hidden`}
              onClick={() => router.push(`/dashboard/construction/sites/${site.id}`)}
            >
              <div className="p-5 border-b border-gray-100 dark:border-border">
                <div className="flex justify-between items-start gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground truncate">{site.name}</h3>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(site.status)}`}
                    >
                      {site.status.replace('_', ' ').toUpperCase()}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleEditClick(e, site.id)}
                      className="p-2 text-[#22C55E] hover:bg-green-50 dark:hover:bg-green-500/10 rounded-md transition-colors"
                      title="Edit site"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteClick(e, site)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-colors"
                      title="Delete site"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-muted-foreground">{site.location}</p>
                {site.client_name && (
                  <p className="text-sm text-gray-500 dark:text-muted-foreground mt-1">Client: {site.client_name}</p>
                )}
              </div>

              <div className="p-5 bg-gray-50/80 dark:bg-muted/30">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Budget Status</span>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium border ${getBudgetHealthColor(
                      site.budget_percentage ?? 0
                    )}`}
                  >
                    {getBudgetHealthLabel(site.budget_percentage ?? 0)}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="relative pt-1">
                  <div className="flex mb-2 items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold inline-block text-gray-600">
                        {(site.budget_percentage ?? 0).toFixed(1)}% Used
                      </span>
                    </div>
                  </div>
                  <div className="overflow-hidden h-3 mb-4 text-xs flex rounded bg-gray-200">
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
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <p className="text-xs text-gray-500">Allocated Budget</p>
                    <p className="text-lg font-bold text-gray-900">
                      {formatNPR(site.allocated_budget)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Actual Spend</p>
                    <p className="text-lg font-bold text-gray-900">
                      {formatNPR(site.actual_spend ?? 0)}
                    </p>
                  </div>
                </div>

                {/* Red Alert for Over Budget */}
                {(site.budget_percentage ?? 0) > 80 && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-5 h-5 text-red-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
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

              <div className="p-5 border-t border-gray-100 dark:border-border">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Cost Breakdown</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Material Cost:</span>
                    <span className="font-medium text-gray-900">
                      {formatNPR(site.material_cost ?? 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Labor Cost:</span>
                    <span className="font-medium text-gray-900">
                      {formatNPR(site.labor_cost ?? 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Other Expenses:</span>
                    <span className="font-medium text-gray-900">
                      {formatNPR(site.other_expenses ?? 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                    <span className="text-gray-600 font-medium">Remaining:</span>
                    <span
                      className={`font-bold ${
                        (site.remaining_budget ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {formatNPR(site.remaining_budget ?? 0)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-5 bg-gray-50/80 dark:bg-muted/30 border-t border-gray-100 dark:border-border">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Manager</p>
                    <p className="font-medium text-gray-900">{site.manager_name}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Warehouse</p>
                    <p className="font-medium text-gray-900">{site.warehouse_name}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Start Date</p>
                    <p className="font-medium text-gray-900">
                      <FormattedDate value={site.start_date} />
                    </p>
                  </div>
                  {site.estimated_end_date && (
                    <div>
                      <p className="text-gray-500">Est. Completion</p>
                      <p className="font-medium text-gray-900">
                        <FormattedDate value={site.estimated_end_date} />
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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
              Are you sure you want to delete <span className="font-semibold">{siteToDelete?.name}</span>?
              This will permanently remove the site and all associated data.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setSiteToDelete(null);
                }}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
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
