"use client";

import { FormattedDate } from "@/components/shared/FormattedDate";
import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  User,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  CalendarOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  HRPageShell,
  hrCardClass,
  hrStatCardClass,
} from "@/components/dashboard/HRPageShell";
import { LeaveStatusBadge } from "@/components/hr/LeaveStatusBadge";
import {
  getLeaveRequest,
  approveLeaveRequest,
  rejectLeaveRequest,
  deleteLeaveRequest,
  type LeaveRequest,
} from "@/lib/api/hr";
import toast from "react-hot-toast";

function DetailItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 min-w-0">
      <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-gray-50 dark:bg-muted flex items-center justify-center">
        <Icon className="h-4 w-4 text-gray-500 dark:text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 dark:text-muted-foreground">{label}</p>
        <div className="text-sm font-medium text-gray-900 dark:text-foreground mt-0.5 break-words">
          {value}
        </div>
      </div>
    </div>
  );
}

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
      console.error("Failed to load leave request:", error);
      toast.error("Failed to load leave request");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    const confirmed = await new Promise<boolean>((resolve) => {
      toast(
        (t) => (
          <div className="flex flex-col gap-4 min-w-[320px] p-2">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 text-base">Approve this leave request?</p>
                <p className="text-sm text-gray-600 mt-1">
                  This will grant the employee leave for the requested period.
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  resolve(false);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  resolve(true);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
              >
                Approve
              </button>
            </div>
          </div>
        ),
        {
          duration: Infinity,
          position: "top-center",
          style: {
            marginTop: "40vh",
            background: "white",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
            borderRadius: "12px",
            padding: "16px",
          },
        }
      );
    });

    if (!confirmed) return;

    try {
      await toast.promise(approveLeaveRequest(id), {
        loading: "Approving...",
        success: "Leave request approved",
        error: "Failed to approve leave request",
      });
      loadLeaveRequest();
    } catch (error) {
      console.error("Failed to approve leave request:", error);
    }
  };

  const handleReject = async () => {
    const result = await new Promise<{ confirmed: boolean; reason: string }>((resolve) => {
      let reason = "";
      toast(
        (t) => (
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
              onChange={(e) => {
                reason = e.target.value;
              }}
              placeholder="Enter rejection reason..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  resolve({ confirmed: false, reason: "" });
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  resolve({ confirmed: true, reason });
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Reject
              </button>
            </div>
          </div>
        ),
        {
          duration: Infinity,
          position: "top-center",
          style: {
            marginTop: "40vh",
            background: "white",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
            borderRadius: "12px",
            padding: "16px",
          },
        }
      );
    });

    if (!result.confirmed) return;

    try {
      await toast.promise(rejectLeaveRequest(id, result.reason), {
        loading: "Rejecting...",
        success: "Leave request rejected",
        error: "Failed to reject leave request",
      });
      loadLeaveRequest();
    } catch (error) {
      console.error("Failed to reject leave request:", error);
    }
  };

  const handleDelete = async () => {
    const confirmed = await new Promise<boolean>((resolve) => {
      toast(
        (t) => (
          <div className="flex flex-col gap-4 min-w-[320px] p-2">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 text-base">Cancel this leave request?</p>
                <p className="text-sm text-gray-600 mt-1">This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  resolve(false);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                No, Keep it
              </button>
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  resolve(true);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        ),
        {
          duration: Infinity,
          position: "top-center",
          style: {
            marginTop: "40vh",
            background: "white",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
            borderRadius: "12px",
            padding: "16px",
          },
        }
      );
    });

    if (!confirmed) return;

    try {
      await toast.promise(deleteLeaveRequest(id), {
        loading: "Cancelling...",
        success: "Leave request cancelled",
        error: "Failed to cancel leave request",
      });
      router.push("/dashboard/hr/leave");
    } catch (error) {
      console.error("Failed to cancel leave request:", error);
    }
  };

  if (loading) {
    return <HRPageShell title="Leave Request" subtitle="Loading leave request…" loading />;
  }

  if (!leaveRequest) {
    return (
      <HRPageShell title="Leave Request Not Found" subtitle="This request could not be loaded" variant="fullscreen">
        <div className={`${hrCardClass} p-8 text-center w-full`}>
          <p className="text-gray-600 dark:text-muted-foreground mb-4">Leave request not found</p>
          <Link href="/dashboard/hr/leave">
            <Button className="bg-[#22C55E] hover:bg-[#16A34A] text-white">View leave management</Button>
          </Link>
        </div>
      </HRPageShell>
    );
  }

  const initials = leaveRequest.employee_name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const isPending = leaveRequest.status === "pending";

  return (
    <HRPageShell
      variant="fullscreen"
      title={
        <>
          {leaveRequest.employee_name}
          <span className="text-muted-foreground font-normal font-mono text-sm">
            Request #{leaveRequest.id}
          </span>
        </>
      }
    >
      <div className="space-y-6 w-full">
        <div className={`${hrCardClass} p-6 lg:p-8 relative`}>
          <div className="absolute top-4 right-4 z-10 flex flex-wrap justify-end gap-2 max-w-[70%]">
            {isPending ? (
              <>
                <Button
                  size="sm"
                  onClick={handleApprove}
                  className="h-8 gap-1.5 bg-green-600 hover:bg-green-700 text-white shadow-sm"
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleReject}
                  className="h-8 gap-1.5 bg-white dark:bg-card border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 shadow-sm"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Reject
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDelete}
                  className="h-8 gap-1.5 bg-white dark:bg-card border-gray-200 dark:border-border shadow-sm"
                >
                  Cancel request
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={handleDelete}
                className="h-8 gap-1.5 bg-white dark:bg-card border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 shadow-sm"
              >
                Cancel request
              </Button>
            )}
          </div>

          <div className="flex items-start gap-4 min-w-0 pr-4 sm:pr-72">
            <div className="w-16 h-16 rounded-full bg-[#22C55E] flex items-center justify-center text-white font-bold text-xl shrink-0 ring-4 ring-[#22C55E]/10">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-foreground flex items-center gap-1.5">
                <User className="h-4 w-4 shrink-0 text-gray-500 dark:text-muted-foreground" />
                <span className="truncate">{leaveRequest.employee_name}</span>
              </p>
              <p className="text-sm text-gray-500 dark:text-muted-foreground mt-1">
                {leaveRequest.leave_type_name}
              </p>
              <div className="mt-2">
                <LeaveStatusBadge status={leaveRequest.status} />
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className={hrStatCardClass}>
              <p className="text-xs text-gray-500 dark:text-muted-foreground font-medium">Duration</p>
              <p className="text-xl font-bold text-gray-900 dark:text-foreground mt-1">
                {leaveRequest.days_requested} day{leaveRequest.days_requested === 1 ? "" : "s"}
              </p>
            </div>
            <div className={hrStatCardClass}>
              <p className="text-xs text-gray-500 dark:text-muted-foreground font-medium">Start date</p>
              <p className="text-lg font-bold text-gray-900 dark:text-foreground mt-1">
                <FormattedDate value={leaveRequest.start_date} />
              </p>
            </div>
            <div className={hrStatCardClass}>
              <p className="text-xs text-gray-500 dark:text-muted-foreground font-medium">End date</p>
              <p className="text-lg font-bold text-gray-900 dark:text-foreground mt-1">
                <FormattedDate value={leaveRequest.end_date} />
              </p>
            </div>
            <div className={hrStatCardClass}>
              <p className="text-xs text-gray-500 dark:text-muted-foreground font-medium">Applied on</p>
              <p className="text-lg font-bold text-gray-900 dark:text-foreground mt-1">
                <FormattedDate value={leaveRequest.created_at} />
              </p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100 dark:border-border">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-foreground border-b border-gray-100 dark:border-border pb-2 mb-4">
              Request details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <DetailItem
                icon={User}
                label="Employee"
                value={
                  <Link
                    href={`/dashboard/hr/employees/${leaveRequest.employee}`}
                    className="hover:text-[#22C55E] transition-colors"
                  >
                    {leaveRequest.employee_name}
                  </Link>
                }
              />
              <DetailItem icon={FileText} label="Leave type" value={leaveRequest.leave_type_name} />
              <DetailItem icon={CalendarOff} label="Status" value={<LeaveStatusBadge status={leaveRequest.status} />} />
              <DetailItem
                icon={Calendar}
                label="Start date"
                value={<FormattedDate value={leaveRequest.start_date} />}
              />
              <DetailItem
                icon={Calendar}
                label="End date"
                value={<FormattedDate value={leaveRequest.end_date} />}
              />
              <DetailItem icon={Clock} label="Duration" value={`${leaveRequest.days_requested} days`} />
              <DetailItem
                icon={Clock}
                label="Applied on"
                value={<FormattedDate value={leaveRequest.created_at} />}
              />
              <DetailItem
                icon={Clock}
                label="Last updated"
                value={<FormattedDate value={leaveRequest.updated_at} />}
              />
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100 dark:border-border">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-foreground border-b border-gray-100 dark:border-border pb-2 mb-4">
              Reason
            </h3>
            <p className="text-sm text-gray-900 dark:text-foreground whitespace-pre-wrap leading-relaxed">
              {leaveRequest.reason || "—"}
            </p>
          </div>

          {leaveRequest.status === "approved" && leaveRequest.approved_by_name && (
            <div className="mt-6 pt-6 border-t border-gray-100 dark:border-border">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-foreground border-b border-gray-100 dark:border-border pb-2 mb-4">
                Approval
              </h3>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-green-50 dark:bg-green-500/10 flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-muted-foreground">Approved by</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-foreground mt-0.5">
                    {leaveRequest.approved_by_name}
                  </p>
                  {leaveRequest.approved_at && (
                    <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1">
                      on <FormattedDate value={leaveRequest.approved_at} />
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {leaveRequest.status === "rejected" && leaveRequest.rejection_reason && (
            <div className="mt-6 pt-6 border-t border-gray-100 dark:border-border">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-foreground border-b border-gray-100 dark:border-border pb-2 mb-4">
                Rejection
              </h3>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
                  <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 dark:text-muted-foreground">Rejection reason</p>
                  <p className="text-sm text-gray-900 dark:text-foreground mt-0.5 whitespace-pre-wrap leading-relaxed">
                    {leaveRequest.rejection_reason}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className={`${hrCardClass} p-4`}>
          <div className="flex flex-wrap gap-2">
            <Link href={`/dashboard/hr/employees/${leaveRequest.employee}`}>
              <Button variant="outline" size="sm" className="h-9 gap-2">
                <User className="h-4 w-4" />
                View employee profile
              </Button>
            </Link>
            <Link href="/dashboard/hr/leave">
              <Button variant="outline" size="sm" className="h-9 gap-2">
                <FileText className="h-4 w-4" />
                Leave management
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </HRPageShell>
  );
}
