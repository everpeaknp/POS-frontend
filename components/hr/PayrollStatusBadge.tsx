export function PayrollStatusBadge({ status }: { status: "draft" | "processed" | "paid" | "processing" }) {
  const styles = {
    draft: "bg-gray-100 text-gray-700",
    processed: "bg-blue-100 text-blue-700",
    processing: "bg-blue-100 text-blue-700",
    paid: "bg-green-100 text-green-700",
  };

  const labels = {
    draft: "Draft",
    processed: "Processed",
    processing: "Processing",
    paid: "Paid",
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}
