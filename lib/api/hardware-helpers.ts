/** Shared helpers for hardware vertical list fetches (DRF default page size is 25). */
export const HARDWARE_LIST_PARAMS = { page_size: 500 } as const;

export function unwrapList<T>(data: { results?: T[] } | T[] | null | undefined): T[] {
  if (!data) return [];
  return Array.isArray(data) ? data : data.results ?? [];
}

export function availableCredit(customer: {
  credit_limit?: number;
  current_balance?: number;
  available_credit?: number;
}): number {
  if (customer.available_credit != null) {
    return Number(customer.available_credit);
  }
  return Math.max(0, (customer.credit_limit || 0) - (customer.current_balance || 0));
}
