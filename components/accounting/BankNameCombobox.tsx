"use client";

import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import {
  getNepalBankComboboxOptions,
  NEPAL_BANK_NAMES,
  NEPAL_BANK_OTHER,
} from "@/lib/data/nepal-banks";

interface BankNameComboboxProps {
  value: string;
  onChange: (bankName: string) => void;
  disabled?: boolean;
}

export function BankNameCombobox({ value, onChange, disabled }: BankNameComboboxProps) {
  const isListed = value && NEPAL_BANK_NAMES.includes(value);
  const selection = isListed ? value : value ? NEPAL_BANK_OTHER : "";
  const customName = isListed ? "" : value;

  const handleSelect = (selected: string) => {
    if (selected === NEPAL_BANK_OTHER) {
      onChange(customName || "");
      return;
    }
    onChange(selected);
  };

  const handleCustomChange = (name: string) => {
    onChange(name);
  };

  return (
    <div className="space-y-2">
      <Combobox
        options={getNepalBankComboboxOptions()}
        value={selection}
        onValueChange={handleSelect}
        placeholder="Search & select bank..."
        searchPlaceholder="Search Nepal banks..."
        emptyText="No bank found. Choose 'Other' to type manually."
        disabled={disabled}
        className="border-gray-200"
      />
      {selection === NEPAL_BANK_OTHER && (
        <Input
          className="h-9 text-sm border-gray-200"
          placeholder="Enter bank name"
          value={customName}
          onChange={(e) => handleCustomChange(e.target.value)}
          disabled={disabled}
        />
      )}
    </div>
  );
}
