'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Construction Sites</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage construction projects with budget tracking and cost monitoring
          </p>
        </div>
        <Link
          href="/dashboard/construction/sites/new"
          className="inline-flex items-center px-4 py-2 bg-[#22C55E] text-white rounded-lg hover:bg-[#16A34A] transition-colors font-medium"
        >
          + New Site
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex gap-2">
          {['all', 'active', 'planned', 'on_hold', 'completed'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === status
                  ? 'bg-[#22C55E] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status === 'all' ? 'All Sites' : status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </button>
          ))}
        </div>
      </div>

      {/* Sites Grid */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : sites.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No construction sites</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new site.</p>
          <div className="mt-6">
            <Link
              href="/dashboard/construction/sites/new"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#22C55E] hover:bg-[#16A34A]"
            >
              + New Site
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {sites.map((site) => (
            <div
              key={site.id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push(`/dashboard/construction/sites/${site.id}`)}
            >
              {/* Site Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900">{site.name}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        site.status
                      )}`}
                    >
                      {site.status.replace('_', ' ').toUpperCase()}
                    </span>
                    <button
                      onClick={(e) => handleEditClick(e, site.id)}
                      className="p-2 text-[#22C55E] hover:bg-green-50 rounded-md transition-colors"
                      title="Edit site"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => handleDeleteClick(e, site)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="Delete site"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-600">{site.location}</p>
                {site.client_name && (
                  <p className="text-sm text-gray-500 mt-1">Client: {site.client_name}</p>
                )}
              </div>

              {/* Budget Speedometer */}
              <div className="p-6 bg-gray-50">
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

              {/* Cost Breakdown */}
              <div className="p-6 border-t border-gray-200">
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

              {/* Site Info */}
              <div className="p-6 bg-gray-50 border-t border-gray-200">
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
                      {new Date(site.start_date).toLocaleDateString()}
                    </p>
                  </div>
                  {site.estimated_end_date && (
                    <div>
                      <p className="text-gray-500">Est. Completion</p>
                      <p className="font-medium text-gray-900">
                        {new Date(site.estimated_end_date).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
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
              This will permanently remove the site and all associated data including attendance records, daily logs, and material consumption.
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
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                {deleting ? 'Deleting...' : 'Delete Site'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
