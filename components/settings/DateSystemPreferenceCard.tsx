"use client";

import toast from "react-hot-toast";
import { Calendar } from "lucide-react";
import { useDateSystem } from "@/lib/context/DateSystemContext";
import type { DateCalendarSystem } from "@/lib/dates";
import { formatDisplayDate, todayIsoDate } from "@/lib/dates";
import { cn } from "@/lib/utils";

interface DateSystemPreferenceCardProps {
  variant?: "standalone" | "embedded";
  value?: DateCalendarSystem;
  onValueChange?: (system: DateCalendarSystem) => void;
  disabled?: boolean;
}

export function DateSystemPreferenceCard({
  variant = "standalone",
  value,
  onValueChange,
  disabled = false,
}: DateSystemPreferenceCardProps) {
  const { dateSystem, setDateSystem, loading } = useDateSystem();
  const activeSystem = value ?? dateSystem;
  const sample = formatDisplayDate(todayIsoDate(), activeSystem);
  const isControlled = value !== undefined && onValueChange !== undefined;

  const handleChange = async (system: DateCalendarSystem) => {
    if (system === activeSystem || disabled) return;

    if (isControlled) {
      onValueChange(system);
      return;
    }

    try {
      await setDateSystem(system);
      toast.success(
        `Date system switched to ${system === "BS" ? "Bikram Sambat" : "Gregorian (AD)"}`
      );
    } catch {
      toast.error("Failed to save date system preference");
    }
  };

  return (
    <div
      className={cn(
        variant === "standalone" &&
          "bg-white rounded-xl border border-gray-100 shadow-sm p-5 lg:p-6 mb-6 max-w-5xl"
      )}
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
          <Calendar className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Date System</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            Choose how dates are displayed across the app. Data is always stored in
            Gregorian (AD) format.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        {(
          [
            { id: "AD" as const, label: "Gregorian (AD)", hint: "e.g. 30 Jun 2026" },
            { id: "BS" as const, label: "Bikram Sambat (BS)", hint: "e.g. 16 Asar 2083" },
          ] as const
        ).map((option) => {
          const active = activeSystem === option.id;
          return (
            <button
              key={option.id}
              type="button"
              disabled={loading || disabled}
              onClick={() => handleChange(option.id)}
              className={`flex-1 rounded-xl border px-4 py-3 text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                active
                  ? "border-[#22C55E] bg-green-50 ring-1 ring-[#22C55E]/30"
                  : "border-gray-200 hover:border-gray-300 bg-white"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`text-sm font-semibold ${active ? "text-green-800" : "text-gray-800"}`}
                >
                  {option.label}
                </span>
                <span
                  className={`h-4 w-4 rounded-full border-2 shrink-0 ${
                    active ? "border-[#22C55E] bg-[#22C55E]" : "border-gray-300"
                  }`}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">{option.hint}</p>
            </button>
          );
        })}
      </div>

      <p className="text-xs text-gray-400 mt-4">
        Today: <span className="font-medium text-gray-600">{sample}</span>
        {!isControlled && !loading && (
          <span className="ml-2">
            · Saved{" "}
            {typeof window !== "undefined" &&
            localStorage.getItem("khata_date_calendar_system")
              ? "on this device"
              : ""}
          </span>
        )}
        {isControlled && (
          <span className="ml-2">· Saved when you click Save Changes</span>
        )}
      </p>
    </div>
  );
}
