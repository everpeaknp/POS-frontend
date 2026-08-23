"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowUpCircle,
  ArrowDownCircle,
  Building2,
  Wallet,
  Receipt,
  FolderTree,
  Clock,
  Search,
  Filter,
  Download,
  TrendingUp,
  TrendingDown,
  Users,
  X,
} from "lucide-react";
import { DashHeader } from "@/components/dashboard/dash-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateInput } from "@/components/shared/DateInput";
import { FormattedDate } from "@/components/shared/FormattedDate";
import { useAuth } from "@/lib/context/AuthContext";
import { useApi } from "@/lib/hooks/useApi";
import { personalFinanceDashboardAPI } from "@/lib/api/personal-finance";
import { formatNPR } from "@/lib/utils";

export default function ActivitiesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterAction, setFilterAction] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  const workspaceName = user?.tenant?.workspace_name || user?.tenant?.name || "Workspace";
  const subtitle = `${workspaceName} · Complete activity history`;

  const { data, loading, error } = useApi(
    () => personalFinanceDashboardAPI.get(),
    { immediate: true }
  );

  // Helper function to format relative time
  const getRelativeTime = (timestamp: string) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffInMs = now.getTime() - past.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
    } else if (diffInDays < 30) {
      return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
    } else {
      return past.toLocaleDateString('en-NP', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  // Helper function to get activity icon
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'transaction':
        return Receipt;
      case 'account':
        return Building2;
      case 'budget':
        return Wallet;
      case 'bill':
        return Receipt;
      case 'category':
        return FolderTree;
      case 'party':
        return Users;
      default:
        return Activity;
    }
  };

  // Helper function to get activity color
  const getActivityColor = (type: string, action: string) => {
    if (action === 'deleted') return 'text-red-500 bg-red-50';
    if (action === 'created') return 'text-green-600 bg-green-50';
    if (action === 'updated') return 'text-blue-600 bg-blue-50';
    return 'text-gray-600 bg-gray-50';
  };

  // Helper function to get activity badge color
  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'created':
        return 'bg-green-50 text-green-600 border-green-200';
      case 'updated':
        return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'deleted':
        return 'bg-red-50 text-red-600 border-red-200';
      default:
        return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  const activities = data?.activities || [];

  // Filter activities
  const filteredActivities = activities.filter((activity: any) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesDescription = activity.description.toLowerCase().includes(query);
      const matchesAmount = activity.amount && activity.amount.toString().includes(query);
      if (!matchesDescription && !matchesAmount) return false;
    }

    // Type filter
    if (filterType !== 'all' && activity.type !== filterType) return false;

    // Action filter
    if (filterAction !== 'all' && activity.action !== filterAction) return false;

    // Date range filter
    if (dateFrom && activity.timestamp < dateFrom) return false;
    if (dateTo && activity.timestamp > dateTo) return false;

    return true;
  });

  const hasActiveFilters = searchQuery || filterType !== 'all' || filterAction !== 'all' || dateFrom || dateTo;

  const clearFilters = () => {
    setSearchQuery('');
    setFilterType('all');
    setFilterAction('all');
    setDateFrom('');
    setDateTo('');
  };

  // Group activities by date
  const groupedActivities = filteredActivities.reduce((groups: any, activity: any) => {
    const date = new Date(activity.timestamp).toLocaleDateString('en-NP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(activity);
    return groups;
  }, {});

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Activities" subtitle={subtitle} />
        <div className="flex-1 p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#22C55E] mx-auto mb-4"></div>
            <p className="text-gray-500">Loading activities...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Activities" subtitle={subtitle} />
        <div className="flex-1 p-6 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">Failed to load activities</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full bg-gray-50">
      <DashHeader title="Activities" subtitle={subtitle} />

      <div className="flex-1 p-6 space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Activities</p>
                <p className="text-2xl font-bold text-gray-900">{activities.length}</p>
              </div>
              <Activity className="h-8 w-8 text-gray-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Created</p>
                <p className="text-2xl font-bold text-green-600">
                  {activities.filter((a: any) => a.action === 'created').length}
                </p>
              </div>
              <ArrowUpCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Updated</p>
                <p className="text-2xl font-bold text-blue-600">
                  {activities.filter((a: any) => a.action === 'updated').length}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Deleted</p>
                <p className="text-2xl font-bold text-red-600">
                  {activities.filter((a: any) => a.action === 'deleted').length}
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-500" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search activities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="transaction">Transactions</SelectItem>
                <SelectItem value="account">Accounts</SelectItem>
                <SelectItem value="category">Categories</SelectItem>
                <SelectItem value="budget">Budgets</SelectItem>
                <SelectItem value="party">Parties</SelectItem>
                <SelectItem value="bill">Bills</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterAction} onValueChange={setFilterAction}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="created">Created</SelectItem>
                <SelectItem value="updated">Updated</SelectItem>
                <SelectItem value="deleted">Deleted</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <DateInput
                value={dateFrom}
                onChange={setDateFrom}
                placeholder="From date"
                className="w-[150px]"
              />
              <span className="text-sm text-gray-400">to</span>
              <DateInput
                value={dateTo}
                onChange={setDateTo}
                placeholder="To date"
                className="w-[150px]"
              />
            </div>

            {hasActiveFilters && (
              <Button
                variant="outline"
                size="icon"
                onClick={clearFilters}
                title="Clear filters"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Activities Timeline */}
        {filteredActivities.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <Activity className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">
              {hasActiveFilters ? "No activities match your filters" : "No activities yet"}
            </p>
            {hasActiveFilters && (
              <Button onClick={clearFilters} variant="outline">
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedActivities).map(([date, dateActivities]: [string, any]) => (
              <div key={date} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700">{date}</h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {dateActivities.map((activity: any, idx: number) => {
                    const IconComponent = getActivityIcon(activity.type);
                    const colorClasses = getActivityColor(activity.type, activity.action);
                    
                    return (
                      <div key={idx} className="px-4 py-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start gap-4">
                          <div className={`p-2.5 rounded-lg ${colorClasses} shrink-0`}>
                            <IconComponent className="h-5 w-5" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3 mb-1">
                              <p className="text-sm font-medium text-gray-900">
                                {activity.description}
                              </p>
                              <Badge 
                                variant="outline" 
                                className={`shrink-0 ${getActionBadgeColor(activity.action)}`}
                              >
                                {activity.action}
                              </Badge>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                              <span className="inline-flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {getRelativeTime(activity.timestamp)}
                              </span>
                              
                              <Badge variant="outline" className="text-xs">
                                {activity.type}
                              </Badge>
                              
                              {activity.amount && (
                                <span className={`font-semibold ${
                                  activity.description.toLowerCase().includes('expense')
                                    ? 'text-red-600'
                                    : activity.description.toLowerCase().includes('income')
                                    ? 'text-green-600'
                                    : 'text-gray-900'
                                }`}>
                                  {formatNPR(activity.amount)}
                                </span>
                              )}
                              
                              <span className="text-gray-400">
                                <FormattedDate value={activity.timestamp} />
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Show result count */}
        {filteredActivities.length > 0 && (
          <div className="text-center text-sm text-gray-500">
            Showing {filteredActivities.length} of {activities.length} activities
          </div>
        )}
      </div>
    </div>
  );
}
