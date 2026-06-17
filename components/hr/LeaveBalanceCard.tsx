export function LeaveBalanceCard({ type, used, total }: { type: string; used: number; total: number }) {
  const remaining = total - used;
  const percentage = (used / total) * 100;

  return (
    <div className="bg-white rounded-lg border border-gray-100 p-4">
      <div className="flex justify-between items-start mb-3">
        <h4 className="text-sm font-medium text-gray-900">{type}</h4>
        <span className="text-xs text-gray-500">{remaining} remaining</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div className="bg-[#22C55E] h-2 rounded-full" style={{ width: `${percentage}%` }} />
      </div>
      <div className="flex justify-between mt-2 text-xs text-gray-600">
        <span>{used} used</span>
        <span>{total} total</span>
      </div>
    </div>
  );
}
