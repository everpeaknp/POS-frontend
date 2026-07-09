/** Shared helpers for reports module list fetches. */
export const REPORTS_LIST_PARAMS = { page_size: 500 } as const;

export function unwrapList<T>(data: { results?: T[] } | T[] | null | undefined): T[] {
  if (!data) return [];
  return Array.isArray(data) ? data : data.results ?? [];
}
