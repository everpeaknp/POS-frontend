/** Shared helpers for POS vertical list fetches (DRF default page size is 25). */
export const POS_LIST_PARAMS = { page_size: 500 } as const;

export function unwrapList<T>(data: { results?: T[] } | T[] | null | undefined): T[] {
  if (!data) return [];
  return Array.isArray(data) ? data : data.results ?? [];
}

/** Nepal VAT rate used by POS checkout (must match backend pos.utils.POS_VAT_RATE). */
export const POS_VAT_RATE = 0.13;
