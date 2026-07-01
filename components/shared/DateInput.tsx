"use client";

import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useDateSystem } from "@/lib/context/DateSystemContext";
import {
  adIsoToBsParts,
  bsPartsToAdIso,
  getBsDaysInMonth,
  NEPALI_MONTHS,
  BS_YEAR_MIN,
  BS_YEAR_MAX,
} from "@/lib/dates";

interface DateInputProps {
  value: string;
  onChange: (isoDate: string) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
  required?: boolean;
}

export function DateInput({
  value,
  onChange,
  disabled,
  className,
  id,
  required,
}: DateInputProps) {
  const { dateSystem } = useDateSystem();

  if (dateSystem === "AD") {
    return (
      <Input
        id={id}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        required={required}
        className={cn("h-9 text-sm border-gray-200", className)}
      />
    );
  }

  return (
    <BsDateInput
      id={id}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={className}
      required={required}
    />
  );
}

function BsDateInput({
  value,
  onChange,
  disabled,
  className,
  id,
  required,
}: DateInputProps) {
  const parts = useMemo(() => {
    if (value) {
      const bs = adIsoToBsParts(value);
      if (bs) return bs;
    }
    const now = adIsoToBsParts(new Date().toISOString().split("T")[0]);
    return now ?? { year: 2081, monthIndex: 0, day: 1 };
  }, [value]);

  const daysInMonth = useMemo(
    () => getBsDaysInMonth(parts.year, parts.monthIndex),
    [parts.year, parts.monthIndex]
  );

  const yearOptions = useMemo(() => {
    const years: number[] = [];
    for (let y = BS_YEAR_MAX; y >= BS_YEAR_MIN; y -= 1) years.push(y);
    return years;
  }, []);

  const dayOptions = useMemo(
    () => Array.from({ length: daysInMonth }, (_, i) => i + 1),
    [daysInMonth]
  );

  const update = (next: Partial<typeof parts>) => {
    const year = next.year ?? parts.year;
    const monthIndex = next.monthIndex ?? parts.monthIndex;
    let day = next.day ?? parts.day;
    const maxDay = getBsDaysInMonth(year, monthIndex);
    if (day > maxDay) day = maxDay;
    onChange(bsPartsToAdIso(year, monthIndex, day));
  };

  return (
    <div id={id} className={cn("grid grid-cols-3 gap-2", className)}>
      <Select
        value={String(parts.year)}
        onValueChange={(v) => update({ year: Number(v) })}
        disabled={disabled}
      >
        <SelectTrigger className="h-9 text-sm border-gray-200" aria-required={required}>
          <SelectValue placeholder="Year" />
        </SelectTrigger>
        <SelectContent>
          {yearOptions.map((y) => (
            <SelectItem key={y} value={String(y)}>
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={String(parts.monthIndex)}
        onValueChange={(v) => update({ monthIndex: Number(v) })}
        disabled={disabled}
      >
        <SelectTrigger className="h-9 text-sm border-gray-200">
          <SelectValue placeholder="Month" />
        </SelectTrigger>
        <SelectContent>
          {NEPALI_MONTHS.map((m, i) => (
            <SelectItem key={m} value={String(i)}>
              {m}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={String(parts.day)}
        onValueChange={(v) => update({ day: Number(v) })}
        disabled={disabled}
      >
        <SelectTrigger className="h-9 text-sm border-gray-200">
          <SelectValue placeholder="Day" />
        </SelectTrigger>
        <SelectContent>
          {dayOptions.map((d) => (
            <SelectItem key={d} value={String(d)}>
              {d}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
