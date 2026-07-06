import { hrCardClass } from "@/components/dashboard/HRPageShell";

export function LeaveBalanceCard({ type, used, total }: { type: string; used: number; total: number }) {
  const remaining = Math.max(total - used, 0);
  const percentage = total > 0 ? Math.min((used / total) * 100, 100) : 0;

  return (
    <div className={`${hrCardClass} p-5`}>
      <div className="flex justify-between items-start mb-3">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-foreground">{type}</h4>
        <span className="text-xs text-gray-500 dark:text-muted-foreground">{remaining} remaining</span>
      </div>
      <div className="w-full bg-gray-100 dark:bg-muted rounded-full h-2">
        <div className="bg-[#22C55E] h-2 rounded-full transition-all" style={{ width: `${percentage}%` }} />
      </div>
      <div className="flex justify-between mt-2 text-xs text-gray-600 dark:text-muted-foreground">
        <span>{used} used</span>
        <span>{total} total</span>
      </div>
    </div>
  );
}
