"use client";

interface UsageProgressProps {
  label: string;
  current: number;
  limit: number;
  unit?: string;
}

export function UsageProgress({
  label,
  current,
  limit,
  unit = "",
}: UsageProgressProps) {
  const percentage = (current / limit) * 100;
  const isWarning = percentage > 75;
  const isCritical = percentage > 90;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-700">{label}</p>
        <p className="text-sm text-gray-600">
          {current} / {limit} {unit}
        </p>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full transition-all ${
            isCritical
              ? "bg-red-500"
              : isWarning
                ? "bg-amber-500"
                : "bg-[#22C55E]"
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}
