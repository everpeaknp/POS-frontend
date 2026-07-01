"use client";

import { FormattedDate } from "@/components/shared/FormattedDate";
import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calendar, User, FileText, Clock, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashHeader } from "@/components/dashboard/dash-header";
import { LeaveStatusBadge } from "@/components/hr/LeaveStatusBadge";
import { getLeaveRequest, approveLeaveRequest, rejectLeaveRequest, deleteLeaveRequest, type LeaveRequest } from "@/lib/api/hr";
import toast from "react-hot-toast";

export default function LeaveRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [leaveRequest, setLeaveRequest] = useState<LeaveRequest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaveRequest();
  }, [id]);

  const loadLeaveRequest = async () => {
    try {
      setLoading(true);
      const data = await getLeaveRequest(id);
      setLeaveRequest(data);
    } catch (error) {
      console.error('Failed to load leave request:', error);
      toast.error("Failed to load leave request");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
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
      loadLeaveRequest();
    } catch (error) {
      console.error('Failed to approve leave request:', error);
    }
  };

  const handleReject = async () => {
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
      loadLeaveRequest();
    } catch (error) {
      console.error('Failed to reject leave request:', error);
    }
  };

  const handleDelete = async () => {
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
      router.push('/dashboard/hr/leave');
    } catch (error) {
      console.error('Failed to cancel leave request:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Leave Request Details" subtitle="View leave request information" />
        <div className="flex-1 p-6 flex items-center justify-center">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  if (!leaveRequest) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Leave Request Details" subtitle="View leave request information" />
        <div className="flex-1 p-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
            <p className="text-gray-500">Leave request not found</p>
            <Link href="/dashboard/hr/leave">
              <Button className="mt-4 bg-[#22C55E] hover:bg-[#16A34A]">Back to Leave Management</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Leave Request Details" subtitle="View and manage leave request" />
      <div className="flex-1 p-6">
        <Link href="/dashboard/hr/leave" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to Leave Management
        </Link>

        <div className="max-w-4xl space-y-4">
          {/* Header Card */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{leaveRequest.employee_name}</h2>
                <p className="text-sm text-gray-500 mt-1">{leaveRequest.leave_type_name}</p>
              </div>
              <LeaveStatusBadge status={leaveRequest.status} />
            </div>
          </div>

          {/* Details Card */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Leave Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Employee</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{leaveRequest.employee_name}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Leave Type</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{leaveRequest.leave_type_name}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Start Date</p>
                  <p className="text-sm font-medium text-gray-900 mt-1"><FormattedDate value={leaveRequest.start_date} /></p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">End Date</p>
                  <p className="text-sm font-medium text-gray-900 mt-1"><FormattedDate value={leaveRequest.end_date} /></p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Duration</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{leaveRequest.days_requested} days</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Applied On</p>
                  <p className="text-sm font-medium text-gray-900 mt-1"><FormattedDate value={leaveRequest.created_at} /></p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100">
              <p className="text-sm text-gray-500 mb-2">Reason</p>
              <p className="text-sm text-gray-900 whitespace-pre-wrap">{leaveRequest.reason}</p>
            </div>

            {leaveRequest.status === 'approved' && leaveRequest.approved_by_name && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Approved By</p>
                    <p className="text-sm font-medium text-gray-900 mt-1">{leaveRequest.approved_by_name}</p>
                    {leaveRequest.approved_at && (
                      <p className="text-xs text-gray-500 mt-1">on <FormattedDate value={leaveRequest.approved_at} /></p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {leaveRequest.status === 'rejected' && leaveRequest.rejection_reason && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                    <XCircle className="h-5 w-5 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 mb-2">Rejection Reason</p>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{leaveRequest.rejection_reason}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          {leaveRequest.status === 'pending' && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
              <div className="flex gap-3">
                <Button 
                  onClick={handleApprove}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
                <Button 
                  onClick={handleReject}
                  variant="outline"
                  className="border-red-600 text-red-600 hover:bg-red-50"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button 
                  onClick={handleDelete}
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel Request
                </Button>
              </div>
            </div>
          )}

          {leaveRequest.status !== 'pending' && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <div className="flex gap-3">
                <Button 
                  onClick={handleDelete}
                  variant="outline"
                  className="border-red-600 text-red-600 hover:bg-red-50"
                >
                  Cancel Request
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
