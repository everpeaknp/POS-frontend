"use client";

const TYPE_STYLES: Record<string, string> = {
  Assets: "bg-blue-500/15 text-blue-600 dark:text-blue-300 border border-blue-500/20",
  Liabilities: "bg-red-500/15 text-red-600 dark:text-red-300 border border-red-500/20",
  Equity: "bg-purple-500/15 text-purple-600 dark:text-purple-300 border border-purple-500/20",
  Income: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/20",
  Expense: "bg-orange-500/15 text-orange-600 dark:text-orange-300 border border-orange-500/20",
};

export function AccountTypeBadge({ type }: { type: string }) {
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
        TYPE_STYLES[type] ?? "bg-muted text-muted-foreground border border-border"
      }`}
    >
      {type}
    </span>
  );
}
