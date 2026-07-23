"use client";

import { FormattedDate } from "@/components/shared/FormattedDate";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, MoreVertical, CalendarDays, Clock, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { HRPageShell, hrCardClass, hrTableWrapClass, hrStatCardClass } from "@/components/dashboard/HRPageShell";
import { LeaveStatusBadge } from "@/components/hr/LeaveStatusBadge";
import { LeaveBalanceCard } from "@/components/hr/LeaveBalanceCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { getLeaveRequests, getLeaveTypes, setupDefaultLeaveTypes, approveLeaveRequest, rejectLeaveRequest, deleteLeaveRequest, type LeaveRequest, type LeaveType } from "@/lib/api/hr";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function LeavePage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);
  const [settingUpTypes, setSettingUpTypes] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [requestsData, typesData] = await Promise.all([
        getLeaveRequests(),
        getLeaveTypes()
      ]);
      setLeaveRequests(requestsData.results || []);
      setLeaveTypes(typesData);
    } catch (error) {
      console.error('Failed to load leave data:', error);
      toast.error("Failed to load leave data");
    } finally {
      setLoading(false);
    }
  };

  const handleSetupLeaveTypes = async () => {
    try {
      setSettingUpTypes(true);
      const types = await setupDefaultLeaveTypes();
      setLeaveTypes(types);
      toast.success("Default leave types added");
    } catch (error) {
      console.error("Failed to set up leave types:", error);
      toast.error("Failed to set up leave types");
    } finally {
      setSettingUpTypes(false);
    }
  };

  const handleApprove = async (id: string) => {
    const confirmed = await new Promise<boolean>((resolve) => {
      toast((t) => (
        <div className="flex flex-col gap-4 min-w-[320px] p-2">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 text-base">Approve this leave request?</p>
              <p className="text-sm text-gray-600 mt-1">This will grant the employee leave for the requested period.</p>
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => { toast.dismiss(t.id); resolve(false); }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => { toast.dismiss(t.id); resolve(true); }}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
            >
              Approve
            </button>
          </div>
        </div>
      ), {
        duration: Infinity,
        position: 'top-center',
        style: {
          marginTop: '40vh',
          background: 'white',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          borderRadius: '12px',
          padding: '16px',
        },
      });
    });

    if (!confirmed) return;

    try {
      await toast.promise(
        approveLeaveRequest(id),
        {
          loading: 'Approving...',
          success: 'Leave request approved',
          error: 'Failed to approve leave request'
        }
      );
      loadData();
    } catch (error) {
      console.error('Failed to approve leave request:', error);
    }
  };

  const handleReject = async (id: string) => {
    const result = await new Promise<{ confirmed: boolean; reason: string }>((resolve) => {
      let reason = '';
      toast((t) => (
        <div className="flex flex-col gap-4 min-w-[380px] p-2">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 text-base">Reject this leave request?</p>
              <p className="text-sm text-gray-900 mt-1 mb-3">Please provide a reason for rejection:</p>
            </div>
          </div>
          <textarea
            onChange={(e) => reason = e.target.value}
            placeholder="Enter rejection reason..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => { toast.dismiss(t.id); resolve({ confirmed: false, reason: '' }); }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => { toast.dismiss(t.id); resolve({ confirmed: true, reason }); }}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
            >
              Reject
            </button>
          </div>
        </div>
      ), {
        duration: Infinity,
        position: 'top-center',
        style: {
          marginTop: '40vh',
          background: 'white',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          borderRadius: '12px',
          padding: '16px',
        },
      });
    });

    if (!result.confirmed) return;

    try {
      await toast.promise(
        rejectLeaveRequest(id, result.reason),
        {
          loading: 'Rejecting...',
          success: 'Leave request rejected',
          error: 'Failed to reject leave request'
        }
      );
      loadData();
    } catch (error) {
      console.error('Failed to reject leave request:', error);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await new Promise<boolean>((resolve) => {
      toast((t) => (
        <div className="flex flex-col gap-4 min-w-[320px] p-2">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 text-base">Cancel this leave request?</p>
              <p className="text-sm text-gray-600 mt-1">This action cannot be undone.</p>
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => { toast.dismiss(t.id); resolve(false); }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              No, Keep it
            </button>
            <button
              onClick={() => { toast.dismiss(t.id); resolve(true); }}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
            >
              Yes, Cancel
            </button>
          </div>
        </div>
      ), {
        duration: Infinity,
        position: 'top-center',
        style: {
          marginTop: '40vh',
          background: 'white',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          borderRadius: '12px',
          padding: '16px',
        },
      });
    });

    if (!confirmed) return;

    try {
      await toast.promise(
        deleteLeaveRequest(id),
        {
          loading: 'Cancelling...',
          success: 'Leave request cancelled',
          error: 'Failed to cancel leave request'
        }
      );
      loadData();
    } catch (error) {
      console.error('Failed to cancel leave request:', error);
    }
  };

  const filtered = leaveRequests.filter((leave) => {
    const ms = leave.employee_name.toLowerCase().includes(search.toLowerCase());
    return ms && (status === "All" || leave.status === status);
  });

  const stats = {
    pending: leaveRequests.filter((r) => r.status === "pending").length,
    approved: leaveRequests.filter((r) => r.status === "approved").length,
    rejected: leaveRequests.filter((r) => r.status === "rejected").length,
    total: leaveRequests.length,
  };

  const usedByLeaveType = leaveRequests
    .filter((r) => r.status === "approved")
    .reduce<Record<string, number>>((acc, request) => {
      acc[request.leave_type] = (acc[request.leave_type] || 0) + request.days_requested;
      return acc;
    }, {});

  if (!loading && leaveRequests.length === 0) {
    return (
      <HRPageShell title="Leave Management" subtitle="Manage employee leave requests">
        <EmptyState
            icon={CalendarDays}
            title="No leave requests yet"
            description="Employees can apply for leave and managers can approve requests here"
            actionLabel="Apply Leave"
            actionHref="/dashboard/hr/leave/requests/new"
          />
      </HRPageShell>
    );
  }

  return (
    <HRPageShell
      title="Leave Management"
      subtitle={
        loading
          ? "Loading leave data..."
          : `${stats.total} requests · ${leaveTypes.length} leave types`
      }
      loading={loading}
    >
      <div className="flex gap-3 items-center justify-between flex-wrap">
        <div className="flex gap-3 items-center flex-1 min-w-0 flex-wrap">
          <div className="relative flex-1 max-w-md min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by employee..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm border-gray-200 bg-white dark:bg-card dark:border-border"
            />
          </div>
          <Select value={status} onValueChange={(v) => v && setStatus(v)}>
            <SelectTrigger className="h-9 w-40 text-sm border-gray-200 dark:border-border bg-white dark:bg-card shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["All", "pending", "approved", "rejected", "cancelled"].map((s) => (
                <SelectItem key={s} value={s}>
                  {s === "All" ? "All statuses" : s.charAt(0).toUpperCase() + s.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Link href="/dashboard/hr/leave/requests/new" className="shrink-0">
          <Button size="sm" className="h-9 bg-[#22C55E] hover:bg-[#16A34A] text-white gap-1.5">
            <Plus className="h-4 w-4" /> Apply Leave
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={hrStatCardClass}>
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-1">
            <Clock className="h-4 w-4" />
            <p className="text-xs font-medium">Pending</p>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-foreground">{stats.pending}</p>
        </div>
        <div className={hrStatCardClass}>
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-1">
            <CheckCircle2 className="h-4 w-4" />
            <p className="text-xs font-medium">Approved</p>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-foreground">{stats.approved}</p>
        </div>
        <div className={hrStatCardClass}>
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-1">
            <XCircle className="h-4 w-4" />
            <p className="text-xs font-medium">Rejected</p>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-foreground">{stats.rejected}</p>
        </div>
        <div className={hrStatCardClass}>
          <div className="flex items-center gap-2 text-[#22C55E] mb-1">
            <CalendarDays className="h-4 w-4" />
            <p className="text-xs font-medium">Leave Types</p>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-foreground">{leaveTypes.length}</p>
        </div>
      </div>

      <div className={`${hrCardClass} p-4 lg:p-5`}>
        <Tabs defaultValue="requests" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="requests">Leave Requests</TabsTrigger>
            <TabsTrigger value="balances">Leave Balances</TabsTrigger>
          </TabsList>

          <TabsContent value="requests" className="space-y-4 mt-6">
            {filtered.length === 0 ? (
              <div className={`${hrCardClass} p-12 text-center`}>
                <p className="text-gray-500">No leave requests found matching your filters</p>
              </div>
            ) : (
              <div className={`${hrTableWrapClass} overflow-x-auto`}>
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-muted/50 border-b border-gray-100 dark:border-border">
                    <tr>
                      {["Employee", "Type", "From", "To", "Days", "Reason", "Applied On", "Status", "Actions"].map((h) => (
                        <th
                          key={h}
                          className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-muted-foreground uppercase tracking-wider whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-border">
                    {filtered.map((leave) => (
                      <tr key={leave.id} className="hover:bg-gray-50/50 dark:hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-foreground whitespace-nowrap">
                          <Link href={`/dashboard/hr/leave/requests/${leave.id}`} className="hover:text-[#22C55E]">
                            {leave.employee_name}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-muted-foreground whitespace-nowrap">
                          {leave.leave_type_name}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-muted-foreground whitespace-nowrap">
                          <FormattedDate value={leave.start_date} />
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-muted-foreground whitespace-nowrap">
                          <FormattedDate value={leave.end_date} />
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-muted-foreground whitespace-nowrap">
                          {leave.days_requested} days
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-muted-foreground max-w-xs truncate">
                          {leave.reason}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-muted-foreground whitespace-nowrap">
                          <FormattedDate value={leave.created_at} />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <LeaveStatusBadge status={leave.status} />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <DropdownMenu>
                            <DropdownMenuTrigger className="p-1 rounded hover:bg-gray-100 dark:hover:bg-muted focus:outline-none">
                              <MoreVertical className="h-4 w-4 text-gray-400" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem onClick={() => router.push(`/dashboard/hr/leave/requests/${leave.id}`)}>
                                View
                              </DropdownMenuItem>
                              {leave.status === "pending" && (
                                <>
                                  <DropdownMenuItem onClick={() => handleApprove(leave.id)}>Approve</DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-red-600 focus:text-red-600"
                                    onClick={() => handleReject(leave.id)}
                                  >
                                    Reject
                                  </DropdownMenuItem>
                                </>
                              )}
                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                onClick={() => handleDelete(leave.id)}
                              >
                                Cancel
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="balances" className="space-y-4 mt-6">
            {leaveTypes.length === 0 ? (
              <EmptyState
                icon={CalendarDays}
                title="No leave types configured"
                description="Add default leave types (Annual, Sick, Casual) so employees can apply for leave."
                actionLabel={settingUpTypes ? "Adding..." : "Add default leave types"}
                onAction={settingUpTypes ? undefined : handleSetupLeaveTypes}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {leaveTypes.map((type) => (
                  <LeaveBalanceCard
                    key={type.id}
                    type={type.name}
                    used={usedByLeaveType[type.id] || 0}
                    total={type.days_allowed}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </HRPageShell>
  );
}
