/**
 * Valid POS session URL segments should be non-empty and not match reserved
 * route names. The backend accepts either a numeric PK or a session number
 * reference such as SES-0001, and we should not reject other valid identifier
 * formats prematurely on the client.
 */
const SESSION_REF_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]*$/;
const RESERVED_SESSION_SEGMENTS = new Set(["new", "close"]);

export function isValidPosSessionRef(ref: string | undefined): ref is string {
  if (!ref) {
    return false;
  }

  const normalizedRef = ref.trim();
  if (!normalizedRef || RESERVED_SESSION_SEGMENTS.has(normalizedRef.toLowerCase())) {
    return false;
  }

  return SESSION_REF_PATTERN.test(normalizedRef);
}

export function extractPosSessionRef(pathname: string): string | undefined {
  const match = pathname.match(/\/dashboard\/pos\/sessions\/([^/]+)/);
  const segment = match?.[1] ? decodeURIComponent(match[1]) : undefined;
  return isValidPosSessionRef(segment) ? segment : undefined;
}
