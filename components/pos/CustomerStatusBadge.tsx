export function CustomerStatusBadge({ status }: { status: "active" | "inactive" }) {
  const styles = {
    active: "bg-green-100 text-green-700",
    inactive: "bg-gray-100 text-gray-700",
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
      {status === "active" ? "Active" : "Inactive"}
    </span>
  );
}
