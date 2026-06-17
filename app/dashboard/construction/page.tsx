'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { constructionApi, Site } from '@/lib/api/construction';
import { formatNPR } from '@/lib/utils';
import toast from 'react-hot-toast';

interface DashboardStats {
  total_sites: number;
  active_sites: number;
  total_workers: number;
  active_workers: number;
  sites_on_budget: number;
  sites_over_budget: number;
  total_allocated_budget: number;
  total_actual_spend: number;
}

export default function ConstructionDashboardPage() {
  const router = useRouter();
  const [sites, setSites] = useState<Site[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all sites
      const sitesData = await constructionApi.sites.list();
      const sitesArray = Array.isArray(sitesData) ? sitesData : [];
      setSites(sitesArray);
      
      // Fetch workers
      const workersData = await constructionApi.workers.list();
      const workersArray = Array.isArray(workersData) ? workersData : [];
      
      // Calculate stats
      const activeSites = sitesArray.filter(s => s.status === 'active');
      const activeWorkers = workersArray.filter(w => w.status === 'active');
      
      const sitesOnBudget = sitesArray.filter(s => (s.budget_percentage ?? 0) < 100).length;
      const sitesOverBudget = sitesArray.filter(s => (s.budget_percentage ?? 0) >= 100).length;
      
      const totalAllocatedBudget = sitesArray.reduce((sum, s) => sum + s.allocated_budget, 0);
      const totalActualSpend = sitesArray.reduce((sum, s) => sum + (s.actual_spend ?? 0), 0);
      
      setStats({
        total_sites: sitesArray.length,
        active_sites: activeSites.length,
        total_workers: workersArray.length,
        active_workers: activeWorkers.length,
        sites_on_budget: sitesOnBudget,
        sites_over_budget: sitesOverBudget,
        total_allocated_budget: totalAllocatedBudget,
        total_actual_spend: totalActualSpend,
      });
    } catch (error: any) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#22C55E]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Construction Module</h1>
        <p className="mt-2 text-gray-600">
          Manage construction projects with budget tracking, labor management, and site operations
        </p>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Sites */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Sites</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total_sites}</p>
                <p className="text-sm text-gray-500 mt-1">{stats.active_sites} active</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
          </div>

          {/* Total Workers */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Workers</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total_workers}</p>
                <p className="text-sm text-gray-500 mt-1">{stats.active_workers} active</p>
              </div>
              <div className="p-3 bg-[#22C55E] bg-opacity-10 rounded-lg">
                <svg className="w-8 h-8 text-[#22C55E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>


          {/* Budget Health */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Budget Health</p>
                <p className="text-3xl font-bold text-[#22C55E] mt-2">{stats.sites_on_budget}</p>
                <p className="text-sm text-gray-500 mt-1">on budget</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            {stats.sites_over_budget > 0 && (
              <div className="mt-3 p-2 bg-red-50 rounded-md">
                <p className="text-xs text-red-700 font-medium">
                  {stats.sites_over_budget} site{stats.sites_over_budget > 1 ? 's' : ''} over budget
                </p>
              </div>
            )}
          </div>

          {/* Total Budget */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Budget</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{formatNPR(stats.total_allocated_budget)}</p>
                <p className="text-sm text-gray-500 mt-1">Spent: {formatNPR(stats.total_actual_spend)}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/dashboard/construction/sites/new"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-900">New Site</p>
              <p className="text-sm text-gray-600">Create project</p>
            </div>
          </div>
        </Link>


        <Link
          href="/dashboard/construction/workers/new"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#22C55E] bg-opacity-10 rounded-lg group-hover:bg-opacity-20 transition-colors">
              <svg className="w-6 h-6 text-[#22C55E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-900">New Worker</p>
              <p className="text-sm text-gray-600">Add workforce</p>
            </div>
          </div>
        </Link>

        <Link
          href="/dashboard/construction/attendance"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Mark Attendance</p>
              <p className="text-sm text-gray-600">Daily tracking</p>
            </div>
          </div>
        </Link>

        <Link
          href="/dashboard/construction/daily-logs/new"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-900">New Daily Log</p>
              <p className="text-sm text-gray-600">Log progress</p>
            </div>
          </div>
        </Link>
      </div>


      {/* Active Sites Overview */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Active Construction Sites</h2>
            <Link
              href="/dashboard/construction/sites"
              className="text-sm text-[#22C55E] hover:text-[#16A34A] font-medium"
            >
              View All →
            </Link>
          </div>
        </div>

        {sites.filter(s => s.status === 'active').length === 0 ? (
          <div className="p-12 text-center">
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
            <h3 className="mt-2 text-sm font-medium text-gray-900">No active sites</h3>
            <p className="mt-1 text-sm text-gray-500">Create a new construction site to get started.</p>
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
          <div className="divide-y divide-gray-200">
            {sites.filter(s => s.status === 'active').slice(0, 5).map((site) => (
              <div
                key={site.id}
                className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => router.push(`/dashboard/construction/sites/${site.id}`)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{site.name}</h3>
                    <p className="text-sm text-gray-600">{site.location}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded text-xs font-medium border ${getBudgetHealthColor(
                      site.budget_percentage ?? 0
                    )}`}
                  >
                    {getBudgetHealthLabel(site.budget_percentage ?? 0)}
                  </span>
                </div>


                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Budget: {formatNPR(site.allocated_budget)}</span>
                    <span>{(site.budget_percentage ?? 0).toFixed(1)}% Used</span>
                  </div>
                  <div className="overflow-hidden h-2 rounded-full bg-gray-200">
                    <div
                      style={{ width: `${Math.min(site.budget_percentage ?? 0, 100)}%` }}
                      className={`h-full transition-all duration-500 ${
                        (site.budget_percentage ?? 0) < 80
                          ? 'bg-[#22C55E]'
                          : (site.budget_percentage ?? 0) < 100
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                    ></div>
                  </div>
                </div>

                {/* Cost Summary */}
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Material</p>
                    <p className="font-semibold text-gray-900">{formatNPR(site.material_cost ?? 0)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Labor</p>
                    <p className="font-semibold text-gray-900">{formatNPR(site.labor_cost ?? 0)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Remaining</p>
                    <p className={`font-semibold ${(site.remaining_budget ?? 0) >= 0 ? 'text-[#22C55E]' : 'text-red-600'}`}>
                      {formatNPR(site.remaining_budget ?? 0)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/dashboard/construction/sites"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Manage Sites</p>
              <p className="text-sm text-gray-600">View all projects</p>
            </div>
          </div>
        </Link>


        <Link
          href="/dashboard/construction/workers"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#22C55E] bg-opacity-10 rounded-lg">
              <svg className="w-6 h-6 text-[#22C55E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Manage Workers</p>
              <p className="text-sm text-gray-600">View workforce</p>
            </div>
          </div>
        </Link>

        <Link
          href="/dashboard/construction/reports"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-900">View Reports</p>
              <p className="text-sm text-gray-600">Budget analysis</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
