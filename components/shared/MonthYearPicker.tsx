"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDateSystemStore } from "@/lib/stores/dateSystemStore";
import { NEPALI_MONTHS } from "@/lib/dates";
import { adIsoToBsParts, bsPartsToAdIso } from "@/lib/dates/convert";

interface MonthYearPickerProps {
  value: string; // ISO format YYYY-MM
  onChange: (value: string) => void; // ISO format YYYY-MM
  className?: string;
}

const AD_MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function MonthYearPicker({ value, onChange, className = "" }: MonthYearPickerProps) {
  const { dateSystem } = useDateSystemStore();

  // Parse current value (ISO YYYY-MM format)
  const [adYear, adMonth] = value.split('-').map(Number);

  // Convert to BS if needed (monthIndex is 0-based, matching NEPALI_MONTHS)
  const bsParts = adIsoToBsParts(`${value}-15`); // Use mid-month for conversion
  const bsYear = bsParts?.year ?? 2081;
  const bsMonthIndex = bsParts?.monthIndex ?? 0;

  const currentYear = dateSystem === 'BS' ? bsYear : adYear;
  // Dropdown month values are always 1-based, regardless of calendar system
  const currentMonth = dateSystem === 'BS' ? bsMonthIndex + 1 : adMonth;

  // Generate year options (last 5 years + next 2 years)
  const currentAdYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 8 }, (_, i) => currentAdYear - 5 + i);

  // BS year options (current BS year ± 5)
  const currentBsYear = adIsoToBsParts(new Date().toISOString().split('T')[0])?.year ?? 2081;
  const bsYearOptions = Array.from({ length: 11 }, (_, i) => currentBsYear - 5 + i);

  const handleYearChange = (year: string) => {
    const yearNum = parseInt(year);

    if (dateSystem === 'BS') {
      // Convert BS year/month to AD ISO format (bsPartsToAdIso takes a 0-based monthIndex)
      const adIso = bsPartsToAdIso(yearNum, currentMonth - 1, 15);
      const [y, m] = adIso.split('-');
      onChange(`${y}-${m}`);
    } else {
      onChange(`${yearNum}-${String(currentMonth).padStart(2, '0')}`);
    }
  };

  const handleMonthChange = (month: string) => {
    const monthNum = parseInt(month);

    if (dateSystem === 'BS') {
      const adIso = bsPartsToAdIso(currentYear, monthNum - 1, 15);
      const [y, m] = adIso.split('-');
      onChange(`${y}-${m}`);
    } else {
      onChange(`${currentYear}-${String(monthNum).padStart(2, '0')}`);
    }
  };

  const monthOptions = dateSystem === 'BS'
    ? NEPALI_MONTHS.map((name, idx) => ({ value: idx + 1, label: name }))
    : AD_MONTH_NAMES.map((name, idx) => ({ value: idx + 1, label: name }));

  const yearsList = dateSystem === 'BS' ? bsYearOptions : yearOptions;
  const currentMonthLabel = monthOptions.find((m) => m.value === currentMonth)?.label ?? "";

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Select value={String(currentMonth)} onValueChange={(v) => v && handleMonthChange(v)}>
        <SelectTrigger className="h-9 w-32 text-sm border-gray-200 bg-white">
          <SelectValue placeholder={currentMonthLabel} />
        </SelectTrigger>
        <SelectContent>
          {monthOptions.map(({ value, label }) => (
            <SelectItem key={value} value={String(value)}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={String(currentYear)} onValueChange={(v) => v && handleYearChange(v)}>
        <SelectTrigger className="h-9 w-24 text-sm border-gray-200 bg-white">
          <SelectValue placeholder={String(currentYear)} />
        </SelectTrigger>
        <SelectContent>
          {yearsList.map((year) => (
            <SelectItem key={year} value={String(year)}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <span className={`px-1.5 py-0.5 rounded text-xs font-medium shrink-0 ${dateSystem === 'BS' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
        {dateSystem}
      </span>
    </div>
  );
}
