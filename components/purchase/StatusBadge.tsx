interface StatusBadgeProps { status: string }

const styles: Record<string, string> = {
  Draft: "bg-gray-100 text-gray-600",
  Sent: "bg-blue-100 text-blue-700",
  Received: "bg-green-100 text-green-700",
  "Partially Received": "bg-yellow-100 text-yellow-700",
  Cancelled: "bg-red-100 text-red-700",
  "Pending Approval": "bg-yellow-100 text-yellow-700",
  Approved: "bg-green-100 text-green-700",
  Rejected: "bg-red-100 text-red-700",
  "Converted to PO": "bg-blue-100 text-blue-700",
  Paid: "bg-green-100 text-green-700",
  Overdue: "bg-red-100 text-red-700",
  "Partially Paid": "bg-yellow-100 text-yellow-700",
  Issued: "bg-blue-100 text-blue-700",
  Applied: "bg-green-100 text-green-700",
  active: "bg-green-100 text-green-700",
  inactive: "bg-gray-100 text-gray-500",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${styles[status] ?? "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}
