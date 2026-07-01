/** Licensed banks & finance companies in Nepal (NRB Class A, B, C). */

export const NEPAL_COMMERCIAL_BANKS = [
  "Agriculture Development Bank Ltd.",
  "Citizens Bank International Ltd.",
  "Everest Bank Ltd.",
  "Global IME Bank Ltd.",
  "Himalayan Bank Ltd.",
  "Kumari Bank Ltd.",
  "Laxmi Sunrise Bank Ltd.",
  "Machhapuchchhre Bank Ltd.",
  "Nabil Bank Ltd.",
  "Nepal Bank Ltd.",
  "Nepal Investment Mega Bank Ltd.",
  "Nepal SBI Bank Ltd.",
  "NIC Asia Bank Ltd.",
  "NMB Bank Ltd.",
  "Prabhu Bank Ltd.",
  "Prime Commercial Bank Ltd.",
  "Rastriya Banijya Bank",
  "Sanima Bank Ltd.",
  "Siddhartha Bank Ltd.",
  "Standard Chartered Bank Nepal Ltd.",
] as const;

export const NEPAL_DEVELOPMENT_BANKS = [
  "Corporate Development Bank Ltd.",
  "Excel Development Bank Ltd.",
  "Garima Bikas Bank Ltd.",
  "Green Development Bank Ltd.",
  "Jyoti Bikash Bank Ltd.",
  "Kamana Sewa Bikas Bank Ltd.",
  "Karnali Development Bank Ltd.",
  "Lumbini Bikas Bank Ltd.",
  "Mahalaxmi Bikas Bank Ltd.",
  "Miteri Development Bank Ltd.",
  "Muktinath Bikas Bank Ltd.",
  "Narayani Development Bank Ltd.",
  "Sahayogi Vikas Bank Ltd.",
  "Shangrila Development Bank Ltd.",
  "Shine Resunga Development Bank Ltd.",
  "Sindhu Bikas Bank Ltd.",
  "Tinau Mission Development Bank Ltd.",
] as const;

export const NEPAL_FINANCE_COMPANIES = [
  "Best Finance Company Ltd.",
  "Capital Merchant Banking & Finance Ltd.",
  "Central Finance Ltd.",
  "Goodwill Finance Ltd.",
  "Guheswori Merchant Banking & Finance Ltd.",
  "Gurkhas Finance Ltd.",
  "ICFC Finance Ltd.",
  "Janaki Finance Ltd.",
  "Manjushree Finance Ltd.",
  "Multipurpose Finance Company Ltd.",
  "Nepal Finance Ltd.",
  "Pokhara Finance Ltd.",
  "Progressive Finance Ltd.",
  "Reliance Finance Ltd.",
  "Samriddhi Finance Company Ltd.",
  "Shree Investment & Finance Co. Ltd.",
  "Siddhartha Finance Ltd.",
] as const;

export const NEPAL_BANK_NAMES: string[] = [
  ...NEPAL_COMMERCIAL_BANKS,
  ...NEPAL_DEVELOPMENT_BANKS,
  ...NEPAL_FINANCE_COMPANIES,
];

export const NEPAL_BANK_OTHER = "__other__";

export function getNepalBankComboboxOptions() {
  return [
    ...NEPAL_COMMERCIAL_BANKS.map((name) => ({
      value: name,
      label: name,
      subtitle: "Commercial Bank",
    })),
    ...NEPAL_DEVELOPMENT_BANKS.map((name) => ({
      value: name,
      label: name,
      subtitle: "Development Bank",
    })),
    ...NEPAL_FINANCE_COMPANIES.map((name) => ({
      value: name,
      label: name,
      subtitle: "Finance Company",
    })),
    {
      value: NEPAL_BANK_OTHER,
      label: "Other (enter manually)",
      subtitle: "Bank not listed above",
    },
  ];
}

export function resolveBankName(selection: string, customName: string): string {
  if (selection === NEPAL_BANK_OTHER) return customName.trim();
  return selection.trim();
}

export function splitBankNameForForm(bankName: string): {
  selection: string;
  customName: string;
} {
  const trimmed = bankName.trim();
  if (!trimmed) return { selection: "", customName: "" };
  if (NEPAL_BANK_NAMES.includes(trimmed)) {
    return { selection: trimmed, customName: "" };
  }
  return { selection: NEPAL_BANK_OTHER, customName: trimmed };
}
