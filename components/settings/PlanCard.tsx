"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PlanCardProps {
  name: string;
  price: number;
  features: string[];
  isCurrent?: boolean;
  onSelect?: () => void;
}

export function PlanCard({
  name,
  price,
  features,
  isCurrent = false,
  onSelect,
}: PlanCardProps) {
  return (
    <div
      className={`bg-white rounded-xl border p-5 shadow-sm ${
        isCurrent
          ? "border-[#22C55E] ring-1 ring-[#22C55E]"
          : "border-gray-100"
      }`}
    >
      {isCurrent && (
        <div className="text-xs font-semibold text-[#22C55E] mb-2">
          Current Plan
        </div>
      )}
      <p className="font-bold text-gray-800 text-lg">{name}</p>
      <p className="text-2xl font-bold text-gray-900 mt-2">
        Rs. {price.toLocaleString()}
        <span className="text-sm font-normal text-gray-500">/mo</span>
      </p>
      <ul className="mt-4 space-y-2">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
            <Check className="h-3.5 w-3.5 text-[#22C55E] shrink-0" />
            {f}
          </li>
        ))}
      </ul>
      <Button
        className={`w-full mt-5 ${
          isCurrent
            ? "bg-gray-100 text-gray-500 cursor-default"
            : "bg-[#22C55E] hover:bg-[#16A34A] text-white"
        }`}
        disabled={isCurrent}
        onClick={onSelect}
      >
        {isCurrent ? "Current Plan" : "Upgrade"}
      </Button>
    </div>
  );
}
