"use client";

import { FormattedDate } from "@/components/shared/FormattedDate";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DashHeader } from "@/components/dashboard/dash-header";
import { LeaveStatusBadge } from "@/components/hr/LeaveStatusBadge";
import { LeaveBalanceCard } from "@/components/hr/LeaveBalanceCard";
import { getLeaveRequests, getLeaveTypes, approveLeaveRequest, rejectLeaveRequest, deleteLeaveRequest, type LeaveRequest, type LeaveType } from "@/lib/api/hr";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function LeavePage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);

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
      setLeaveTypes(typesData.results || []);
    } catch (error) {
      console.error('Failed to load leave data:', error);
      toast.error("Failed to load leave data");
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Leave Management" subtitle="Employee leave requests and balances" />
        <div className="flex-1 p-6 flex items-center justify-center">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Leave Management" subtitle="Employee leave requests and balances" />
      <div className="flex-1 p-6 space-y-4">
        <Tabs defaultValue="requests" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="requests">Leave Requests</TabsTrigger>
            <TabsTrigger value="balances">Leave Balances</TabsTrigger>
          </TabsList>

          {/* Leave Requests Tab */}
          <TabsContent value="requests" className="space-y-4 mt-4">
            <div className="flex flex-wrap items-center gap-3 justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input placeholder="Search requests..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 w-52 text-sm border-gray-200 bg-white" />
                </div>
                <Select value={status} onValueChange={(v) => v && setStatus(v)}>
                  <SelectTrigger className="h-9 w-40 text-sm border-gray-200 bg-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["All", "pending", "approved", "rejected", "cancelled"].map((s) => <SelectItem key={s} value={s}>{s === "All" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Link href="/dashboard/hr/leave/requests/new">
                <Button size="sm" className="h-9 bg-[#22C55E] hover:bg-[#16A34A] text-white gap-1.5">
                  <Plus className="h-4 w-4" /> Apply Leave
                </Button>
              </Link>
            </div>

            {filtered.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
                <p className="text-gray-500">No leave requests found</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {["Employee", "Type", "From", "To", "Days", "Reason", "Applied On", "Status", "Actions"].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.map((leave) => (
                      <tr key={leave.id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 font-medium text-gray-900">
                          <Link href={`/dashboard/hr/leave/requests/${leave.id}`} className="hover:text-[#22C55E]">{leave.employee_name}</Link>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{leave.leave_type_name}</td>
                        <td className="px-4 py-3 text-gray-600">{leave.start_date}</td>
                        <td className="px-4 py-3 text-gray-600">{leave.end_date}</td>
                        <td className="px-4 py-3 text-gray-600">{leave.days_requested} days</td>
                        <td className="px-4 py-3 text-gray-600 truncate max-w-xs">{leave.reason}</td>
                        <td className="px-4 py-3 text-gray-600"><FormattedDate value={leave.created_at} /></td>
                        <td className="px-4 py-3"><LeaveStatusBadge status={leave.status} /></td>
                        <td className="px-4 py-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger className="p-1 rounded hover:bg-gray-100 focus:outline-none">
                              <MoreVertical className="h-4 w-4 text-gray-400" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem onClick={() => router.push(`/dashboard/hr/leave/requests/${leave.id}`)}>View</DropdownMenuItem>
                              {leave.status === "pending" && (
                                <>
                                  <DropdownMenuItem onClick={() => handleApprove(leave.id)}>Approve</DropdownMenuItem>
                                  <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => handleReject(leave.id)}>Reject</DropdownMenuItem>
                                </>
                              )}
                              <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => handleDelete(leave.id)}>Cancel</DropdownMenuItem>
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

          {/* Leave Balances Tab */}
          <TabsContent value="balances" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {leaveTypes.map((type) => (
                <LeaveBalanceCard 
                  key={type.id}
                  type={type.name} 
                  used={0} 
                  total={type.days_allowed} 
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
