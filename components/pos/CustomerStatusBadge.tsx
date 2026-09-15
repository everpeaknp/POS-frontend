export function CustomerStatusBadge({ status }: { status: "active" | "inactive" }) {
  const styles = {
    active: "bg-slate-100 text-slate-700",
    inactive: "bg-gray-100 text-gray-700",
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
      {status === "active" ? "Active" : "Inactive"}
    </span>
  );
}
