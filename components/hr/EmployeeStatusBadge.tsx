export function EmployeeStatusBadge({ status }: { status: "active" | "inactive" | "on_leave" | "terminated" }) {
  const styles = {
    active: "bg-green-100 text-green-700",
    inactive: "bg-gray-100 text-gray-700",
    on_leave: "bg-amber-100 text-amber-700",
    terminated: "bg-red-100 text-red-700",
  };

  const labels = {
    active: "Active",
    inactive: "Inactive",
    on_leave: "On Leave",
    terminated: "Terminated",
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}
