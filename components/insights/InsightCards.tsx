"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Insight } from "@/lib/insights/generateInsights";
import { useRouter } from "next/navigation";

interface InsightCardsProps {
  insights: Insight[];
  language: "en" | "ne"; // language preference
}

export function InsightCards({ insights, language }: InsightCardsProps) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    const stored = localStorage.getItem("dismissed-insights");
    return stored ? new Set(stored.split(",")) : new Set();
  });

  const [visibleInsights, setVisibleInsights] = useState(insights);
  const router = useRouter();

  useEffect(() => {
    const filtered = insights.filter(
      (insight, idx) => !dismissedIds.has(`${insight.type}-${idx}`)
    );
    setVisibleInsights(filtered);
  }, [insights, dismissedIds]);

  const handleDismiss = (insight: Insight, idx: number) => {
    const newDismissed = new Set(dismissedIds);
    newDismissed.add(`${insight.type}-${idx}`);
    setDismissedIds(newDismissed);
    localStorage.setItem("dismissed-insights", Array.from(newDismissed).join(","));
  };

  const handleAction = (action_link?: string) => {
    if (action_link) {
      router.push(action_link);
    }
  };

  if (visibleInsights.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 mb-6">
      {visibleInsights.map((insight, idx) => (
        <div
          key={`${insight.type}-${idx}`}
          className="relative bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
        >
          {/* Close button */}
          <button
            onClick={() => handleDismiss(insight, idx)}
            className="absolute top-2 right-2 p-1 hover:bg-gray-100 rounded-lg transition text-gray-400 hover:text-gray-600"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Insight message */}
          <p className="text-sm font-medium text-gray-900 pr-6 mb-3">
            {language === "en" ? insight.message_en : insight.message_ne}
          </p>

          {/* Action button (optional) */}
          {insight.action_link && (
            <button
              onClick={() => handleAction(insight.action_link)}
              className="text-xs px-3 py-1.5 rounded-lg bg-[#4A5D7A] text-white font-medium hover:bg-[#4A5D7A]/90 transition"
            >
              {insight.action_label || (language === "en" ? "View" : "हेर्नुहोस्")}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
