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

export function MonthYearPicker({ value, onChange, className = "" }: MonthYearPickerProps) {
  const { dateSystem } = useDateSystemStore();

  // Parse current value (ISO YYYY-MM format)
  const [adYear, adMonth] = value.split('-').map(Number);
  
  // Convert to BS if needed
  const bsParts = adIsoToBsParts(`${value}-15`); // Use mid-month for conversion
  const bsYear = bsParts?.year ?? 2081;
  const bsMonth = bsParts?.month ?? 1;

  const currentYear = dateSystem === 'BS' ? bsYear : adYear;
  const currentMonth = dateSystem === 'BS' ? bsMonth : adMonth;

  // Generate year options (last 5 years + next 2 years)
  const currentAdYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 8 }, (_, i) => currentAdYear - 5 + i);

  // BS year options (current BS year ± 5)
  const currentBsYear = adIsoToBsParts(new Date().toISOString().split('T')[0])?.year ?? 2081;
  const bsYearOptions = Array.from({ length: 11 }, (_, i) => currentBsYear - 5 + i);

  const handleYearChange = (year: string) => {
    const yearNum = parseInt(year);
    
    if (dateSystem === 'BS') {
      // Convert BS year/month to AD ISO format
      const adIso = bsPartsToAdIso({ year: yearNum, month: currentMonth, day: 15 });
      if (adIso) {
        const [y, m] = adIso.split('-');
        onChange(`${y}-${m}`);
      }
    } else {
      onChange(`${yearNum}-${String(currentMonth).padStart(2, '0')}`);
    }
  };

  const handleMonthChange = (month: string) => {
    const monthNum = parseInt(month);
    
    if (dateSystem === 'BS') {
      // Convert BS year/month to AD ISO format
      const adIso = bsPartsToAdIso({ year: currentYear, month: monthNum, day: 15 });
      if (adIso) {
        const [y, m] = adIso.split('-');
        onChange(`${y}-${m}`);
      }
    } else {
      onChange(`${currentYear}-${String(monthNum).padStart(2, '0')}`);
    }
  };

  const adMonthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const monthOptions = dateSystem === 'BS' 
    ? NEPALI_MONTHS.map((name, idx) => ({ value: idx + 1, label: name }))
    : adMonthNames.map((name, idx) => ({ value: idx + 1, label: name }));

  const yearsList = dateSystem === 'BS' ? bsYearOptions : yearOptions;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Select value={String(currentMonth)} onValueChange={handleMonthChange}>
        <SelectTrigger className="h-9 w-32 text-sm border-gray-200 bg-white">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {monthOptions.map(({ value, label }) => (
            <SelectItem key={value} value={String(value)}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={String(currentYear)} onValueChange={handleYearChange}>
        <SelectTrigger className="h-9 w-24 text-sm border-gray-200 bg-white">
          <SelectValue />
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
