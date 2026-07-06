export function LeaveStatusBadge({ status }: { status: "pending" | "approved" | "rejected" | "cancelled" }) {
  const styles = {
    pending: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
    approved: "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400",
    rejected: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400",
    cancelled: "bg-gray-100 text-gray-700 dark:bg-muted dark:text-muted-foreground",
  };

  const labels = {
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
    cancelled: "Cancelled",
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}
