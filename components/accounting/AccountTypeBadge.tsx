"use client";

const TYPE_STYLES: Record<string, string> = {
  Assets: "bg-blue-100 text-blue-700",
  Liabilities: "bg-red-100 text-red-700",
  Equity: "bg-purple-100 text-purple-700",
  Income: "bg-green-100 text-green-700",
  Expense: "bg-orange-100 text-orange-700",
};

export function AccountTypeBadge({ type }: { type: string }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_STYLES[type] ?? "bg-gray-100 text-gray-600"}`}>
      {type}
    </span>
  );
}
