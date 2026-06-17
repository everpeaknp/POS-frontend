export function EmploymentTypeBadge({ type }: { type: "Full-time" | "Part-time" | "Contract" | "Probation" }) {
  const styles = {
    "Full-time": "bg-blue-100 text-blue-700",
    "Part-time": "bg-purple-100 text-purple-700",
    Contract: "bg-orange-100 text-orange-700",
    Probation: "bg-yellow-100 text-yellow-700",
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${styles[type]}`}>
      {type}
    </span>
  );
}
