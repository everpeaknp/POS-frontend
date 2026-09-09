export function PosStatusBadge({ status }: { status: "open" | "closed" }) {
  const styles = {
    open: "bg-slate-100 text-slate-700",
    closed: "bg-gray-100 text-gray-700",
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
      {status === "open" ? "Open" : "Closed"}
    </span>
  );
}
