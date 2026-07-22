/** Shared helpers for POS vertical list fetches (DRF default page size is 25). */
export const POS_LIST_PARAMS = { page_size: 500 } as const;

export function unwrapList<T>(data: { results?: T[] } | T[] | null | undefined): T[] {
  if (!data) return [];
  return Array.isArray(data) ? data : data.results ?? [];
}

/**
 * Default Nepal VAT rate — used as fallback when POS settings haven't loaded yet.
 * The POS checkout page should fetch the actual rate from the settings API.
 */
export const POS_VAT_RATE_DEFAULT = 0.13;
