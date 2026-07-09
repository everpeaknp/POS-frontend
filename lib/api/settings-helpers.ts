import apiClient from './client';

/** DRF default page size is 25 — settings lists need full pages. */
export const SETTINGS_LIST_PARAMS = { page_size: 500 } as const;

export function unwrapList<T>(data: { results?: T[] } | T[] | null | undefined): T[] {
  if (!data) return [];
  return Array.isArray(data) ? data : data.results ?? [];
}

export async function fetchAllPages<T>(
  path: string,
  params?: Record<string, string | number | boolean | undefined>
): Promise<T[]> {
  const results: T[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await apiClient.get(path, {
      params: { ...SETTINGS_LIST_PARAMS, ...params, page },
    });
    const data = response.data;
    if (Array.isArray(data)) {
      return data;
    }
    results.push(...(data.results ?? []));
    hasMore = Boolean(data.next);
    page += 1;
  }

  return results;
}
