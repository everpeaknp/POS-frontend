import { useParams, usePathname } from "next/navigation";

/**
 * Resolve a dynamic route param reliably in Next.js 16.
 * Prefers parsing from pathname when a pattern is given, since useParams()
 * can briefly return stale or incorrect values during client navigation.
 */
export function useRouteParam(
  name: string,
  pathnamePattern?: RegExp
): string | undefined {
  const params = useParams();
  const pathname = usePathname();

  if (pathnamePattern) {
    const match = pathname.match(pathnamePattern);
    if (match?.[1]) {
      return decodeURIComponent(match[1]);
    }
  }

  const raw = params[name];
  if (Array.isArray(raw)) {
    return raw[0];
  }

  return raw;
}
