'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  Users,
  CircleCheck,
  Wallet,
  ClipboardCheck,
  FileText,
  BarChart3,
  ChevronRight,
  HardHat,
  MapPin,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  ConstructionPageShell,
  constructionCardClass,
  constructionStatCardClass,
  constructionTableWrapClass,
} from '@/components/dashboard/ConstructionPageShell';
import { EmptyState } from '@/components/shared/EmptyState';
import { useAuth } from '@/lib/context/AuthContext';
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

const quickActions = [
  {
    href: '/dashboard/construction/sites/new',
    label: 'New Site',
    sub: 'Create project',
    icon: Building2,
    color: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
  },
  {
    href: '/dashboard/construction/workers/new',
    label: 'New Worker',
    sub: 'Add workforce',
    icon: Users,
    color: 'bg-green-50 text-[#22C55E] dark:bg-green-500/10 dark:text-green-400',
  },
  {
    href: '/dashboard/construction/attendance',
    label: 'Mark Attendance',
    sub: 'Daily tracking',
    icon: ClipboardCheck,
    color: 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400',
  },
  {
    href: '/dashboard/construction/daily-logs/new',
    label: 'New Daily Log',
    sub: 'Log progress',
    icon: FileText,
    color: 'bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400',
  },
];

const moduleLinks = [
  {
    href: '/dashboard/construction/sites',
    label: 'Manage Sites',
    sub: 'View all projects',
    icon: Building2,
    color: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
  },
  {
    href: '/dashboard/construction/workers',
    label: 'Manage Workers',
    sub: 'View workforce',
    icon: HardHat,
    color: 'bg-green-50 text-[#22C55E] dark:bg-green-500/10 dark:text-green-400',
  },
  {
    href: '/dashboard/accounting/journal-entries',
    label: 'Journal Entries',
    sub: 'View GL entries',
    icon: FileText,
    color: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
  },
  {
    href: '/dashboard/construction/reports',
    label: 'View Reports',
    sub: 'Budget analysis',
    icon: BarChart3,
    color: 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400',
  },
];

function getBudgetHealthColor(percentage: number) {
  if (percentage < 80) return 'text-green-700 bg-green-50 border-green-200';
  if (percentage < 100) return 'text-yellow-700 bg-yellow-50 border-yellow-200';
  return 'text-red-700 bg-red-50 border-red-200';
}

function getBudgetHealthLabel(percentage: number) {
  if (percentage < 80) return 'Healthy';
  if (percentage < 100) return 'Warning';
  return 'Over Budget';
}

function getProgressBarColor(percentage: number) {
  if (percentage < 80) return 'bg-[#22C55E]';
  if (percentage < 100) return 'bg-yellow-500';
  return 'bg-red-500';
}

