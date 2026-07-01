export type DateCalendarSystem = "AD" | "BS";

export const DATE_SYSTEM_STORAGE_KEY = "khata_date_calendar_system";

export const NEPALI_MONTHS = [
  "Baisakh",
  "Jestha",
  "Ashadh",
  "Shrawan",
  "Bhadra",
  "Ashwin",
  "Kartik",
  "Mangsir",
  "Poush",
  "Magh",
  "Falgun",
  "Chaitra",
] as const;

export const BS_YEAR_MIN = 2000;
export const BS_YEAR_MAX = 2090;
