"use client";

import { Button } from "@/components/ui/button";
import { useDateSystem } from "@/lib/context/DateSystemContext";
import type { DateCalendarSystem } from "@/lib/dates";

interface DateSystemToggleProps {
  className?: string;
}

export function DateSystemToggle({ className }: DateSystemToggleProps) {
  const { dateSystem, setDateSystem, loading } = useDateSystem();

  const handleChange = (system: DateCalendarSystem) => {
    if (system !== dateSystem && !loading) {
      void setDateSystem(system);
    }
  };

  return (
    <div
      className={`flex items-center rounded-lg border border-gray-200 dark:border-border bg-white dark:bg-card p-0.5 ${className ?? ""}`}
    >
      {(["AD", "BS"] as const).map((system) => (
        <Button
          key={system}
          type="button"
          variant="ghost"
          size="sm"
          disabled={loading}
          className={`h-8 px-3 text-xs font-semibold ${
            dateSystem === system
              ? "bg-gray-100 dark:bg-muted text-gray-900 dark:text-foreground"
              : "text-gray-500 dark:text-muted-foreground"
          }`}
          onClick={() => handleChange(system)}
        >
          {system}
        </Button>
      ))}
    </div>
  );
}