export default function ConstructionDashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [sites, setSites] = useState<Site[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const workspaceName =
    user?.tenant?.workspace_name || user?.tenant?.name || 'Workspace';
  const subtitle = `${workspaceName} · Budget tracking, labor, and site operations`;

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const sitesData = await constructionApi.sites.list();
      const sitesArray = Array.isArray(sitesData) ? sitesData : [];
      setSites(sitesArray);

      const workersData = await constructionApi.workers.list();
      const workersArray = Array.isArray(workersData) ? workersData : [];

      const activeSites = sitesArray.filter((s) => s.status === 'active');
      const activeWorkers = workersArray.filter((w) => w.status === 'active');
      const sitesOnBudget = sitesArray.filter((s) => (s.budget_percentage ?? 0) < 100).length;
      const sitesOverBudget = sitesArray.filter((s) => (s.budget_percentage ?? 0) >= 100).length;
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
    } catch (error: unknown) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const activeSites = useMemo(
    () => sites.filter((s) => s.status === 'active'),
    [sites]
  );

  const budgetChartData = useMemo(
    () =>
      activeSites.slice(0, 8).map((site) => ({
        name: site.name.length > 14 ? `${site.name.slice(0, 14)}…` : site.name,
        allocated: site.allocated_budget,
        spent: site.actual_spend ?? 0,
      })),
    [activeSites]
  );

  const statCards = stats
    ? [
        {
          label: 'Total Sites',
          value: stats.total_sites.toString(),
          sub: `${stats.active_sites} active`,
          icon: Building2,
          color: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
        },
        {
          label: 'Total Workers',
          value: stats.total_workers.toString(),
          sub: `${stats.active_workers} active`,
          icon: Users,
          color: 'bg-green-50 text-[#22C55E] dark:bg-green-500/10 dark:text-green-400',
        },
        {
          label: 'Budget Health',
          value: stats.sites_on_budget.toString(),
          sub:
            stats.sites_over_budget > 0
              ? `${stats.sites_over_budget} over budget`
              : 'on budget',
          icon: CircleCheck,
          color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
        },
        {
          label: 'Total Budget',
          value: formatNPR(stats.total_allocated_budget),
          sub: `Spent: ${formatNPR(stats.total_actual_spend)}`,
          icon: Wallet,
          color: 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400',
        },
      ]
    : [];

  if (loading) {
    return (
      <ConstructionPageShell title="Construction" subtitle={subtitle} loading />
    );
  }

  return (
    <ConstructionPageShell title="Construction" subtitle={subtitle}>
      <div className="space-y-6 w-full">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((s) => (
              <div key={s.label} className={constructionStatCardClass}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-gray-500 dark:text-muted-foreground">{s.label}</p>
                  <div className={`p-2 rounded-lg ${s.color}`}>
                    <s.icon className="h-4 w-4" />
                  </div>
                </div>
                <p className="text-xl font-bold text-gray-900 dark:text-foreground">{s.value}</p>
                <p
                  className={`text-xs mt-0.5 ${
                    s.label === 'Budget Health' && stats.sites_over_budget > 0
                      ? 'text-red-500 dark:text-red-400'
                      : 'text-gray-400 dark:text-muted-foreground'
                  }`}
                >
                  {s.sub}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Quick actions */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 dark:text-foreground mb-3">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className={`${constructionCardClass} p-4 hover:border-[#22C55E]/30 hover:shadow-md transition-all group`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2.5 rounded-lg ${action.color} group-hover:scale-105 transition-transform`}
                  >
                    <action.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 dark:text-foreground text-sm">{action.label}</p>
                    <p className="text-xs text-gray-500 dark:text-muted-foreground">{action.sub}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Budget chart */}
          <div className={`${constructionCardClass} p-5`}>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-foreground mb-4">
              Budget vs Spend (Active Sites)
            </h3>
            {budgetChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={budgetChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value) => formatNPR(Number(value ?? 0))} />
                  <Legend />
                  <Bar dataKey="allocated" name="Allocated" fill="#93C5FD" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="spent" name="Spent" fill="#22C55E" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[240px] flex items-center justify-center text-gray-400 dark:text-muted-foreground text-sm">
                No active sites to chart
              </div>
            )}
          </div>

          {/* Module links */}
          <div className={`${constructionCardClass} p-5`}>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-foreground mb-4">Module Navigation</h3>
            <div className="space-y-2">
              {moduleLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-50 dark:border-border hover:bg-gray-50 dark:hover:bg-muted/40 hover:border-gray-100 dark:hover:border-border transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${link.color}`}>
                      <link.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-foreground">{link.label}</p>
                      <p className="text-xs text-gray-500 dark:text-muted-foreground">{link.sub}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-300 dark:text-muted-foreground group-hover:text-gray-500 dark:group-hover:text-foreground transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Active sites */}
        <div className={constructionTableWrapClass}>
          <div className="px-5 py-4 border-b border-gray-100 dark:border-border flex justify-between items-center">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-foreground">Active Construction Sites</h2>
            <Link
              href="/dashboard/construction/sites"
              className="text-xs text-[#22C55E] hover:text-[#16A34A] font-medium inline-flex items-center gap-1"
            >
              View all
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {activeSites.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="No active sites"
              description="Create a new construction site to start tracking budgets, labor, and daily progress."
              actionLabel="New Site"
              actionHref="/dashboard/construction/sites/new"
            />
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-border">
              {activeSites.slice(0, 5).map((site) => {
                const pct = site.budget_percentage ?? 0;
                return (
                  <button
                    key={site.id}
                    type="button"
                    className="w-full text-left p-5 hover:bg-gray-50 dark:hover:bg-muted/30 transition-colors"
                    onClick={() => router.push(`/dashboard/construction/sites/${site.id}`)}
                  >
                    <div className="flex justify-between items-start gap-4 mb-3">
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-foreground truncate">
                          {site.name}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate">{site.location}</span>
                        </p>
                      </div>
                      <span
                        className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getBudgetHealthColor(pct)}`}
                      >
                        {getBudgetHealthLabel(pct)}
                      </span>
                    </div>

                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-gray-500 dark:text-muted-foreground mb-1">
                        <span>Budget: {formatNPR(site.allocated_budget)}</span>
                        <span>{pct.toFixed(1)}% used</span>
                      </div>
                      <div className="overflow-hidden h-1.5 rounded-full bg-gray-100 dark:bg-muted">
                        <div
                          style={{ width: `${Math.min(pct, 100)}%` }}
                          className={`h-full transition-all duration-500 ${getProgressBarColor(pct)}`}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-xs">
                      <div>
                        <p className="text-gray-500 dark:text-muted-foreground">Material</p>
                        <p className="font-semibold text-gray-900 dark:text-foreground">
                          {formatNPR(site.material_cost ?? 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-muted-foreground">Labor</p>
                        <p className="font-semibold text-gray-900 dark:text-foreground">
                          {formatNPR(site.labor_cost ?? 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-muted-foreground">Remaining</p>
                        <p
                          className={`font-semibold ${
                            (site.remaining_budget ?? 0) >= 0
                              ? 'text-[#22C55E]'
                              : 'text-red-600'
                          }`}
                        >
                          {formatNPR(site.remaining_budget ?? 0)}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </ConstructionPageShell>
  );
}
